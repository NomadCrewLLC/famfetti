'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { listFamilyEvents, upcomingFeed, type FamilyEvent } from '@/lib/events';
import { useAuthStore } from '@/store/auth';
import { useFamilyStore } from '@/store/family';

const TYPE_LABEL: Record<FamilyEvent['type'], string> = {
  birthday: 'Birthday',
  anniversary: 'Anniversary',
  holiday: 'Holiday',
  other: 'Event',
};

const DATE_FMT = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

function daysLabel(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `in ${days} days`;
}

const HORIZON_DAYS = 30;

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const familyId = useFamilyStore((s) => s.activeFamilyId);
  const greeting = (user?.user_metadata?.name as string | undefined) ?? user?.email ?? 'there';

  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!familyId) return;
    setError(null);
    try {
      setEvents(await listFamilyEvents(familyId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load events.');
    }
  }, [familyId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const feed = upcomingFeed(events).filter((e) => e.days <= HORIZON_DAYS);

  return (
    <main className="mx-auto max-w-[800px] px-four pb-six pt-four">
      <div className="flex items-center gap-three pb-three">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Hi, {greeting}</h1>
          <p className="text-text-secondary">Next {HORIZON_DAYS} days</p>
        </div>
        <Link
          href="/event-form"
          className="rounded-two bg-text px-three py-two font-semibold text-background"
        >
          + Add
        </Link>
      </div>

      {loading ? (
        <p className="text-text-secondary">Loading…</p>
      ) : feed.length === 0 ? (
        <p className="py-six text-center text-text-secondary">
          {error ?? `Nothing in the next ${HORIZON_DAYS} days. Tap "+ Add" to create an event.`}
        </p>
      ) : (
        <ul className="flex flex-col gap-two">
          {feed.map((item) => (
            <li key={item.event.id}>
              <Link
                href={`/event-form?id=${item.event.id}`}
                className="flex items-center justify-between gap-three rounded-two bg-background-element px-three py-three"
              >
                <div className="flex flex-col gap-half">
                  <span>{item.event.title}</span>
                  <span className="text-sm text-text-secondary">
                    {TYPE_LABEL[item.event.type]}
                    {item.event.recurring ? ' · yearly' : ''}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-half">
                  <span className="font-semibold">{DATE_FMT.format(item.next)}</span>
                  <span className="text-sm text-text-secondary">{daysLabel(item.days)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
