-- Drop the overly-broad policy that resurfaced when the notifications work
-- was done directly against remote (see 20260731222340_remote_schema.sql).
-- Migration 0002 already scopes profile reads to self-or-family; leaving
-- this in place would OR it back open to "any authenticated user can read
-- any profile".
drop policy if exists "profiles_select_authenticated" on "public"."profiles";
