# Famfetti — TODOs

Tracking progress against the original [spec](README.md). Check items off as you go.

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
- [x] `(tabs)` bottom-tab layout for Home, Events, Chat, Alerts, Settings ([src/app/(tabs)/_layout.tsx](src/app/(tabs)/_layout.tsx))
- [x] Placeholder screens for all five tabs

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
- [ ] Avatar upload to Supabase Storage
- [ ] Per-user `notify_days_before` preference UI

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

### Messaging
- [ ] `messages` table + RLS scoped to `family_id`
- [ ] Chat tab UI (message list, input, send)
- [ ] Realtime subscription via Supabase Realtime
- [ ] `read_by[]` tracking + unread badge on Home tab
- [ ] (Stretch) image messages via Supabase Storage

### Notifications
- [ ] `notifications` table + RLS
- [ ] Register Expo push token on login → write to `profiles.expo_push_token`
- [ ] Remove the Alerts tab; add a notification bell to the top-right of the Home screen that opens the Alerts/Notifications screen
- [ ] Alerts/Notifications screen with read/unread state
- [ ] Edge Function `supabase/functions/notify` — daily cron, queries upcoming events, sends via Expo Push API
- [ ] Schedule the Edge Function (Supabase cron or external scheduler)

### Wishlist
- [ ] As a user, I want to be able to create a wishlist
- [ ] As a user, I want to be able to view other family members' wishlists

### Styling
- [ ] Add NativeWind (Tailwind for RN) per original spec — currently using StyleSheet
- [ ] Replace inline styles in auth + tab screens once NativeWind is in

### Dev / QA
- [ ] Seed script: one test family, 3 members, sample events
- [ ] Verify app boots on iOS simulator
- [ ] Verify app boots on Android emulator
- [ ] Lint passes (`npx expo lint`)
- [ ] Consider Jest setup for hooks/utils (skipped during scaffold)
