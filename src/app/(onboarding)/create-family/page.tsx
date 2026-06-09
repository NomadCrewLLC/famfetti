'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createFamily } from '@/lib/families';

export default function CreateFamilyPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      window.alert('Please give your family a name.');
      return;
    }

    setSubmitting(true);
    try {
      const family = await createFamily(trimmed);
      // window.alert blocks until dismissed, same as the RN Alert it replaces —
      // the user sees the code before we navigate them into the app.
      window.alert(`${family.name} created!\n\nShare this invite code so others can join:\n\n${family.invite_code}`);
      router.replace('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      window.alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-four pt-four text-text">
      <h1 className="text-xl font-bold">Create a family</h1>
      <p className="mt-one text-text-secondary">
        You&apos;ll get an invite code to share with the rest of your family.
      </p>

      <form onSubmit={onSubmit} className="mt-four flex flex-col gap-three">
        <input
          type="text"
          placeholder="Family name (e.g. The Vergaras)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
          className="rounded-two border border-background-selected px-three py-three text-base"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-two bg-text py-three text-center font-semibold text-background disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Create family'}
        </button>
      </form>
    </main>
  );
}
