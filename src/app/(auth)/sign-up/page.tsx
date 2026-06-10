'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { joinFamily } from '@/lib/families';
import {
  INVITE_PARAM,
  NEW_FAMILY_PARAM,
  normalizeInviteCode,
  savePendingInviteCode,
} from '@/lib/invite';
import { supabase } from '@/lib/supabase/client';

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Three ways to land here:
  //   /sign-up?invite=X7K2P9 → code is pre-filled and locked (came from a link)
  //   /sign-up               → code is required, typed by hand
  //   /sign-up?new=1         → no code at all, this person is starting a family
  const linkedCode = searchParams.get(INVITE_PARAM);
  const isStartingNewFamily = searchParams.get(NEW_FAMILY_PARAM) === '1';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState(linkedCode ? normalizeInviteCode(linkedCode) : '');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      window.alert('Name, email, and password are all required.');
      return;
    }

    const normalizedCode = normalizeInviteCode(code);
    if (!isStartingNewFamily && !normalizedCode) {
      window.alert('An invite code is required — ask whoever invited you for their link.');
      return;
    }

    setSubmitting(true);
    // `data` is read by the handle_new_user trigger to populate profiles.name.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      setSubmitting(false);
      window.alert(error.message);
      return;
    }

    if (!data.session) {
      // Email confirmation is enabled on the project — user has to confirm
      // before they can sign in, and join_family needs them authenticated. Park
      // the code so /welcome can redeem it on their first signed-in load.
      if (normalizedCode) savePendingInviteCode(normalizedCode);
      setSubmitting(false);
      window.alert('We sent you a confirmation link to finish creating your account.');
      return;
    }

    if (isStartingNewFamily) {
      router.replace('/create-family');
      return;
    }

    try {
      await joinFamily(normalizedCode);
      router.replace('/');
    } catch (err) {
      // The account exists at this point, so don't strand them — /welcome lets
      // them retry the code or create a family instead.
      const message = err instanceof Error ? err.message : 'Could not join that family.';
      window.alert(message);
      router.replace('/welcome');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-four py-six text-text">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-3xl font-bold">Create account</h1>
        <p className="mt-one text-center text-text-secondary">
          {isStartingNewFamily
            ? 'Set up your account, then name your family.'
            : 'Join your family on Famfetti.'}
        </p>

        <form onSubmit={onSubmit} className="mt-four flex flex-col gap-three">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            className="rounded-two border border-background-selected px-three py-three text-base"
          />
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            className="rounded-two border border-background-selected px-three py-three text-base"
          />
          <input
            type="password"
            placeholder="Password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            className="rounded-two border border-background-selected px-three py-three text-base"
          />

          {!isStartingNewFamily && (
            <input
              type="text"
              placeholder="Invite code"
              aria-label="Invite code"
              maxLength={7}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              // A code that arrived in the link is locked — editing it would
              // only ever break a working invite.
              disabled={submitting || Boolean(linkedCode)}
              className="rounded-two border border-background-selected px-three py-three text-center text-2xl font-bold tracking-widest disabled:opacity-60"
            />
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-two bg-text py-three text-center font-semibold text-background disabled:opacity-60"
          >
            {submitting ? 'Creating…' : 'Create account'}
          </button>

          <div className="flex items-center justify-center gap-two text-sm text-text-secondary">
            <span>Already have an account?</span>
            <Link href="/sign-in" replace className="font-semibold text-text underline">
              Sign in
            </Link>
          </div>

          {!isStartingNewFamily && (
            <div className="flex items-center justify-center gap-two text-sm text-text-secondary">
              <span>Starting a new family?</span>
              <Link
                href={`/sign-up?${NEW_FAMILY_PARAM}=1`}
                replace
                className="font-semibold text-text underline"
              >
                Create one
              </Link>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}

export default function SignUpPage() {
  // useSearchParams needs a Suspense boundary or the production build fails.
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background text-text">
          <p className="text-text-secondary">Loading…</p>
        </main>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
