import { Stack, Text } from '@mantine/core';

/** Centered "nothing here yet" message, with an optional call to action below. */
export function EmptyState({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <Stack align="center" gap="md" py={64}>
      <Text c="dimmed" ta="center">
        {message}
      </Text>
      {children}
    </Stack>
  );
}
