begin;

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type text not null check (movement_type in ('in','out','adjustment')),
  quantity integer not null,
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null default 'percent' check (discount_type in ('percent','fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  minimum_purchase numeric(10,2) not null default 0,
  max_uses integer,
  uses_count integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  promotion_type text not null check (promotion_type in ('percent','fixed','2x1','3x2','combo')),
  value numeric(10,2),
  product_ids uuid[] default '{}',
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.deleted_products (
  id uuid primary key default gen_random_uuid(),
  original_product_id uuid,
  snapshot jsonb not null,
  deleted_by uuid,
  deleted_at timestamptz not null default now()
);

create table if not exists public.product_recommendations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  recommendation_type text not null,
  title text not null,
  details text,
  suggested_action text,
  status text not null default 'pending' check (status in ('pending','applied','ignored')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.store_settings add column if not exists tiktok text default 'https://www.tiktok.com/@tlazotli0';
alter table public.store_settings add column if not exists logo_url text;
alter table public.store_settings add column if not exists banner_url text;
alter table public.store_settings add column if not exists primary_color text default '#d7a9b7';
alter table public.store_settings add column if not exists secondary_color text default '#7b7a4e';
alter table public.store_settings add column if not exists purchase_message text default 'Gracias por comprar en TLAZOTLI.';
alter table public.orders add column if not exists customer_id uuid;
alter table public.orders add column if not exists discount_total numeric(10,2) not null default 0;
alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists delivery_notes text;

alter table public.product_images enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.coupons enable row level security;
alter table public.promotions enable row level security;
alter table public.deleted_products enable row level security;
alter table public.product_recommendations enable row level security;

drop policy if exists "public read product images" on public.product_images;
create policy "public read product images" on public.product_images for select to anon,authenticated using (true);
drop policy if exists "admin manage product images" on public.product_images;
create policy "admin manage product images" on public.product_images for all to authenticated using (true) with check (true);

drop policy if exists "admin manage inventory movements" on public.inventory_movements;
create policy "admin manage inventory movements" on public.inventory_movements for all to authenticated using (true) with check (true);
drop policy if exists "public read active coupons" on public.coupons;
create policy "public read active coupons" on public.coupons for select to anon,authenticated using (active=true or auth.role()='authenticated');
drop policy if exists "admin manage coupons" on public.coupons;
create policy "admin manage coupons" on public.coupons for all to authenticated using (true) with check (true);
drop policy if exists "public read active promotions" on public.promotions;
create policy "public read active promotions" on public.promotions for select to anon,authenticated using (active=true or auth.role()='authenticated');
drop policy if exists "admin manage promotions" on public.promotions;
create policy "admin manage promotions" on public.promotions for all to authenticated using (true) with check (true);
drop policy if exists "admin manage deleted products" on public.deleted_products;
create policy "admin manage deleted products" on public.deleted_products for all to authenticated using (true) with check (true);
drop policy if exists "admin manage recommendations" on public.product_recommendations;
create policy "admin manage recommendations" on public.product_recommendations for all to authenticated using (true) with check (true);

commit;