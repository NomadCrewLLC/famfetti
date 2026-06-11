-- Famfetti: make families.created_by nullable.
--
-- The column was declared `not null ... on delete set null`, which are
-- contradictory. Deleting an auth user made Postgres try to NULL out
-- created_by on every family they created, which instantly violated the
-- NOT NULL constraint and aborted the whole delete — the Supabase dashboard
-- surfaced this as "Failed to delete user".
--
-- Dropping NOT NULL lets the SET NULL fire as intended: the family (and its
-- events, messages, and remaining members) survives its creator leaving.
-- This matches events.created_by, messages.sender_id, and the family_invites
-- columns, which were already nullable.

alter table public.families
  alter column created_by drop not null;
