'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      if (cancelled) return;

      if (error) {
        window.alert(error.message);
      } else {
        setName(data?.name ?? '');
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) {
      window.alert('Please enter a name.');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ name: trimmed, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    setSaving(false);

    if (error) {
      window.alert(error.message);
      return;
    }
    router.back();
  };

  const initial = (name.trim()[0] ?? user?.email?.[0] ?? '?').toUpperCase();

  if (loading) {
    return (
      <main className="mx-auto max-w-[800px] px-four pt-four">
        <p className="text-text-secondary">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[800px] px-four pt-four">
      <form onSubmit={onSave} className="flex flex-col gap-four">
        <div className="flex flex-col items-center gap-two">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-background-element text-2xl font-bold">
            {initial}
          </div>
          <span className="text-sm text-text-secondary">Avatar upload coming soon</span>
        </div>

        <div className="flex flex-col gap-one">
          <span className="text-sm font-semibold text-text-secondary">Name</span>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            className="rounded-two border border-background-selected px-three py-three text-base"
          />
        </div>

        <div className="flex flex-col gap-one">
          <span className="text-sm font-semibold text-text-secondary">Email</span>
          <span>{user?.email ?? '—'}</span>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-two rounded-two bg-text py-three text-center font-semibold text-background disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </main>
  );
}
