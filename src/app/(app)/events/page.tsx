'use client';

import { Alert, Button, Container, Group, Title } from '@mantine/core';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { EmptyState } from '@/components/empty-state';
import { EventList } from '@/components/event-list';
import { LoadingState } from '@/components/loading-state';
import { listFamilyEvents, upcomingFeed, type FamilyEvent } from '@/lib/events';
import { useFamilyStore } from '@/store/family';

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
    <Container size={800} px="lg" pt="lg" pb={64}>
      <Group justify="space-between" align="center" gap="md" pb="md">
        <Title order={1} fz={24}>
          Events
        </Title>
        <Button component={Link} href="/event-form">
          + Add
        </Button>
      </Group>

      {error && (
        <Alert color="red" mb="md" title="Could not load events">
          {error}
        </Alert>
      )}

      {loading ? (
        <LoadingState />
      ) : feed.length === 0 ? (
        <EmptyState message='No upcoming events yet. Tap "+ Add" to create your first one.' />
      ) : (
        <EventList items={feed} />
      )}
    </Container>
  );
}
