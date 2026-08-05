begin;

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text not null,
  brand text,
  price numeric(10,2),
  category text not null default 'Otros',
  description text,
  image_url text,
  active boolean not null default true,
  stock integer not null default 0,
  low_stock_threshold integer not null default 3,
  on_sale boolean not null default false,
  sale_price numeric(10,2),
  featured boolean not null default false,
  is_new boolean not null default false,
  best_seller boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists code text;
alter table public.products add column if not exists stock integer not null default 0;
alter table public.products add column if not exists low_stock_threshold integer not null default 3;
alter table public.products add column if not exists on_sale boolean not null default false;
alter table public.products add column if not exists sale_price numeric(10,2);
alter table public.products add column if not exists featured boolean not null default false;
alter table public.products add column if not exists is_new boolean not null default false;
alter table public.products add column if not exists best_seller boolean not null default false;
alter table public.products alter column price drop not null;

update public.products set stock = 0 where stock is null;
update public.products set low_stock_threshold = 3 where low_stock_threshold is null;

alter table public.products drop constraint if exists products_stock_check;
alter table public.products add constraint products_stock_check check (stock >= 0);
alter table public.products drop constraint if exists products_low_stock_check;
alter table public.products add constraint products_low_stock_check check (low_stock_threshold >= 0);
alter table public.products drop constraint if exists products_price_check;
alter table public.products add constraint products_price_check check (price is null or price >= 0);
alter table public.products drop constraint if exists products_sale_price_check;
alter table public.products add constraint products_sale_price_check check (sale_price is null or sale_price >= 0);
alter table public.products drop constraint if exists products_sale_logic_check;
alter table public.products add constraint products_sale_logic_check check (not on_sale or (sale_price is not null and price is not null and sale_price < price));

drop index if exists public.products_code_key;
alter table public.products drop constraint if exists products_code_unique;
alter table public.products add constraint products_code_unique unique (code);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.categories (name, sort_order) values
('Maquillaje',10),('Skincare',20),('Cuidado corporal',30),('Accesorios',40),('Papelería',50),('Dulces y snacks',60),('Otros',70)
on conflict (name) do nothing;

create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  store_name text not null default 'TLAZOTLI',
  whatsapp text not null default '8333074838',
  instagram text not null default '@_tlazotli_mex_',
  bank_name text default 'Banamex',
  bank_holder text default 'Liliana Martínez',
  bank_account text default '5204160407957203',
  payment_note text default 'Después de realizar el pago, comparte tu comprobante. Gracias por tu compra.',
  updated_at timestamptz not null default now()
);
insert into public.store_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_name text,
  customer_phone text,
  payment_method text,
  status text not null default 'pending' check (status in ('pending','paid','delivered','cancelled')),
  total numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(10,2),
  quantity integer not null check (quantity > 0),
  subtotal numeric(10,2),
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "public can read active products" on public.products;
create policy "public can read active products" on public.products for select to anon, authenticated using (active = true or auth.role() = 'authenticated');
drop policy if exists "authenticated manage products" on public.products;
create policy "authenticated manage products" on public.products for all to authenticated using (true) with check (true);

drop policy if exists "public can read categories" on public.categories;
create policy "public can read categories" on public.categories for select to anon, authenticated using (active = true or auth.role() = 'authenticated');
drop policy if exists "authenticated manage categories" on public.categories;
create policy "authenticated manage categories" on public.categories for all to authenticated using (true) with check (true);

drop policy if exists "public can read settings" on public.store_settings;
create policy "public can read settings" on public.store_settings for select to anon, authenticated using (true);
drop policy if exists "authenticated manage settings" on public.store_settings;
create policy "authenticated manage settings" on public.store_settings for all to authenticated using (true) with check (true);

drop policy if exists "public can create orders" on public.orders;
create policy "public can create orders" on public.orders for insert to anon, authenticated with check (true);
drop policy if exists "authenticated manage orders" on public.orders;
create policy "authenticated manage orders" on public.orders for all to authenticated using (true) with check (true);

drop policy if exists "public can create order items" on public.order_items;
create policy "public can create order items" on public.order_items for insert to anon, authenticated with check (true);
drop policy if exists "authenticated manage order items" on public.order_items;
create policy "authenticated manage order items" on public.order_items for all to authenticated using (true) with check (true);

insert into storage.buckets (id,name,public) values ('product-images','product-images',true)
on conflict (id) do update set public = true;
drop policy if exists "public can view product images" on storage.objects;
create policy "public can view product images" on storage.objects for select to public using (bucket_id='product-images');
drop policy if exists "authenticated upload product images" on storage.objects;
create policy "authenticated upload product images" on storage.objects for insert to authenticated with check (bucket_id='product-images');
drop policy if exists "authenticated update product images" on storage.objects;
create policy "authenticated update product images" on storage.objects for update to authenticated using (bucket_id='product-images') with check (bucket_id='product-images');
drop policy if exists "authenticated delete product images" on storage.objects;
create policy "authenticated delete product images" on storage.objects for delete to authenticated using (bucket_id='product-images');

commit;
