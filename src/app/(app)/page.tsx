'use client';

import { Alert, Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { EmptyState } from '@/components/empty-state';
import { EventList } from '@/components/event-list';
import { LoadingState } from '@/components/loading-state';
import { listFamilyEvents, upcomingFeed, type FamilyEvent } from '@/lib/events';
import { useAuthStore } from '@/store/auth';
import { useFamilyStore } from '@/store/family';

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
    <Container size={800} px="lg" pt="lg" pb={64}>
      <Group align="center" gap="md" pb="md" wrap="nowrap">
        <Stack gap={0} flex={1}>
          <Title order={1} fz={24}>
            Hi, {greeting}
          </Title>
          <Text c="dimmed">Next {HORIZON_DAYS} days</Text>
        </Stack>
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
        <EmptyState
          message={`Nothing in the next ${HORIZON_DAYS} days. Tap "+ Add" to create an event.`}
        />
      ) : (
        <EventList items={feed} />
      )}
    </Container>
  );
}
