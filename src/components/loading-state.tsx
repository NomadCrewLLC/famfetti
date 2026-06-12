import { Group, Loader, Text } from '@mantine/core';

/** Replaces the "Loading…" paragraph that used to be copy-pasted across pages. */
export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <Group gap="sm" py="lg" justify="center">
      <Loader size="sm" />
      <Text c="dimmed">{label}</Text>
    </Group>
  );
}
