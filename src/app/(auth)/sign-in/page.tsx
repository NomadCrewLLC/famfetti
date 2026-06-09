'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { supabase } from '@/lib/supabase/client';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      window.alert('Email and password are required.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (error) {
      window.alert(error.message);
      return;
    }

    router.replace('/');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-four py-six text-text">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-3xl font-bold">Famfetti</h1>
        <p className="mt-one text-center text-text-secondary">
          Sign in to keep up with your family.
        </p>

        <form onSubmit={onSubmit} className="mt-four flex flex-col gap-three">
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            className="rounded-two border border-background-selected px-three py-three text-base"
          />

          <button
            type="submit"
            disabled={submitting}
            className="rounded-two bg-text py-three text-center font-semibold text-background disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="flex items-center justify-center gap-two text-sm text-text-secondary">
            <span>No account yet?</span>
            <Link href="/sign-up" replace className="font-semibold text-text underline">
              Create one
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
