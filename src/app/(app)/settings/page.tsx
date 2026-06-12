'use client';

import {
  Button,
  Container,
  Input,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  // The stored scheme only exists on the client, so the server always renders
  // "auto". Waiting for mount before showing the real value keeps the first
  // client render identical to the server's.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const onSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      notifications.show({ color: 'red', title: 'Could not sign out', message: error.message });
    }
  };

  return (
    <Container size={800} px="lg" pt="lg">
      <Title order={1} fz={24}>
        Settings
      </Title>

      <Paper bg="var(--color-background-element)" p="md" radius="md" mt="md">
        <Stack gap="xs">
          <Text size="sm" fw={600} c="dimmed">
            Signed in as
          </Text>
          <Text>{user?.email ?? '—'}</Text>
        </Stack>
      </Paper>

      <Input.Wrapper label="Theme" mt="md">
        <SegmentedControl
          fullWidth
          mt="xs"
          value={mounted ? colorScheme : 'auto'}
          onChange={(value) => setColorScheme(value as 'light' | 'dark' | 'auto')}
          data={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'auto', label: 'Auto' },
          ]}
        />
      </Input.Wrapper>

      <Stack gap="sm" mt="md">
        <Button component={Link} href="/profile" variant="default" size="md">
          Edit profile
        </Button>

        <Button component={Link} href="/invite" variant="default" size="md">
          Invite family member
        </Button>

        <Button variant="default" size="md" onClick={onSignOut}>
          Sign out
        </Button>
      </Stack>
    </Container>
  );
}
