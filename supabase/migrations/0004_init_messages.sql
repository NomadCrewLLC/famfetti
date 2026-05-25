-- Famfetti: messages table + read tracking + RLS scoped to family_id.
-- Apply via the Supabase SQL editor or `supabase db push`.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  -- Keep messages around if the sender leaves; chat history matters to the
  -- rest of the family. on delete set null mirrors families/events.
  sender_id uuid references auth.users(id) on delete set null,
  body text not null check (length(body) > 0),
  -- Stretch: image messages. Nullable so it costs nothing today and avoids a
  -- follow-up migration when the feature lands.
  image_url text,
  -- Everyone who has read this message. Sender is added by trigger at insert
  -- so they're not counted as "unread" against themselves.
  read_by uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- The only query shape: messages for one family, newest first.
create index if not exists messages_family_id_created_at_idx
  on public.messages(family_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Trigger: stamp the sender into read_by on insert.
-- ---------------------------------------------------------------------------

create or replace function public.set_message_sender_as_read()
returns trigger
language plpgsql
as $$
begin
  if new.sender_id is not null
     and not (new.sender_id = any(new.read_by)) then
    new.read_by := array_append(new.read_by, new.sender_id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_message_insert_mark_sender_read on public.messages;
create trigger on_message_insert_mark_sender_read
  before insert on public.messages
  for each row execute function public.set_message_sender_as_read();

-- ---------------------------------------------------------------------------
-- RPC: mark all unread messages in a family as read for the caller. Called
-- when the user opens the Chat tab. SECURITY DEFINER so we can do a single
-- bulk update without granting a broad UPDATE policy on the table — the
-- function does its own membership check.
-- ---------------------------------------------------------------------------

create or replace function public.mark_family_messages_read(p_family_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if not public.is_family_member(p_family_id) then
    raise exception 'not a member of this family';
  end if;

  update public.messages
  set read_by = array_append(read_by, uid)
  where family_id = p_family_id
    and not (uid = any(read_by));
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS — read/write scoped to family membership. Deletion is sender-only so
-- nobody can wipe somebody else's message. No UPDATE policy: read tracking
-- goes through the SECURITY DEFINER RPC above, not direct UPDATE.
-- ---------------------------------------------------------------------------

alter table public.messages enable row level security;

drop policy if exists "messages_select_family" on public.messages;
create policy "messages_select_family"
  on public.messages for select
  to authenticated
  using (public.is_family_member(family_id));

drop policy if exists "messages_insert_family" on public.messages;
create policy "messages_insert_family"
  on public.messages for insert
  to authenticated
  with check (
    public.is_family_member(family_id)
    and sender_id = auth.uid()
  );

drop policy if exists "messages_delete_own" on public.messages;
create policy "messages_delete_own"
  on public.messages for delete
  to authenticated
  using (sender_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Realtime: opt the table into Supabase Realtime so the Chat tab can
-- subscribe to inserts. Safe to re-run — `add table` errors if already a
-- member, so we guard with a DO block.
-- ---------------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end;
$$;
