'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { joinFamily } from '@/lib/families';
import { clearPendingInviteCode, readPendingInviteCode } from '@/lib/invite';

export default function WelcomePage() {
  const router = useRouter();
  const [joining, setJoining] = useState(false);

  // Someone who signed up through an invite link on a project with email
  // confirmation on couldn't join then — there was no session yet. Their code
  // was parked in localStorage, and this is the first screen they hit once
  // they're signed in with no family, so redeem it here.
  useEffect(() => {
    const pendingCode = readPendingInviteCode();
    if (!pendingCode) return;

    let cancelled = false;
    setJoining(true);

    (async () => {
      try {
        await joinFamily(pendingCode);
        clearPendingInviteCode();
        if (!cancelled) router.replace('/');
      } catch (err) {
        // Drop the bad code so we don't retry it forever, and let them fall
        // through to the buttons below.
        clearPendingInviteCode();
        if (cancelled) return;
        window.alert(err instanceof Error ? err.message : 'Could not join that family.');
        setJoining(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (joining) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-text">
        <p className="text-text-secondary">Joining your family…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col justify-between bg-background px-four pb-six pt-six text-text">
      <div className="mt-six flex flex-col gap-three text-center">
        <h1 className="text-3xl font-bold">Famfetti</h1>
        <p className="text-text-secondary">
          Create a family to get started, or join one with an invite code.
        </p>
      </div>

      <div className="flex flex-col gap-three">
        <Link
          href="/create-family"
          className="rounded-two bg-text py-three text-center font-semibold text-background"
        >
          Create a family
        </Link>
        <Link
          href="/join-family"
          className="rounded-two border border-background-selected py-three text-center font-semibold text-text"
        >
          Join with invite code
        </Link>
      </div>
    </main>
  );
}
