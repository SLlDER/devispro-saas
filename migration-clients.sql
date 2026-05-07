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
add column if not exists client_id uuid;

alter table public.invoices
add column if not exists vat_rate numeric(5, 2) not null default 20 check (vat_rate >= 0);

alter table public.invoices
add column if not exists status text not null default 'draft';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'invoices_client_id_fkey'
  ) then
    alter table public.invoices
    add constraint invoices_client_id_fkey
    foreign key (client_id) references public.clients(id) on delete set null;
  end if;
end $$;

alter table public.clients enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'clients' and policyname = 'Users can read their clients'
  ) then
    create policy "Users can read their clients"
    on public.clients
    for select
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'clients' and policyname = 'Users can create their clients'
  ) then
    create policy "Users can create their clients"
    on public.clients
    for insert
    with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'clients' and policyname = 'Users can update their clients'
  ) then
    create policy "Users can update their clients"
    on public.clients
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists clients_user_id_name_idx
on public.clients (user_id, name);
