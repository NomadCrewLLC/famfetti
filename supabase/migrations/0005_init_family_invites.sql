-- Famfetti: family_invites table — targeted invites by email/phone.
-- Apply via the Supabase SQL editor or `supabase db push`.

create table if not exists public.family_invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  invited_by uuid references auth.users(id) on delete set null,
  contact_method text not null check (contact_method in ('email', 'phone')),
  contact_value text not null,
  invite_code text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

-- The two query shapes we need: invites for a family, and lookup by code.
create index if not exists family_invites_family_id_idx
  on public.family_invites(family_id);

create index if not exists family_invites_invite_code_idx
  on public.family_invites(invite_code);

-- ---------------------------------------------------------------------------
-- RLS. No INSERT/UPDATE policy: creating an invite and accepting one both go
-- through SECURITY DEFINER RPCs (create_family_invite, and the join flow),
-- same pattern as messages.read_by — so callers can't forge accepted_by or
-- skip the code-matching logic.
-- ---------------------------------------------------------------------------

alter table public.family_invites enable row level security;

drop policy if exists "family_invites_select_members" on public.family_invites;
create policy "family_invites_select_members"
  on public.family_invites for select
  to authenticated
  using (public.is_family_member(family_id));
