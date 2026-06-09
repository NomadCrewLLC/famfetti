'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import {
  createEvent,
  deleteEvent,
  getEvent,
  updateEvent,
  type EventInput,
  type EventType,
} from '@/lib/events';
import { useAuthStore } from '@/store/auth';
import { useFamilyStore } from '@/store/family';

const TYPES: { value: EventType; label: string }[] = [
  { value: 'birthday', label: 'Birthday' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'other', label: 'Other' },
];

// Matches YYYY-MM-DD with a basic month/day sanity check. Real calendar
// validity (e.g. Feb 30) is caught by Postgres when we save.
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export default function EventFormPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-[800px] px-four pt-four">
          <p className="text-text-secondary">Loading…</p>
        </main>
      }
    >
      <EventForm />
    </Suspense>
  );
}

function EventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const isEdit = !!id;

  const userId = useAuthStore((s) => s.user?.id ?? null);
  const familyId = useFamilyStore((s) => s.activeFamilyId);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<EventType>('birthday');
  const [notes, setNotes] = useState('');
  const [recurring, setRecurring] = useState(true);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const event = await getEvent(id);
        if (cancelled || !event) return;
        setTitle(event.title);
        setDate(event.event_date);
        setType(event.type);
        setNotes(event.notes ?? '');
        setRecurring(event.recurring);
      } catch (e) {
        window.alert(e instanceof Error ? e.message : 'Could not load event.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyId || !userId) {
      window.alert('Family or user not loaded yet.');
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      window.alert('Please give the event a title.');
      return;
    }
    if (!DATE_RE.test(date)) {
      window.alert('Use the format YYYY-MM-DD (e.g. 2025-05-22).');
      return;
    }

    const input: EventInput = {
      title: trimmedTitle,
      event_date: date,
      type,
      notes: notes.trim() ? notes.trim() : null,
      recurring,
    };

    setSaving(true);
    try {
      if (isEdit && id) {
        await updateEvent(id, input);
      } else {
        await createEvent(familyId, userId, input);
      }
      router.back();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!id) return;
    if (!window.confirm('Delete event? This can’t be undone.')) return;

    setDeleting(true);
    try {
      await deleteEvent(id);
      router.back();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-[800px] px-four pt-four">
        <p className="text-text-secondary">Loading…</p>
      </main>
    );
  }

  const busy = saving || deleting;

  return (
    <main className="mx-auto max-w-[800px] px-four pb-six pt-four">
      <form onSubmit={onSave} className="flex flex-col gap-four">
        <div className="flex flex-col gap-one">
          <span className="text-sm font-semibold text-text-secondary">Title</span>
          <input
            type="text"
            placeholder="Mom's birthday"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy}
            className="rounded-two border border-background-selected px-three py-three text-base"
          />
        </div>

        <div className="flex flex-col gap-one">
          <span className="text-sm font-semibold text-text-secondary">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={busy}
            className="rounded-two border border-background-selected px-three py-three text-base"
          />
        </div>

        <div className="flex flex-col gap-one">
          <span className="text-sm font-semibold text-text-secondary">Type</span>
          <div className="flex flex-wrap gap-two">
            {TYPES.map((t) => {
              const selected = type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  disabled={busy}
                  className={
                    'rounded-full border border-background-selected px-three py-two font-semibold ' +
                    (selected ? 'bg-text text-background' : 'bg-background-element text-text')
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex items-center gap-three">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            disabled={busy}
            className="h-5 w-5"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text-secondary">Repeats yearly</span>
            <span className="text-sm text-text-secondary">
              Birthdays and anniversaries usually do.
            </span>
          </div>
        </label>

        <div className="flex flex-col gap-one">
          <span className="text-sm font-semibold text-text-secondary">Notes</span>
          <textarea
            placeholder="Anything to remember"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={busy}
            rows={4}
            className="rounded-two border border-background-selected px-three py-three text-base"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="mt-two rounded-two bg-text py-three text-center font-semibold text-background disabled:opacity-60"
        >
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create event'}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="py-three text-center font-semibold text-[#d12c2c] disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete event'}
          </button>
        )}
      </form>
    </main>
  );
}
