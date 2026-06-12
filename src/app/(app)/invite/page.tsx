'use client';

import { Button, Container, Paper, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';

import { LoadingState } from '@/components/loading-state';
import { getFamily, type Family } from '@/lib/families';
import { buildInviteLink } from '@/lib/invite';
import { useFamilyStore } from '@/store/family';

export default function InvitePage() {
  const activeFamilyId = useFamilyStore((s) => s.activeFamilyId);

  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  useEffect(() => {
    if (!activeFamilyId) return;
    let cancelled = false;

    (async () => {
      try {
        const data = await getFamily(activeFamilyId);
        if (!cancelled) setFamily(data);
      } catch (e) {
        if (!cancelled) {
          notifications.show({
            color: 'red',
            title: 'Could not load invite code',
            message: e instanceof Error ? e.message : 'Could not load invite code.',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeFamilyId]);

  const onShare = async () => {
    if (!family) return;
    const text = `Join our family "${family.name}" on Famfetti! Use invite code: ${family.invite_code}`;

    if (navigator.share) {
      await navigator.share({ title: 'Famfetti invite', text });
      return;
    }

    await navigator.clipboard.writeText(family.invite_code);
    notifications.show({ message: 'Copied invite code to clipboard.' });
  };

  // Wraps the same code in a sign-up URL, so the person we invite lands on a
  // form that already knows the code instead of having to retype it.
  const onGenerateLink = async () => {
    if (!family) return;
    const link = buildInviteLink(family.invite_code);
    setInviteLink(link);

    try {
      await navigator.clipboard.writeText(link);
      notifications.show({ message: 'Copied invite link to clipboard.' });
    } catch {
      // Clipboard can be blocked (no HTTPS, denied permission). The link is
      // rendered below the button either way, so it stays copyable by hand.
      notifications.show({ color: 'yellow', message: 'Copy the link below to share it.' });
    }
  };

  if (loading) {
    return (
      <Container size={800} px="lg" pt="lg">
        <LoadingState />
      </Container>
    );
  }

  return (
    <Container size={800} px="lg" pt="lg">
      <Text c="dimmed">Share this code with family members so they can join {family?.name}.</Text>

      <Paper bg="var(--color-background-element)" py="lg" radius="md" mt="lg">
        <Text ta="center" fz={30} fw={700} style={{ letterSpacing: '0.15em' }}>
          {family?.invite_code}
        </Text>
      </Paper>

      <Stack gap="md" mt="lg">
        <Button size="md" onClick={onShare}>
          Share invite code
        </Button>

        <Button size="md" variant="default" onClick={onGenerateLink}>
          Generate link
        </Button>

        {inviteLink && (
          <Text size="sm" c="dimmed" ff="monospace" ta="center" style={{ wordBreak: 'break-all' }}>
            {inviteLink}
          </Text>
        )}
      </Stack>
    </Container>
  );
}
