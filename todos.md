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
- [ ] Edit profile screen (name, avatar)
- [ ] Avatar upload to Supabase Storage
- [ ] Per-user `notify_days_before` preference UI

### Family groups
- [ ] `families` and `family_members` tables + RLS (only see your own family's data)
- [ ] Create-family flow (generates invite code)
- [ ] Join-by-invite-code flow
- [ ] Family member list with their upcoming events
- [ ] Onboarding: gate `(tabs)` behind "must belong to a family" check

### Events
- [ ] `events` table + RLS scoped to `family_id`
- [ ] Create / edit / delete event (title, date, type, notes, recurring)
- [ ] Events tab: upcoming feed sorted by nearest date
- [ ] Home tab: next-30-days feed + quick-add button

### Messaging
- [ ] `messages` table + RLS scoped to `family_id`
- [ ] Chat tab UI (message list, input, send)
- [ ] Realtime subscription via Supabase Realtime
- [ ] `read_by[]` tracking + unread badge on Home tab
- [ ] (Stretch) image messages via Supabase Storage

### Notifications
- [ ] `notifications` table + RLS
- [ ] Register Expo push token on login → write to `profiles.expo_push_token`
- [ ] In-app Notifications tab with read/unread state
- [ ] Edge Function `supabase/functions/notify` — daily cron, queries upcoming events, sends via Expo Push API
- [ ] Schedule the Edge Function (Supabase cron or external scheduler)

### Styling
- [ ] Add NativeWind (Tailwind for RN) per original spec — currently using StyleSheet
- [ ] Replace inline styles in auth + tab screens once NativeWind is in

### Dev / QA
- [ ] Seed script: one test family, 3 members, sample events
- [ ] Verify app boots on iOS simulator
- [ ] Verify app boots on Android emulator
- [ ] Lint passes (`npx expo lint`)
- [ ] Consider Jest setup for hooks/utils (skipped during scaffold)
