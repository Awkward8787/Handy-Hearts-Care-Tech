-- Guest consultations and bookings are keyed by an order reference plus contact
-- details. They are not attached to a customer user account.
-- Staff and providers live in app_user. The service role is the only role that
-- reads or writes these tables. Apply this in the Supabase project you own.
-- No prices are seeded.

create table public.app_user (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text not null,
  role text not null check (role in ('ADMIN', 'PROVIDER')),
  is_approved boolean not null default false,
  is_banned boolean not null default false,
  phone_e164 text,
  provider_data jsonb not null default '{}'::jsonb
);

create table public.consultation_request (
  reference text primary key,
  full_name text not null,
  email text,
  phone_e164 text,
  topic text not null,
  preferred_date text not null,
  preferred_time text not null check (preferred_time in ('anytime', 'morning', 'afternoon', 'evening')),
  notes text,
  status text not null default 'submitted' check (status in ('submitted', 'closed')),
  created_at timestamptz not null,
  constraint consultation_request_contact check (email is not null or phone_e164 is not null),
  constraint consultation_request_reference check (reference ~ '^HH-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}$')
);

create table public.service_order (
  reference text primary key,
  full_name text not null,
  email text,
  phone_e164 text,
  service_category text not null,
  service_id uuid,
  urgency text not null check (urgency in ('low', 'medium', 'high', 'emergency')),
  preferred_date text not null,
  preferred_time text not null check (preferred_time in ('anytime', 'morning', 'afternoon', 'evening')),
  service_type text not null check (service_type in ('in_home', 'remote')),
  address text,
  notes text,
  total_price_cents integer not null check (total_price_cents >= 0),
  price_items jsonb not null default '[]'::jsonb,
  provider_payout_cents integer not null default 0 check (provider_payout_cents >= 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  payment_intent_id text,
  payment_status text not null check (payment_status in ('not_due', 'unpaid', 'paid')),
  status text not null check (status in (
    'draft', 'submitted', 'reviewing', 'assigned', 'scheduled', 'in_progress', 'completed', 'cancelled'
  )),
  assigned_provider_user_id uuid references public.app_user (id),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint service_order_contact check (email is not null or phone_e164 is not null),
  constraint service_order_reference check (reference ~ '^HH-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}$'),
  constraint service_order_address check (service_type <> 'in_home' or address is not null)
);

create table public.confirmation_message (
  id bigint generated always as identity primary key,
  reference text not null,
  channel text not null check (channel in ('email', 'sms')),
  destination text not null,
  subject text,
  body text not null,
  status text not null check (status in ('sent', 'queued', 'failed')),
  created_at timestamptz not null
);

create index confirmation_message_reference_idx on public.confirmation_message (reference, created_at);

create table public.payment (
  id text primary key,
  reference text not null references public.service_order (reference),
  amount_cents integer not null check (amount_cents >= 0),
  status text not null check (status = 'paid'),
  created_at timestamptz not null
);

create table public.services (
  id uuid primary key,
  name text not null,
  description text not null,
  base_rate_cents integer not null check (base_rate_cents >= 0),
  min_hours numeric not null check (min_hours > 0 and min_hours <= 24),
  is_active boolean not null default true
);

alter table public.service_order
  add constraint service_order_service_fk
  foreign key (service_id) references public.services (id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_user
    where id = auth.uid()
      and role = 'ADMIN'
      and is_approved = true
      and is_banned = false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Signup metadata never becomes ADMIN. A provider application is stored
-- unapproved. Any other signup, including a family or customer role, creates
-- no app_user row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested text;
begin
  requested := coalesce(new.raw_user_meta_data ->> 'role', '');
  if requested = 'PROVIDER' then
    insert into public.app_user (id, email, name, role, is_approved, is_banned)
    values (
      new.id,
      new.email,
      coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Provider'),
      'PROVIDER',
      false,
      false
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.app_user enable row level security;
alter table public.consultation_request enable row level security;
alter table public.service_order enable row level security;
alter table public.confirmation_message enable row level security;
alter table public.payment enable row level security;
alter table public.services enable row level security;

revoke all on table public.app_user from anon, authenticated;
revoke all on table public.consultation_request from anon, authenticated;
revoke all on table public.service_order from anon, authenticated;
revoke all on table public.confirmation_message from anon, authenticated;
revoke all on table public.payment from anon, authenticated;
revoke all on table public.services from anon, authenticated;

grant all on table public.app_user to service_role;
grant all on table public.consultation_request to service_role;
grant all on table public.service_order to service_role;
grant all on table public.confirmation_message to service_role;
grant all on table public.payment to service_role;
grant all on table public.services to service_role;
grant usage, select on sequence public.confirmation_message_id_seq to service_role;

-- The owner promotes an admin after creating that person's auth user:
-- insert into public.app_user (id, email, name, role, is_approved, is_banned)
-- values ('<auth user uuid>', '<email>', '<name>', 'ADMIN', true, false);
