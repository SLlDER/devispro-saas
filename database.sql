create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid,
  client text not null,
  description text not null,
  price numeric(12, 2) not null check (price >= 0),
  vat_rate numeric(5, 2) not null default 20 check (vat_rate >= 0),
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  created_at timestamptz not null default now()
);

alter table public.invoices
add constraint invoices_client_id_fkey
foreign key (client_id) references public.clients(id) on delete set null;

alter table public.invoices enable row level security;
alter table public.clients enable row level security;

create policy "Users can read their invoices"
on public.invoices
for select
using (auth.uid() = user_id);

create policy "Users can create their invoices"
on public.invoices
for insert
with check (auth.uid() = user_id);

create policy "Users can read their clients"
on public.clients
for select
using (auth.uid() = user_id);

create policy "Users can create their clients"
on public.clients
for insert
with check (auth.uid() = user_id);

create policy "Users can update their clients"
on public.clients
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists invoices_user_id_created_at_idx
on public.invoices (user_id, created_at desc);

create index if not exists clients_user_id_name_idx
on public.clients (user_id, name);
