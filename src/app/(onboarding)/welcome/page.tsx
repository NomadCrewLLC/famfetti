'use client';

import { Button, Center, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LoadingState } from '@/components/loading-state';
import { joinFamily } from '@/lib/families';
import { clearPendingInviteCode, readPendingInviteCode } from '@/lib/invite';

export default function WelcomePage() {
  const router = useRouter();
  const [joining, setJoining] = useState(false);

  // Someone who signed up through an invite link on a project with email
  // confirmation on couldn't join then — there was no session yet. Their code
  // was parked in localStorage, and this is the first screen they hit once
  // they're signed in with no family, so redeem it here.
  useEffect(() => {
    const pendingCode = readPendingInviteCode();
    if (!pendingCode) return;

    let cancelled = false;
    setJoining(true);

    (async () => {
      try {
        await joinFamily(pendingCode);
        clearPendingInviteCode();
        if (!cancelled) router.replace('/');
      } catch (err) {
        // Drop the bad code so we don't retry it forever, and let them fall
        // through to the buttons below.
        clearPendingInviteCode();
        if (cancelled) return;
        notifications.show({
          color: 'red',
          title: 'Could not join that family',
          message: err instanceof Error ? err.message : 'Could not join that family.',
        });
        setJoining(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (joining) {
    return (
      <Center mih="100vh">
        <LoadingState label="Joining your family…" />
      </Center>
    );
  }

  return (
    <Stack mih="100vh" justify="space-between" px="lg" py={64}>
      <Stack gap="md" ta="center" mt={64}>
        <Title order={1} fz={30}>
          Famfetti
        </Title>
        <Text c="dimmed">Create a family to get started, or join one with an invite code.</Text>
      </Stack>

      <Stack gap="md">
        <Button component={Link} href="/create-family" size="md">
          Create a family
        </Button>
        <Button component={Link} href="/join-family" size="md" variant="default">
          Join with invite code
        </Button>
      </Stack>
    </Stack>
  );
}
