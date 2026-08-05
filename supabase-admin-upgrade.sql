alter table public.products
  add column if not exists stock integer not null default 0 check (stock >= 0),
  add column if not exists on_sale boolean not null default false,
  add column if not exists sale_price numeric(10,2) check (sale_price is null or sale_price >= 0),
  add column if not exists featured boolean not null default false;

update public.products
set on_sale = false
where sale_price is null;
