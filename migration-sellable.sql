create table if not exists public.business_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null,
  owner_name text,
  legal_form text,
  siret text not null,
  vat_number text,
  address text not null,
  email text not null,
  phone text,
  insurance text,
  default_payment_terms text not null default 'Paiement a reception de facture',
  default_late_fee text not null default 'Penalites de retard exigibles sans rappel prealable',
  vat_exemption boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.business_profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'business_profiles' and policyname = 'Users can read their business profile'
  ) then
    create policy "Users can read their business profile"
    on public.business_profiles
    for select
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'business_profiles' and policyname = 'Users can create their business profile'
  ) then
    create policy "Users can create their business profile"
    on public.business_profiles
    for insert
    with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'business_profiles' and policyname = 'Users can update their business profile'
  ) then
    create policy "Users can update their business profile"
    on public.business_profiles
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end $$;

create table if not exists public.document_sequences (
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null,
  year integer not null,
  next_number integer not null default 1,
  primary key (user_id, document_type, year)
);

create or replace function public.reserve_document_number(
  p_user_id uuid,
  p_document_type text
)
returns text
language plpgsql
security definer
as $$
declare
  v_year integer := extract(year from now())::integer;
  v_number integer;
  v_prefix text;
begin
  insert into public.document_sequences (user_id, document_type, year, next_number)
  values (p_user_id, p_document_type, v_year, 2)
  on conflict (user_id, document_type, year)
  do update set next_number = public.document_sequences.next_number + 1
  returning next_number - 1 into v_number;

  v_prefix := case when p_document_type = 'invoice' then 'FAC' else 'DEV' end;

  return v_prefix || '-' || v_year || '-' || lpad(v_number::text, 4, '0');
end;
$$;
