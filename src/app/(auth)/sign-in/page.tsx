'use client';

import { Anchor, Button, Center, Group, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { supabase } from '@/lib/supabase/client';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: typeof errors = {};
    if (!email) nextErrors.email = 'Email is required.';
    if (!password) nextErrors.password = 'Password is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (error) {
      notifications.show({ color: 'red', title: 'Could not sign in', message: error.message });
      return;
    }

    router.replace('/');
  };

  return (
    <Center mih="100vh" px="lg" py={64}>
      <Stack w="100%" maw={400} gap={0}>
        <Title order={1} fz={30} ta="center">
          Famfetti
        </Title>
        <Text c="dimmed" ta="center" mt="xs">
          Sign in to keep up with your family.
        </Text>

        <form onSubmit={onSubmit}>
          <Stack gap="md" mt="lg">
            <TextInput
              type="email"
              placeholder="Email"
              autoComplete="email"
              size="md"
              value={email}
              error={errors.email}
              onChange={(e) => {
                setEmail(e.currentTarget.value);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              disabled={submitting}
            />
            <PasswordInput
              placeholder="Password"
              autoComplete="current-password"
              size="md"
              value={password}
              error={errors.password}
              onChange={(e) => {
                setPassword(e.currentTarget.value);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              disabled={submitting}
            />

            <Button type="submit" size="md" loading={submitting}>
              Sign in
            </Button>

            <Group gap="xs" justify="center">
              <Text size="sm" c="dimmed">
                No account yet?
              </Text>
              <Anchor component={Link} href="/sign-up" replace size="sm" fw={600} underline="always">
                Create one
              </Anchor>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Center>
  );
}
