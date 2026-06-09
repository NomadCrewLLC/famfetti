'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { supabase } from '@/lib/supabase/client';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      window.alert('Name, email, and password are all required.');
      return;
    }

    setSubmitting(true);
    // `data` is read by the handle_new_user trigger to populate profiles.name.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    setSubmitting(false);

    if (error) {
      window.alert(error.message);
      return;
    }

    if (!data.session) {
      // Email confirmation is enabled on the project — user has to confirm before they can sign in.
      window.alert('We sent you a confirmation link to finish creating your account.');
      return;
    }

    router.replace('/');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-four py-six text-text">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-3xl font-bold">Create account</h1>
        <p className="mt-one text-center text-text-secondary">Join your family on Famfetti.</p>

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
        </form>
      </div>
    </main>
  );
}
