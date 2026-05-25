import { supabase } from './supabase';

export type EventType = 'birthday' | 'anniversary' | 'holiday' | 'other';

export type FamilyEvent = {
  id: string;
  family_id: string;
  created_by: string | null;
  title: string;
  // ISO date string "YYYY-MM-DD" — Postgres date column.
  event_date: string;
  type: EventType;
  notes: string | null;
  recurring: boolean;
  created_at: string;
  updated_at: string;
};

export type EventInput = {
  title: string;
  event_date: string; // "YYYY-MM-DD"
  type: EventType;
  notes: string | null;
  recurring: boolean;
};

export async function listFamilyEvents(familyId: string): Promise<FamilyEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('family_id', familyId)
    .order('event_date', { ascending: true });

  if (error) throw error;
  return (data ?? []) as FamilyEvent[];
}

export async function getEvent(id: string): Promise<FamilyEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as FamilyEvent | null;
}

export async function createEvent(
  familyId: string,
  userId: string,
  input: EventInput,
): Promise<FamilyEvent> {
  const { data, error } = await supabase
    .from('events')
    .insert({ family_id: familyId, created_by: userId, ...input })
    .select()
    .single();

  if (error) throw error;
  return data as FamilyEvent;
}

export async function updateEvent(id: string, input: EventInput): Promise<FamilyEvent> {
  const { data, error } = await supabase
    .from('events')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as FamilyEvent;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Date helpers — kept here so the UI doesn't reinvent them. We parse "YYYY-MM-DD"
// component-wise to stay in local time; `new Date("2025-05-22")` would parse as
// UTC midnight and visibly shift by a day in negative-offset timezones.
// ---------------------------------------------------------------------------

function parseEventDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * For non-recurring events: returns the literal event date.
 * For recurring events: returns this year's occurrence, or next year's if
 * this year's has already passed.
 */
export function nextOccurrence(event: FamilyEvent, now: Date = new Date()): Date {
  const base = parseEventDate(event.event_date);
  if (!event.recurring) return base;

  const today = startOfDay(now);
  const thisYear = new Date(today.getFullYear(), base.getMonth(), base.getDate());
  if (thisYear.getTime() >= today.getTime()) return thisYear;
  return new Date(today.getFullYear() + 1, base.getMonth(), base.getDate());
}

export function daysUntil(target: Date, now: Date = new Date()): number {
  const ms = startOfDay(target).getTime() - startOfDay(now).getTime();
  return Math.round(ms / 86_400_000);
}

export function isPast(event: FamilyEvent, now: Date = new Date()): boolean {
  if (event.recurring) return false;
  return parseEventDate(event.event_date).getTime() < startOfDay(now).getTime();
}

/** Sorted by next occurrence asc, with past one-off events filtered out. */
export function upcomingFeed(events: FamilyEvent[], now: Date = new Date()): {
  event: FamilyEvent;
  next: Date;
  days: number;
}[] {
  return events
    .filter((e) => !isPast(e, now))
    .map((event) => {
      const next = nextOccurrence(event, now);
      return { event, next, days: daysUntil(next, now) };
    })
    .sort((a, b) => a.next.getTime() - b.next.getTime());
}
