-- Famfetti: families + family_members + invite-code RPCs + RLS.
-- Apply via the Supabase SQL editor or `supabase db push`.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

create index if not exists family_members_user_id_idx
  on public.family_members(user_id);

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER so RLS policies can call them without recursing
-- through the same table's policies).
-- ---------------------------------------------------------------------------

create or replace function public.is_family_member(p_family_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.family_members
    where family_id = p_family_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_family_owner(p_family_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.family_members
    where family_id = p_family_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

create or replace function public.shares_family_with(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.family_members fm1
    join public.family_members fm2 on fm1.family_id = fm2.family_id
    where fm1.user_id = auth.uid() and fm2.user_id = p_user_id
  );
$$;

-- ---------------------------------------------------------------------------
-- Invite-code generator (7 chars, unambiguous alphabet — no 0/O/1/I).
-- ---------------------------------------------------------------------------

create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
begin
  loop
    code := '';
    for i in 1..7 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.families where invite_code = code);
  end loop;
  return code;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPCs the app calls instead of inserting directly. SECURITY DEFINER so the
-- bootstrap insert (family + first membership) can happen atomically without
-- fighting RLS.
-- ---------------------------------------------------------------------------

create or replace function public.create_family(p_name text)
returns public.families
language plpgsql
security definer
set search_path = public
as $$
declare
  new_family public.families;
  trimmed text := nullif(trim(p_name), '');
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if trimmed is null then
    raise exception 'family name required';
  end if;

  insert into public.families (name, invite_code, created_by)
  values (trimmed, public.generate_invite_code(), auth.uid())
  returning * into new_family;

  insert into public.family_members (family_id, user_id, role)
  values (new_family.id, auth.uid(), 'owner');

  return new_family;
end;
$$;

create or replace function public.join_family(p_invite_code text)
returns public.families
language plpgsql
security definer
set search_path = public
as $$
declare
  target_family public.families;
  normalized text := upper(trim(p_invite_code));
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if normalized is null or normalized = '' then
    raise exception 'invite code required';
  end if;

  select * into target_family
  from public.families
  where invite_code = normalized;

  if target_family.id is null then
    raise exception 'invalid invite code';
  end if;

  insert into public.family_members (family_id, user_id, role)
  values (target_family.id, auth.uid(), 'member')
  on conflict (family_id, user_id) do nothing;

  return target_family;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.families enable row level security;
alter table public.family_members enable row level security;

-- families: members of a family can read it; only owners can rename/delete.
-- Inserts go through create_family() (security definer), but we still allow
-- a direct insert as long as created_by = auth.uid() for completeness.
drop policy if exists "families_select_members" on public.families;
create policy "families_select_members"
  on public.families for select
  to authenticated
  using (public.is_family_member(id));

drop policy if exists "families_insert_self" on public.families;
create policy "families_insert_self"
  on public.families for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "families_update_owner" on public.families;
create policy "families_update_owner"
  on public.families for update
  to authenticated
  using (public.is_family_owner(id))
  with check (public.is_family_owner(id));

drop policy if exists "families_delete_owner" on public.families;
create policy "families_delete_owner"
  on public.families for delete
  to authenticated
  using (public.is_family_owner(id));

-- family_members: you can see everyone in any family you belong to. You can
-- only add or remove yourself directly (joining/leaving). Owner-removes-member
-- is intentionally not in v1 — add later if needed.
drop policy if exists "family_members_select_same_family" on public.family_members;
create policy "family_members_select_same_family"
  on public.family_members for select
  to authenticated
  using (public.is_family_member(family_id));

drop policy if exists "family_members_insert_self" on public.family_members;
create policy "family_members_insert_self"
  on public.family_members for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "family_members_delete_self" on public.family_members;
create policy "family_members_delete_self"
  on public.family_members for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Tighten profiles SELECT now that we can scope it. Previously: any
-- authenticated user could read any profile. Now: self, or anyone you share
-- a family with.
-- ---------------------------------------------------------------------------

drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_select_self_or_family" on public.profiles;
create policy "profiles_select_self_or_family"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.shares_family_with(id));
