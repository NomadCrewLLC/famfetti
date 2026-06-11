# Sign-up & Auth Flow — Locked Behaviour

**Status: decided 2026-08-07. Do not change any of the invariants below without the
repo owner explicitly asking for it in that session.**

This file exists because the sign-up flow is easy to "helpfully" break during unrelated
work. The behaviour here is deliberate and was chosen against a specific alternative.

## The decision

**A new member who opens an invite link must reach the home page in one step, without
leaving the browser.** No "check your email to confirm" wall stands between sign-up and
the app.

This is enforced by a **Supabase dashboard setting, not by code**: project
`bzhrvxudzidvntjzbanw` → Authentication → Sign In / Providers → Email →
**"Confirm email" is OFF**.

Why it's a dashboard setting: with confirmation ON, `supabase.auth.signUp()` returns
`data.session === null`, and `join_family` hard-requires an authenticated user —
[`supabase/migrations/0002_init_families.sql:141`](supabase/migrations/0002_init_families.sql#L141)
raises `not authenticated` when `auth.uid() is null`. So with confirmation on, the app
*cannot* join someone to a family or show them anything until they click the emailed
link. Supabase has no "let them in now, verify later" mode — it's on or off.

Accepted trade-off: **email addresses are unverified.** A typo at sign-up means that
person has no password-reset path. This was judged acceptable because sign-up is already
gated behind a family invite code, which covers the abuse surface email confirmation
normally protects.

To check the live setting at any time (read-only, no auth needed beyond the anon key):

```bash
set -a; . ./.env; set +a
curl -s "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/settings" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" | tr ',' '\n' | grep autoconfirm
# want: "mailer_autoconfirm":true
```

`mailer_autoconfirm: false` means someone turned confirmation back on and this flow is
broken. Note that `supabase/config.toml` (`enable_confirmations = false`) governs only
the **local** CLI stack — it has no effect on the hosted project.

## Invariants — do not break these

1. **Do not add an email-confirmation gate**, in any form: no `emailRedirectTo`
   handoff that blocks entry, no "verify your email" interstitial, no OTP step between
   sign-up and `/`.
2. **The happy path stays synchronous.** After a successful `signUp()`,
   [`src/app/(auth)/sign-up/page.tsx`](<src/app/(auth)/sign-up/page.tsx>) calls
   `joinFamily(code)` and then `router.replace('/')`. Do not defer the join to a
   later screen, a `useEffect`, or a background task.
3. **`join_family` must stay callable with a fresh session.** If you change that RPC,
   preserve the property that a brand-new user can call it successfully on their first
   authenticated request.
4. **Landing on `/` is the success signal.**
   [`src/app/(app)/layout.tsx`](<src/app/(app)/layout.tsx>) redirects anyone without a
   `family_members` row to `/welcome`, so reaching `/` proves the join worked. Don't
   weaken that guard.
5. **The three sign-up modes all keep working:**
   - `/sign-up?invite=CODE` — code pre-filled and locked
   - `/sign-up` — code required, typed by hand
   - `/sign-up?new=1` — no code, this person is starting a family → `/create-family`

## Intentionally dormant code — do not delete as "unused"

With confirmation off, `signUp()` always returns a session, so these are unreachable:

- the `if (!data.session)` branch in [`src/app/(auth)/sign-up/page.tsx`](<src/app/(auth)/sign-up/page.tsx>)
- the pending-code helpers in [`src/lib/invite.ts`](src/lib/invite.ts)
  (`savePendingInviteCode` / `readPendingInviteCode` / `clearPendingInviteCode`)
- the redemption `useEffect` in [`src/app/(onboarding)/welcome/page.tsx`](<src/app/(onboarding)/welcome/page.tsx>)

They are kept **on purpose** as the fallback if confirmation is ever switched back on.
Dead-code sweeps and "unused export" tooling will flag them. Leave them.

## If confirmation is ever turned back on

Turning it on strands every existing unconfirmed user. Turning it back off does **not**
retroactively confirm them — they still can't sign in. Backfill once via the SQL editor:

```sql
update auth.users
set email_confirmed_at = now()
where email_confirmed_at is null;
```

Also note there is still **no `/auth/callback` route** anywhere in `src/app`. If
confirmation is re-enabled, the emailed link lands on `site_url` with a PKCE `?code=`
that nothing consumes, and [`src/proxy.ts`](src/proxy.ts) bounces the user to
`/sign-in`. That route would have to be built first.

## Verifying the flow end-to-end

Run against the **hosted** project (`.env` already points there) — the local stack never
had confirmation on, so it can't prove anything here.

1. `npm run dev`
2. Signed in as an existing member, go to `/invite` → **Generate link** → copy the URL.
3. Open it in an **incognito window** (needs a clean session *and* empty localStorage;
   a plain new tab shares both). Sign up with a fresh email.
4. Expect: no alert, no inbox trip, straight to the events feed at `/`.
5. Regressions: `/sign-up?new=1` → `/create-family`; `/sign-up` with a junk code →
   "invalid invite code" alert, then `/welcome`; sign out and back in → straight to `/`.
