'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { joinFamily } from '@/lib/families';

export default function JoinFamilyPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      window.alert('Enter the invite code your family shared with you.');
      return;
    }

    setSubmitting(true);
    try {
      await joinFamily(normalized);
      router.replace('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      window.alert(message);
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-four pt-four text-text">
      <h1 className="text-xl font-bold">Join a family</h1>
      <p className="mt-one text-text-secondary">
        Enter the 7-character invite code shared with you.
      </p>

      <form onSubmit={onSubmit} className="mt-four flex flex-col gap-three">
        <input
          type="text"
          placeholder="ABC1234"
          maxLength={7}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          disabled={submitting}
          className="rounded-two border border-background-selected px-three py-three text-center text-2xl font-bold tracking-widest"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-two bg-text py-three text-center font-semibold text-background disabled:opacity-60"
        >
          {submitting ? 'Joining…' : 'Join family'}
        </button>
      </form>
    </main>
  );
}
