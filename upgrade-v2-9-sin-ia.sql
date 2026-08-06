begin;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text not null unique,
  email text,
  completed_orders integer not null default 0,
  total_spent numeric(12,2) not null default 0,
  loyalty_level text not null default 'bronze' check (loyalty_level in ('bronze','silver','gold','vip')),
  available_discount integer not null default 0 check (available_discount in (0,5,10,20)),
  discount_used boolean not null default false,
  last_order_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text not null unique,
  email text,
  consent boolean not null default false,
  first_purchase_discount integer not null default 5,
  discount_used boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.product_events (
  id bigint generated always as identity primary key,
  product_id uuid references public.products(id) on delete cascade,
  event_type text not null check (event_type in ('view','cart','share','purchase')),
  session_id text,
  customer_id uuid references public.customers(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_percent integer not null check (discount_percent between 1 and 90),
  minimum_purchase numeric(10,2) not null default 0,
  max_uses integer,
  uses integer not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists customer_id uuid references public.customers(id) on delete set null;
alter table public.orders add column if not exists discount_percent integer not null default 0;
alter table public.orders add column if not exists discount_amount numeric(10,2) not null default 0;
alter table public.orders add column if not exists coupon_code text;

create or replace function public.refresh_customer_loyalty(p_customer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
  spent numeric(12,2);
  reward integer := 0;
  level_name text := 'bronze';
begin
  select count(*), coalesce(sum(total),0)
  into n, spent
  from public.orders
  where customer_id = p_customer_id and status in ('paid','delivered');

  if n >= 20 then level_name := 'vip';
  elsif n >= 10 then level_name := 'gold'; reward := 20;
  elsif n >= 5 then level_name := 'silver'; reward := 10;
  end if;

  update public.customers
  set completed_orders = n,
      total_spent = spent,
      loyalty_level = level_name,
      available_discount = case
        when discount_used = false then greatest(available_discount,reward)
        else reward
      end,
      discount_used = false,
      last_order_at = now(),
      updated_at = now()
  where id = p_customer_id;
end;
$$;

create or replace function public.orders_loyalty_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.customer_id is not null and new.status in ('paid','delivered') and old.status is distinct from new.status then
    perform public.refresh_customer_loyalty(new.customer_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_loyalty on public.orders;
create trigger trg_orders_loyalty
after update of status on public.orders
for each row execute function public.orders_loyalty_trigger();

create or replace view public.product_performance as
select
  p.id,
  p.code,
  p.name,
  p.stock,
  p.price,
  p.active,
  count(*) filter (where e.event_type='view') as views,
  count(*) filter (where e.event_type='cart') as cart_adds,
  count(*) filter (where e.event_type='purchase') as purchases,
  max(e.created_at) as last_activity,
  case
    when count(*) filter (where e.event_type='purchase') >= 5 then 'trending'
    when p.stock > 0 and count(*) filter (where e.event_type='purchase') = 0 and coalesce(max(e.created_at),p.created_at) < now() - interval '30 days' then 'slow'
    else 'normal'
  end as movement
from public.products p
left join public.product_events e on e.product_id=p.id
  and e.created_at >= now() - interval '30 days'
group by p.id;

alter table public.customers enable row level security;
alter table public.subscribers enable row level security;
alter table public.product_events enable row level security;
alter table public.coupons enable row level security;

drop policy if exists "public subscribe" on public.subscribers;
create policy "public subscribe" on public.subscribers for insert to anon, authenticated with check (consent = true);
drop policy if exists "authenticated manage subscribers" on public.subscribers;
create policy "authenticated manage subscribers" on public.subscribers for all to authenticated using (true) with check (true);

drop policy if exists "public create product events" on public.product_events;
create policy "public create product events" on public.product_events for insert to anon, authenticated with check (true);
drop policy if exists "authenticated read product events" on public.product_events;
create policy "authenticated read product events" on public.product_events for select to authenticated using (true);

drop policy if exists "authenticated manage customers" on public.customers;
create policy "authenticated manage customers" on public.customers for all to authenticated using (true) with check (true);

drop policy if exists "public read active coupons" on public.coupons;
create policy "public read active coupons" on public.coupons for select to anon, authenticated using (active = true and (starts_at is null or starts_at <= now()) and (expires_at is null or expires_at >= now()));
drop policy if exists "authenticated manage coupons" on public.coupons;
create policy "authenticated manage coupons" on public.coupons for all to authenticated using (true) with check (true);

commit;
