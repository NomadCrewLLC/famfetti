-- Reconciles migrations 0006/0007, which were applied directly against the
-- remote database (e.g. via the Studio SQL editor) and never saved as files.
-- Captured here from `supabase db pull` so remote state matches git.

create extension if not exists "pg_cron" with schema "pg_catalog";

drop extension if exists "pg_net";

create extension if not exists "pg_net" with schema "public";


  create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "family_id" uuid not null,
    "event_id" uuid not null,
    "kind" text not null default 'event_reminder'::text,
    "title" text not null,
    "body" text not null,
    "offset_days" integer not null,
    "occurrence_date" date not null,
    "read_at" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "expo_ticket_id" text,
    "expo_error" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."notifications" enable row level security;

alter table "public"."profiles" drop column "notify_days_before";

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE INDEX notifications_user_id_created_at_idx ON public.notifications USING btree (user_id, created_at DESC);

CREATE UNIQUE INDEX notifications_user_id_event_id_offset_days_occurrence_date_key ON public.notifications USING btree (user_id, event_id, offset_days, occurrence_date);

CREATE INDEX notifications_user_id_unread_idx ON public.notifications USING btree (user_id) WHERE (read_at IS NULL);

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."notifications" add constraint "notifications_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_event_id_fkey";

alter table "public"."notifications" add constraint "notifications_family_id_fkey" FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_family_id_fkey";

alter table "public"."notifications" add constraint "notifications_kind_check" CHECK ((kind = 'event_reminder'::text)) not valid;

alter table "public"."notifications" validate constraint "notifications_kind_check";

alter table "public"."notifications" add constraint "notifications_offset_days_check" CHECK ((offset_days >= 0)) not valid;

alter table "public"."notifications" validate constraint "notifications_offset_days_check";

alter table "public"."notifications" add constraint "notifications_user_id_event_id_offset_days_occurrence_date_key" UNIQUE using index "notifications_user_id_event_id_offset_days_occurrence_date_key";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  update public.notifications
  set read_at = now()
  where user_id = uid and read_at is null;
end;
$function$
;

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";


  create policy "notifications_delete_own"
  on "public"."notifications"
  as permissive
  for delete
  to authenticated
using ((user_id = auth.uid()));


  create policy "notifications_select_own"
  on "public"."notifications"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));


  create policy "notifications_update_own"
  on "public"."notifications"
  as permissive
  for update
  to authenticated
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));
