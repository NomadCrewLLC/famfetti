# Famfetti

A family notification and messaging app built with [Expo](https://expo.dev) + [Supabase](https://supabase.com).

This commit scaffolds the foundation: Supabase client wiring, Expo Router navigation shell, and email/password auth.
Features (events, chat, push notifications) are placeholders to be filled in.

## Setup

1. Install dependencies

   ```bash
   npm install
   ```

2. Create a Supabase project at <https://supabase.com> and copy the project URL + anon key.

3. Copy `.env.example` to `.env` and fill in your credentials:

   ```bash
   cp .env.example .env
   ```

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   ```

4. Apply the initial schema. Open the Supabase SQL editor and paste
   `supabase/migrations/0001_init_profiles.sql`, or run `supabase db push` if you
   use the Supabase CLI. This creates the `profiles` table, the
   `handle_new_user` trigger, and RLS policies.

5. Start the app

   ```bash
   npx expo start
   ```

## Project structure

```
src/
  app/
    _layout.tsx          Root layout + auth gate (redirects based on session)
    (auth)/
      _layout.tsx
      sign-in.tsx
      sign-up.tsx
    (tabs)/
      _layout.tsx        Bottom tab nav
      index.tsx          Home
      events.tsx
      chat.tsx
      notifications.tsx
      settings.tsx       Profile + sign out
  components/            Shared UI (themed text/view, etc.)
  constants/theme.ts     Colors, spacing
  hooks/
    use-session.ts       Subscribes to Supabase auth state
    use-theme.ts
  lib/supabase.ts        Supabase client (uses AsyncStorage for session)
  store/auth.ts          Zustand auth store

supabase/
  migrations/0001_init_profiles.sql
```

## How auth works

- `src/lib/supabase.ts` creates the client with `AsyncStorage` so sessions persist across app launches.
- `src/hooks/use-session.ts` calls `supabase.auth.getSession()` once at startup and subscribes to `onAuthStateChange`.
- `src/app/_layout.tsx` reads the session from the Zustand store and redirects: no session → `/sign-in`, has session → `/`.
- Sign-up writes `name` to `user_metadata`; the `handle_new_user` trigger reads it into `public.profiles`.

## What's not built yet

- Family groups (`families`, `family_members` tables and invite-code flow)
- Events CRUD + upcoming-events feed
- Realtime chat (`messages` table + subscription)
- Expo push notifications + the `/functions/notify` Edge Function
- NativeWind styling (currently uses StyleSheet + the template's themed components)
