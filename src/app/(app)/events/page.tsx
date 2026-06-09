'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { listFamilyEvents, upcomingFeed, type FamilyEvent } from '@/lib/events';
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

export default function EventsPage() {
  const familyId = useFamilyStore((s) => s.activeFamilyId);

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

  const feed = upcomingFeed(events);

  return (
    <main className="mx-auto max-w-[800px] px-four pb-six pt-four">
      <div className="flex items-center justify-between gap-three pb-three">
        <h1 className="text-2xl font-bold">Events</h1>
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
          {error ?? 'No upcoming events yet. Tap "+ Add" to create your first one.'}
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
