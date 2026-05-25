-- Famfetti: events table + RLS scoped to family_id.
-- Apply via the Supabase SQL editor or `supabase db push`.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  -- Keep events around if the creator leaves; grandma's birthday matters to
  -- the family, not just whoever first typed it in.
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  -- date (not timestamptz) — family events are day-level (birthdays,
  -- anniversaries). Stays correct regardless of who's in what timezone.
  event_date date not null,
  type text not null default 'other'
    check (type in ('birthday', 'anniversary', 'holiday', 'other')),
  notes text,
  recurring boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Drives the "upcoming events" feed: scoped to a family, ordered by date.
create index if not exists events_family_id_event_date_idx
  on public.events(family_id, event_date);

-- ---------------------------------------------------------------------------
-- RLS — every operation requires the actor to be a member of the event's
-- family. Membership check goes through is_family_member() from migration
-- 0002 to avoid recursing through family_members policies.
-- ---------------------------------------------------------------------------

alter table public.events enable row level security;

drop policy if exists "events_select_family" on public.events;
create policy "events_select_family"
  on public.events for select
  to authenticated
  using (public.is_family_member(family_id));

drop policy if exists "events_insert_family" on public.events;
create policy "events_insert_family"
  on public.events for insert
  to authenticated
  with check (
    public.is_family_member(family_id)
    and (created_by is null or created_by = auth.uid())
  );

-- v1: any family member can edit or delete any of the family's events. The
-- family is small and trusted; locking edits to the creator adds friction
-- without obvious benefit. Tighten later if it becomes a problem.
drop policy if exists "events_update_family" on public.events;
create policy "events_update_family"
  on public.events for update
  to authenticated
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

drop policy if exists "events_delete_family" on public.events;
create policy "events_delete_family"
  on public.events for delete
  to authenticated
  using (public.is_family_member(family_id));
