'use client';

import { Button, Container, CopyButton, Modal, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createFamily, type Family } from '@/lib/families';

export default function CreateFamilyPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Held so the invite code can be shown before we navigate away — the user
  // has to see it, so this modal blocks the way the old window.alert did.
  const [created, setCreated] = useState<Family | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Please give your family a name.');
      return;
    }

    setSubmitting(true);
    try {
      setCreated(await createFamily(trimmed));
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Could not create family',
        message: err instanceof Error ? err.message : 'Something went wrong.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container size={800} px="lg" pt="lg" mih="100vh">
      <Title order={1} fz={20}>
        Create a family
      </Title>
      <Text c="dimmed" mt="xs">
        You&apos;ll get an invite code to share with the rest of your family.
      </Text>

      <form onSubmit={onSubmit}>
        <Stack gap="md" mt="lg">
          <TextInput
            placeholder="Family name (e.g. The Vergaras)"
            size="md"
            value={name}
            error={nameError}
            onChange={(e) => {
              setName(e.currentTarget.value);
              setNameError(null);
            }}
            disabled={submitting}
          />
          <Button type="submit" size="md" loading={submitting}>
            Create family
          </Button>
        </Stack>
      </form>

      <Modal
        opened={created !== null}
        // No close button and no click-away: the only way out is Continue, so
        // nobody navigates into the app without having seen the code.
        withCloseButton={false}
        closeOnClickOutside={false}
        closeOnEscape={false}
        onClose={() => router.replace('/')}
        title={`${created?.name ?? ''} created!`}
        centered
      >
        <Stack gap="md">
          <Text c="dimmed">Share this invite code so others can join:</Text>

          <Paper bg="var(--color-background-element)" py="lg" radius="md">
            <Text ta="center" fz={30} fw={700} style={{ letterSpacing: '0.15em' }}>
              {created?.invite_code}
            </Text>
          </Paper>

          <CopyButton value={created?.invite_code ?? ''}>
            {({ copied, copy }) => (
              <Button variant="default" size="md" onClick={copy}>
                {copied ? 'Copied!' : 'Copy code'}
              </Button>
            )}
          </CopyButton>

          <Button size="md" onClick={() => router.replace('/')}>
            Continue
          </Button>
        </Stack>
      </Modal>
    </Container>
  );
}
