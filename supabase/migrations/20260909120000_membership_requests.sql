create table if not exists public.membership_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null default '',
  last_name text not null default '',
  email text not null,
  phone text,
  account_type text not null default 'student' check (account_type in ('student', 'external')),
  matricule text,
  department text,
  level text,
  speciality text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'archived')),
  reviewed_by uuid references public.members(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint membership_requests_email_unique unique (email)
);

create index if not exists membership_requests_status_idx on public.membership_requests (status);
create index if not exists membership_requests_created_at_idx on public.membership_requests (created_at desc);