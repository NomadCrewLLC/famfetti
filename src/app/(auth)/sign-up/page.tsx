'use client';

import { Anchor, Button, Center, Group, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { LoadingState } from '@/components/loading-state';
import { joinFamily } from '@/lib/families';
import {
  INVITE_PARAM,
  NEW_FAMILY_PARAM,
  normalizeInviteCode,
  savePendingInviteCode,
} from '@/lib/invite';
import { supabase } from '@/lib/supabase/client';

type FieldErrors = { name?: string; email?: string; password?: string; code?: string };

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Three ways to land here:
  //   /sign-up?invite=X7K2P9 → code is pre-filled and locked (came from a link)
  //   /sign-up               → code is required, typed by hand
  //   /sign-up?new=1         → no code at all, this person is starting a family
  const linkedCode = searchParams.get(INVITE_PARAM);
  const isStartingNewFamily = searchParams.get(NEW_FAMILY_PARAM) === '1';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState(linkedCode ? normalizeInviteCode(linkedCode) : '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const clearError = (field: keyof FieldErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: FieldErrors = {};
    if (!name) nextErrors.name = 'Name is required.';
    if (!email) nextErrors.email = 'Email is required.';
    if (!password) nextErrors.password = 'Password is required.';

    const normalizedCode = normalizeInviteCode(code);
    if (!isStartingNewFamily && !normalizedCode) {
      nextErrors.code = 'An invite code is required — ask whoever invited you for their link.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    // `data` is read by the handle_new_user trigger to populate profiles.name.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      setSubmitting(false);
      notifications.show({ color: 'red', title: 'Could not create account', message: error.message });
      return;
    }

    if (!data.session) {
      // Email confirmation is enabled on the project — user has to confirm
      // before they can sign in, and join_family needs them authenticated. Park
      // the code so /welcome can redeem it on their first signed-in load.
      if (normalizedCode) savePendingInviteCode(normalizedCode);
      setSubmitting(false);
      notifications.show({
        title: 'Check your email',
        message: 'We sent you a confirmation link to finish creating your account.',
        autoClose: false,
      });
      return;
    }

    if (isStartingNewFamily) {
      router.replace('/create-family');
      return;
    }

    try {
      await joinFamily(normalizedCode);
      router.replace('/');
    } catch (err) {
      // The account exists at this point, so don't strand them — /welcome lets
      // them retry the code or create a family instead.
      const message = err instanceof Error ? err.message : 'Could not join that family.';
      notifications.show({ color: 'red', title: 'Could not join that family', message });
      router.replace('/welcome');
    }
  };

  return (
    <Center mih="100vh" px="lg" py={64}>
      <Stack w="100%" maw={400} gap={0}>
        <Title order={1} fz={30} ta="center">
          Create account
        </Title>
        <Text c="dimmed" ta="center" mt="xs">
          {isStartingNewFamily
            ? 'Set up your account, then name your family.'
            : 'Join your family on Famfetti.'}
        </Text>

        <form onSubmit={onSubmit}>
          <Stack gap="md" mt="lg">
            <TextInput
              placeholder="Your name"
              size="md"
              value={name}
              error={errors.name}
              onChange={(e) => {
                setName(e.currentTarget.value);
                clearError('name');
              }}
              disabled={submitting}
            />
            <TextInput
              type="email"
              placeholder="Email"
              autoComplete="email"
              size="md"
              value={email}
              error={errors.email}
              onChange={(e) => {
                setEmail(e.currentTarget.value);
                clearError('email');
              }}
              disabled={submitting}
            />
            <PasswordInput
              placeholder="Password"
              autoComplete="new-password"
              size="md"
              value={password}
              error={errors.password}
              onChange={(e) => {
                setPassword(e.currentTarget.value);
                clearError('password');
              }}
              disabled={submitting}
            />

            {!isStartingNewFamily && (
              <TextInput
                placeholder="Invite code"
                aria-label="Invite code"
                maxLength={7}
                size="md"
                value={code}
                error={errors.code}
                onChange={(e) => {
                  setCode(e.currentTarget.value.toUpperCase());
                  clearError('code');
                }}
                // A code that arrived in the link is locked — editing it would
                // only ever break a working invite.
                disabled={submitting || Boolean(linkedCode)}
                styles={{
                  input: { textAlign: 'center', fontSize: 24, fontWeight: 700, letterSpacing: '0.1em' },
                }}
              />
            )}

            <Button type="submit" size="md" loading={submitting}>
              Create account
            </Button>

            <Group gap="xs" justify="center">
              <Text size="sm" c="dimmed">
                Already have an account?
              </Text>
              <Anchor component={Link} href="/sign-in" replace size="sm" fw={600} underline="always">
                Sign in
              </Anchor>
            </Group>

            {!isStartingNewFamily && (
              <Group gap="xs" justify="center">
                <Text size="sm" c="dimmed">
                  Starting a new family?
                </Text>
                <Anchor
                  component={Link}
                  href={`/sign-up?${NEW_FAMILY_PARAM}=1`}
                  replace
                  size="sm"
                  fw={600}
                  underline="always"
                >
                  Create one
                </Anchor>
              </Group>
            )}
          </Stack>
        </form>
      </Stack>
    </Center>
  );
}

export default function SignUpPage() {
  // useSearchParams needs a Suspense boundary or the production build fails.
  return (
    <Suspense
      fallback={
        <Center mih="100vh">
          <LoadingState />
        </Center>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
