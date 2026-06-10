# Famfetti — TODOs

Tracking progress against [AGENTS.md](AGENTS.md) and the original [spec](README.md). Check items off as you go.

## Done

### Project setup
- [x] Bootstrap Expo SDK 56 app (TypeScript, Expo Router, typed routes)
- [x] Install Supabase JS client, AsyncStorage, URL polyfill, Zustand
- [x] `.env.example` + `.env` gitignored
- [x] Project README with setup steps

### Supabase
- [x] Supabase client with `AsyncStorage` session persistence ([src/lib/supabase.ts](src/lib/supabase.ts))
- [x] `AppState` listener to start/stop auto-refresh on foreground/background
- [x] `profiles` table migration with RLS + `handle_new_user` trigger ([supabase/migrations/0001_init_profiles.sql](supabase/migrations/0001_init_profiles.sql))

### Navigation
- [x] Root layout with auth gate that redirects on session change ([src/app/_layout.tsx](src/app/_layout.tsx))
- [x] `(auth)` route group ([src/app/(auth)/_layout.tsx](src/app/(auth)/_layout.tsx))
- [x] `(tabs)` bottom-tab layout for Home, Events, Alerts, Settings ([src/app/(tabs)/_layout.tsx](src/app/(tabs)/_layout.tsx))
- [x] Placeholder screens for all four tabs

### Auth
- [x] Email + password sign-in ([src/app/(auth)/sign-in.tsx](src/app/(auth)/sign-in.tsx))
- [x] Email + password sign-up with name → `user_metadata` ([src/app/(auth)/sign-up.tsx](src/app/(auth)/sign-up.tsx))
- [x] Persistent session (stays signed in across launches)
- [x] Zustand auth store ([src/store/auth.ts](src/store/auth.ts))
- [x] Session bootstrap hook subscribing to `onAuthStateChange` ([src/hooks/use-session.ts](src/hooks/use-session.ts))
- [x] Sign-out wired in Settings ([src/app/(tabs)/settings.tsx](src/app/(tabs)/settings.tsx))

## To do

### Profile
- [x] Edit profile screen — name only ([src/app/profile.tsx](src/app/profile.tsx))

### Family groups
- [x] `families` and `family_members` tables + RLS + `create_family` / `join_family` RPCs ([supabase/migrations/0002_init_families.sql](supabase/migrations/0002_init_families.sql))
- [x] Onboarding: gate `(tabs)` behind "must belong to a family" check ([src/app/_layout.tsx](src/app/_layout.tsx))
- [x] Create-family flow (generates invite code) ([src/app/(onboarding)/create-family.tsx](src/app/(onboarding)/create-family.tsx))
- [x] Join-by-invite-code flow ([src/app/(onboarding)/join-family.tsx](src/app/(onboarding)/join-family.tsx))
- [ ] Family member list with their upcoming events

### Events
- [x] `events` table + RLS scoped to `family_id` ([supabase/migrations/0003_init_events.sql](supabase/migrations/0003_init_events.sql))
- [x] Create / edit / delete event (title, date, type, notes, recurring) ([src/app/event-form.tsx](src/app/event-form.tsx))
- [x] Events tab: upcoming feed sorted by nearest date ([src/app/(tabs)/events.tsx](src/app/(tabs)/events.tsx))
- [x] Home tab: next-30-days feed + quick-add button ([src/app/(tabs)/index.tsx](src/app/(tabs)/index.tsx))

### Notification Agent
_Sends push notifications when events are created or updated. Trigger: event created/updated in Supabase. Tech: Supabase Edge Functions + Expo Notifications._
- [x] `notifications` table + RLS + `mark_all_notifications_read()` RPC (built directly against remote pre-existing this todo list; reconciled into git via [supabase/migrations/20260731222340_remote_schema.sql](supabase/migrations/20260731222340_remote_schema.sql))
- [ ] Register Expo push token on login → write to `profiles.expo_push_token`
- [ ] Edge Function that fires on event create/update and sends via the Expo Push API
- [ ] Retry failed notifications (3 attempts)

### Reminder Agent
_Sends reminder notifications for upcoming events. Trigger: scheduled check for events happening soon. Tech: Supabase Scheduled Functions. Fixed timing: 1 hour before event._
- [x] `pg_cron` + `pg_net` extensions installed (via the same reconciliation migration above), ready for scheduling
- [ ] Edge Function `supabase/functions/notify` — queries events starting in ~1 hour, sends via Expo Push API
- [ ] Schedule the Edge Function (Supabase cron or external scheduler)

### Invite Agent
_Generates and validates invite codes for adding family members to groups. Tech: Supabase Edge Functions._
- [x] Generate unique invite code (`generate_invite_code` + `create_family` RPC)
- [x] Validate code and add member to family group (`join_family` RPC)
- [ ] Expire codes after 7 days or after use (extend to cover `family_invites` below too)

#### Targeted invites (invite by email/phone during family creation)
_New flow: when creating a family, the creator adds members by email or phone. Each invited person gets their own code, sent directly to them, that carries them from account creation straight into the family._
- [x] `family_invites` table migration: `family_id`, `invited_by`, `contact_method` (email/phone), `contact_value`, `invite_code`, `status` (pending/accepted/expired), `expires_at`, RLS scoped to family members ([supabase/migrations/0005_init_family_invites.sql](supabase/migrations/0005_init_family_invites.sql))
- [ ] `create_family_invite(family_id, contact_method, contact_value)` RPC — creates one invite row + code, returns it
- [ ] Create-family form: add a repeatable "invite a member" input (email or phone) below the family name field — client-side list only, no sending yet
- [ ] Wire create-family form submit: call `create_family`, then `create_family_invite` once per entered contact
- [ ] Edge Function `send-family-invite`: sends an email with the invite code + join link (start with email only)
- [ ] Call `send-family-invite` after each invite row is created (from the client, or a DB webhook on insert)
- [ ] Public accept-invite page (e.g. `/join-family/[code]`) that looks up the invite, shows the family name, and links to sign-up with the code attached
- [ ] Sign-up flow: carry the invite code through as a query param; after account creation, auto-call `join_family` with that code instead of asking the user to type it in
- [ ] Mark the invite row `accepted` (+ `accepted_by`, `accepted_at`) once the invited user successfully joins
- [ ] SMS invites: add phone-based sending via a provider like Twilio (separate from email since it needs a paid account)

### Alerts UI
- [ ] Remove the Alerts tab; add a notification bell to the top-right of the Home screen that opens the Alerts/Notifications screen
- [ ] Alerts/Notifications screen with read/unread state

### Styling
- [ ] Add NativeWind (Tailwind for RN) per original spec — currently using StyleSheet
- [ ] Replace inline styles in auth + tab screens once NativeWind is in

### Dev / QA
- [ ] Seed script: one test family, 3 members, sample events
- [ ] Verify app boots on iOS simulator
- [ ] Verify app boots on Android emulator
- [ ] Lint passes (`npx expo lint`)
- [ ] Consider Jest setup for hooks/utils (skipped during scaffold)
