'use client';

import { useEffect, useState } from 'react';

import { getFamily, type Family } from '@/lib/families';
import { useFamilyStore } from '@/store/family';

export default function InvitePage() {
  const activeFamilyId = useFamilyStore((s) => s.activeFamilyId);

  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeFamilyId) return;
    let cancelled = false;

    (async () => {
      try {
        const data = await getFamily(activeFamilyId);
        if (!cancelled) setFamily(data);
      } catch (e) {
        if (!cancelled) window.alert(e instanceof Error ? e.message : 'Could not load invite code.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeFamilyId]);

  const onShare = async () => {
    if (!family) return;
    const text = `Join our family "${family.name}" on Famfetti! Use invite code: ${family.invite_code}`;

    if (navigator.share) {
      await navigator.share({ title: 'Famfetti invite', text });
      return;
    }

    await navigator.clipboard.writeText(family.invite_code);
    window.alert('Copied invite code to clipboard.');
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-[800px] px-four pt-four">
        <p className="text-text-secondary">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[800px] px-four pt-four">
      <p className="text-text-secondary">
        Share this code with family members so they can join {family?.name}.
      </p>

      <div className="mt-four flex flex-col items-center gap-one rounded-two bg-background-element py-four">
        <span className="text-3xl font-bold tracking-widest">{family?.invite_code}</span>
      </div>

      <button
        type="button"
        onClick={onShare}
        className="mt-four w-full rounded-two bg-text py-three text-center font-semibold text-background"
      >
        Share invite code
      </button>
    </main>
  );
}
