'use client';

import Link from 'next/link';

import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  const onSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      window.alert(error.message);
    }
  };

  return (
    <main className="mx-auto max-w-[800px] px-four pt-four">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="mt-three flex flex-col gap-one rounded-two bg-background-element p-three">
        <span className="text-sm font-semibold text-text-secondary">Signed in as</span>
        <span>{user?.email ?? '—'}</span>
      </div>

      <Link
        href="/profile"
        className="mt-two block rounded-two border border-background-selected py-three text-center font-semibold"
      >
        Edit profile
      </Link>

      <Link
        href="/invite"
        className="mt-two block rounded-two border border-background-selected py-three text-center font-semibold"
      >
        Invite family member
      </Link>

      <button
        type="button"
        onClick={onSignOut}
        className="mt-two block w-full rounded-two border border-background-selected py-three text-center font-semibold"
      >
        Sign out
      </button>
    </main>
  );
}
