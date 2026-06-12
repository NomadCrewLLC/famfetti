'use client';

import { Group, Paper, Stack, Text } from '@mantine/core';
import Link from 'next/link';

import { upcomingFeed, type FamilyEvent } from '@/lib/events';

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

type FeedItem = ReturnType<typeof upcomingFeed>[number];

/**
 * The upcoming-events feed shared by the home and events pages. Each row links
 * into the event form for editing. Callers do their own loading and pass in the
 * output of `upcomingFeed`.
 */
export function EventList({ items }: { items: FeedItem[] }) {
  return (
    <Stack gap="sm">
      {items.map((item) => (
        <Paper
          key={item.event.id}
          component={Link}
          href={`/event-form?id=${item.event.id}`}
          bg="var(--color-background-element)"
          p="md"
          radius="md"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Group justify="space-between" gap="md" wrap="nowrap">
            <Stack gap={2}>
              <Text>{item.event.title}</Text>
              <Text size="sm" c="dimmed">
                {TYPE_LABEL[item.event.type]}
                {item.event.recurring ? ' · yearly' : ''}
              </Text>
            </Stack>
            <Stack gap={2} align="flex-end">
              <Text fw={600}>{DATE_FMT.format(item.next)}</Text>
              <Text size="sm" c="dimmed">
                {daysLabel(item.days)}
              </Text>
            </Stack>
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}
