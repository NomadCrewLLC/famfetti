'use client';

import { Avatar, Button, Container, Input, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LoadingState } from '@/components/loading-state';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      if (cancelled) return;

      if (error) {
        notifications.show({ color: 'red', title: 'Could not load profile', message: error.message });
      } else {
        setName(data?.name ?? '');
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Please enter a name.');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ name: trimmed, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    setSaving(false);

    if (error) {
      notifications.show({ color: 'red', title: 'Could not save profile', message: error.message });
      return;
    }
    router.back();
  };

  const initial = (name.trim()[0] ?? user?.email?.[0] ?? '?').toUpperCase();

  if (loading) {
    return (
      <Container size={800} px="lg" pt="lg">
        <LoadingState />
      </Container>
    );
  }

  return (
    <Container size={800} px="lg" pt="lg">
      <form onSubmit={onSave}>
        <Stack gap="lg">
          <Stack align="center" gap="sm">
            <Avatar size={96} radius="xl" color="gray">
              <Text fz={24} fw={700}>
                {initial}
              </Text>
            </Avatar>
            <Text size="sm" c="dimmed">
              Avatar upload coming soon
            </Text>
          </Stack>

          <TextInput
            label="Name"
            placeholder="Your name"
            size="md"
            value={name}
            error={nameError}
            onChange={(e) => {
              setName(e.currentTarget.value);
              setNameError(null);
            }}
            disabled={saving}
          />

          <Input.Wrapper label="Email">
            <Text>{user?.email ?? '—'}</Text>
          </Input.Wrapper>

          <Button type="submit" size="md" mt="sm" loading={saving}>
            Save
          </Button>
        </Stack>
      </form>
    </Container>
  );
}
