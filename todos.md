# Famfetti — TODOs

A Next.js (App Router) + Supabase web app. Tracking progress against [AGENTS.md](AGENTS.md).
Check items off as you go.

## Done

### Project setup
- [x] Next.js App Router app (TypeScript, Turbopack root pinned in [next.config.ts](next.config.ts))
- [x] Install `@supabase/supabase-js`, `@supabase/ssr`, `next-themes`, Zustand
- [x] Tailwind CSS v4 via `@tailwindcss/postcss` ([postcss.config.mjs](postcss.config.mjs))
- [x] `.env.example` + `.env` gitignored (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### Supabase
- [x] Browser client for Client Components ([src/lib/supabase/client.ts](src/lib/supabase/client.ts))
- [x] Server client reading/writing cookies for Server Components ([src/lib/supabase/server.ts](src/lib/supabase/server.ts))
- [x] Session refresh on every request ([src/lib/supabase/middleware.ts](src/lib/supabase/middleware.ts)) wired through [src/proxy.ts](src/proxy.ts)
- [x] `profiles` table migration with RLS + `handle_new_user` trigger ([supabase/migrations/0001_init_profiles.sql](supabase/migrations/0001_init_profiles.sql))

### Routing / layout
- [x] Root layout with theme + auth providers ([src/app/layout.tsx](src/app/layout.tsx))
- [x] `(auth)` route group ([src/app/(auth)/layout.tsx](<src/app/(auth)/layout.tsx>))
- [x] `(onboarding)` route group ([src/app/(onboarding)/layout.tsx](<src/app/(onboarding)/layout.tsx>))
- [x] `(app)` route group with server-side auth + family gate ([src/app/(app)/layout.tsx](<src/app/(app)/layout.tsx>))
- [x] Top nav for Home, Events, Alerts, Settings ([src/components/nav-bar.tsx](src/components/nav-bar.tsx))
- [x] Redirect unauthenticated users to `/sign-in` in the proxy ([src/proxy.ts](src/proxy.ts))

### Auth
- [x] Email + password sign-in ([src/app/(auth)/sign-in/page.tsx](<src/app/(auth)/sign-in/page.tsx>))
- [x] Email + password sign-up with name → `user_metadata` ([src/app/(auth)/sign-up/page.tsx](<src/app/(auth)/sign-up/page.tsx>))
- [x] Persistent session via cookies (survives reloads)
- [x] Zustand auth store ([src/store/auth.ts](src/store/auth.ts))
- [x] Session bootstrap hook subscribing to `onAuthStateChange` ([src/hooks/use-session.ts](src/hooks/use-session.ts))
- [x] Sign-out wired in Settings ([src/app/(app)/settings/page.tsx](<src/app/(app)/settings/page.tsx>))

## To do

### Profile
- [x] Edit profile page — name only ([src/app/(app)/profile/page.tsx](<src/app/(app)/profile/page.tsx>))

### Family groups
- [x] `families` and `family_members` tables + RLS + `create_family` / `join_family` RPCs ([supabase/migrations/0002_init_families.sql](supabase/migrations/0002_init_families.sql))
- [x] Onboarding: gate `(app)` behind "must belong to a family" check ([src/app/(app)/layout.tsx](<src/app/(app)/layout.tsx>))
- [x] Family membership bootstrap hook + store ([src/hooks/use-family-membership.ts](src/hooks/use-family-membership.ts), [src/store/family.ts](src/store/family.ts))
- [x] Welcome / create / join onboarding pages ([src/app/(onboarding)/welcome/page.tsx](<src/app/(onboarding)/welcome/page.tsx>))
- [x] Create-family flow (generates invite code) ([src/app/(onboarding)/create-family/page.tsx](<src/app/(onboarding)/create-family/page.tsx>))
- [x] Join-by-invite-code flow ([src/app/(onboarding)/join-family/page.tsx](<src/app/(onboarding)/join-family/page.tsx>))
- [x] Share-invite-code page ([src/app/(app)/invite/page.tsx](<src/app/(app)/invite/page.tsx>))
- [ ] Family member list with their upcoming events

### Events
- [x] `events` table + RLS scoped to `family_id` ([supabase/migrations/0003_init_events.sql](supabase/migrations/0003_init_events.sql))
- [x] Event data layer + recurrence helpers ([src/lib/events.ts](src/lib/events.ts))
- [x] Create / edit / delete event (title, date, type, notes, recurring) ([src/app/(app)/event-form/page.tsx](<src/app/(app)/event-form/page.tsx>))
- [x] Events page: upcoming feed sorted by nearest date ([src/app/(app)/events/page.tsx](<src/app/(app)/events/page.tsx>))
- [x] Home page: next-30-days feed + quick-add button ([src/app/(app)/page.tsx](<src/app/(app)/page.tsx>))

### Notification Agent
_Sends notifications when events are created or updated. Trigger: event created/updated in Supabase. Tech: Supabase Edge Functions + Web Push._
- [x] `notifications` table + RLS + `mark_all_notifications_read()` RPC (built directly against remote pre-existing this todo list; reconciled into git via [supabase/migrations/20260731222340_remote_schema.sql](supabase/migrations/20260731222340_remote_schema.sql))
- [ ] Migration to replace the mobile-era push columns with web-push equivalents: `profiles.expo_push_token` → a `push_subscriptions` table (endpoint + p256dh + auth keys, one row per browser), and `notifications.expo_ticket_id` / `expo_error` → provider-agnostic `delivery_id` / `delivery_error`
- [ ] Service worker (`public/sw.js`) handling `push` and `notificationclick`
- [ ] VAPID keys in env; client-side "Enable notifications" prompt that calls `Notification.requestPermission()` + `PushManager.subscribe()` and saves the subscription
- [ ] Edge Function that fires on event create/update and sends via Web Push
- [ ] Retry failed notifications (3 attempts); prune subscriptions the browser has revoked (410/404)

### Reminder Agent
_Sends reminder notifications for upcoming events. Trigger: scheduled check for events happening soon. Tech: Supabase Scheduled Functions. Fixed timing: 1 hour before event._
- [x] `pg_cron` + `pg_net` extensions installed (via the same reconciliation migration above), ready for scheduling
- [ ] Edge Function `supabase/functions/notify` — queries events starting in ~1 hour, sends via Web Push
- [ ] Schedule the Edge Function (`pg_cron` calling it through `pg_net`, or an external scheduler)

### Invite Agent
_Generates and validates invite codes for adding family members to groups. Tech: Supabase Edge Functions._
- [x] Generate unique invite code (`generate_invite_code` + `create_family` RPC)
- [x] Validate code and add member to family group (`join_family` RPC)
- [ ] Expire codes after 7 days or after use (extend to cover `family_invites` below too)

#### Invite links (copy/paste a sign-up URL)
_Shipped flow: on [/invite](<src/app/(app)/invite/page.tsx>), "Generate link" wraps the family's existing `invite_code` in a sign-up URL (`/sign-up?invite=CODE`) and copies it. The recipient opens it, the code is pre-filled and locked, and they join the moment their account exists. Links are reusable and never expire — same semantics as the code itself — so this needed no new SQL._
- [x] `buildInviteLink` + pending-code helpers ([src/lib/invite.ts](src/lib/invite.ts))
- [x] "Generate link" button on the invite page ([src/app/(app)/invite/page.tsx](<src/app/(app)/invite/page.tsx>))
- [x] Sign-up reads `?invite=` and pre-fills + disables the code field; auto-calls `join_family` after account creation ([src/app/(auth)/sign-up/page.tsx](<src/app/(auth)/sign-up/page.tsx>))
- [x] Invite code is required at sign-up, with a `?new=1` escape hatch for whoever is starting a brand-new family (otherwise the first user could never sign up)
- [x] Codes parked in `localStorage` when email confirmation blocks the immediate join, redeemed on [welcome](<src/app/(onboarding)/welcome/page.tsx>) — **now dormant**: email confirmation is off on the hosted project, so `signUp` always returns a session and the join happens inline. Kept as a fallback; see [auth-flow.md](auth-flow.md) before touching it
- [ ] An already-signed-in user who opens an invite link gets bounced off `/sign-up` by [src/proxy.ts](src/proxy.ts) and loses the code — they have to paste it into `/join-family` by hand
- [ ] A wrong hand-typed code still creates the account before the join fails (lands on `/welcome`); fixing it properly needs an anonymous code-validation RPC

#### Deferred: emailed / targeted invites
_The `family_invites` table exists ([supabase/migrations/0005_init_family_invites.sql](supabase/migrations/0005_init_family_invites.sql)) but nothing reads or writes it — the link flow above uses `families.invite_code` instead. Everything below is what it would take to send invites directly to a person rather than handing over a link._
- [ ] `create_family_invite(family_id, contact_method, contact_value)` RPC — one invite row + code per invited person
- [ ] Edge Function `send-family-invite`: emails the invite code + join link
- [ ] Mark the invite row `accepted` (+ `accepted_by`, `accepted_at`) once the invited user joins; expire codes after 7 days or after use
- [ ] SMS invites via a provider like Twilio (needs a paid account)

### Alerts UI
- [ ] Remove the Alerts link from the nav bar; add a notification bell to the top-right of the Home page that links to `/notifications`
- [ ] Build out `/notifications` with real data and read/unread state — currently a static placeholder ([src/app/(app)/notifications/page.tsx](<src/app/(app)/notifications/page.tsx>))
- [ ] Unread badge on the bell (count from `notifications` where `read_at is null`)
- [ ] "Mark all read" wired to the existing `mark_all_notifications_read()` RPC

### Messaging
_The `messages` table exists but nothing in the app reads or writes it yet._
- [x] `messages` table + `read_by` trigger + `mark_family_messages_read` RPC ([supabase/migrations/0004_init_messages.sql](supabase/migrations/0004_init_messages.sql))
- [ ] Family chat page + data layer (`src/lib/messages.ts`), or drop the migration if messaging is out of scope

### Styling
_UI kit is **Mantine 9**. Tailwind v4 and `next-themes` were removed — Mantine's
`ColorSchemeScript` + `useMantineColorScheme` replace next-themes, and the old design
tokens now live in [src/theme.ts](src/theme.ts) with the palette pinned in
[src/global.css](src/global.css). The old 4px spacing scale maps onto Mantine's
`xs`–`xl`; `half` (2px) and `six` (64px) are written as literals at the few call sites
that used them._
- [x] Mantine set up: `MantineProvider` + `ColorSchemeScript` ([src/app/layout.tsx](<src/app/layout.tsx>)), `postcss-preset-mantine` ([postcss.config.mjs](postcss.config.mjs)), theme ([src/theme.ts](src/theme.ts))
- [x] Theme toggle in Settings — Light / Dark / Auto ([src/app/(app)/settings/page.tsx](<src/app/(app)/settings/page.tsx>))
- [x] Replaced `window.alert` / `window.confirm` with inline field errors, `@mantine/notifications` toasts, and blocking `Modal`s for the two cases that need to block (the create-family invite-code reveal, and the event delete confirm)
- [x] Shared [LoadingState](src/components/loading-state.tsx) / [EmptyState](src/components/empty-state.tsx) components, plus [EventList](src/components/event-list.tsx) extracted from the duplicated home/events feed markup
- [ ] `npm run lint` is broken — `next lint` was removed in Next 16 and the repo has no ESLint config; needs `eslint` + `eslint-config-next` wired up (see the Dev/QA item below)

### Dev / QA
- [ ] Seed script: one test family, 3 members, sample events
- [ ] Verify the app boots with `npm run dev` and the full sign-up → create family → add event flow works
- [ ] Verify responsive layout at mobile widths
- [ ] Lint passes — the `lint` script still calls `next lint`, which Next 16 removed; replace it with `eslint` + `eslint-config-next` and a flat config
- [ ] Cypress setup + specs for the auth and create-family flows (per [AGENTS.md](AGENTS.md))
