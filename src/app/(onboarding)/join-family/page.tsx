'use client';

import { Button, Container, Stack, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { joinFamily } from '@/lib/families';

export default function JoinFamilyPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setCodeError('Enter the invite code your family shared with you.');
      return;
    }

    setSubmitting(true);
    try {
      await joinFamily(normalized);
      router.replace('/');
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Could not join that family',
        message: err instanceof Error ? err.message : 'Something went wrong.',
      });
      setSubmitting(false);
    }
  };

  return (
    <Container size={800} px="lg" pt="lg" mih="100vh">
      <Title order={1} fz={20}>
        Join a family
      </Title>
      <Text c="dimmed" mt="xs">
        Enter the 7-character invite code shared with you.
      </Text>

      <form onSubmit={onSubmit}>
        <Stack gap="md" mt="lg">
          <TextInput
            placeholder="ABC1234"
            maxLength={7}
            size="md"
            value={code}
            error={codeError}
            onChange={(e) => {
              setCode(e.currentTarget.value.toUpperCase());
              setCodeError(null);
            }}
            disabled={submitting}
            styles={{
              input: { textAlign: 'center', fontSize: 24, fontWeight: 700, letterSpacing: '0.1em' },
            }}
          />
          <Button type="submit" size="md" loading={submitting}>
            Join family
          </Button>
        </Stack>
      </form>
    </Container>
  );
}
