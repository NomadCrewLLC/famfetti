'use client';

import {
  Button,
  Checkbox,
  Chip,
  Container,
  Group,
  Input,
  Modal,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { LoadingState } from '@/components/loading-state';
import {
  createEvent,
  deleteEvent,
  getEvent,
  updateEvent,
  type EventInput,
  type EventType,
} from '@/lib/events';
import { useAuthStore } from '@/store/auth';
import { useFamilyStore } from '@/store/family';

const TYPES: { value: EventType; label: string }[] = [
  { value: 'birthday', label: 'Birthday' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'other', label: 'Other' },
];

// Matches YYYY-MM-DD with a basic month/day sanity check. Real calendar
// validity (e.g. Feb 30) is caught by Postgres when we save.
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export default function EventFormPage() {
  return (
    <Suspense
      fallback={
        <Container size={800} px="lg" pt="lg">
          <LoadingState />
        </Container>
      }
    >
      <EventForm />
    </Suspense>
  );
}

function EventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const isEdit = !!id;

  const userId = useAuthStore((s) => s.user?.id ?? null);
  const familyId = useFamilyStore((s) => s.activeFamilyId);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<EventType>('birthday');
  const [notes, setNotes] = useState('');
  const [recurring, setRecurring] = useState(true);

  const [errors, setErrors] = useState<{ title?: string; date?: string }>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const event = await getEvent(id);
        if (cancelled || !event) return;
        setTitle(event.title);
        setDate(event.event_date);
        setType(event.type);
        setNotes(event.notes ?? '');
        setRecurring(event.recurring);
      } catch (e) {
        notifications.show({
          color: 'red',
          title: 'Could not load event',
          message: e instanceof Error ? e.message : 'Could not load event.',
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyId || !userId) {
      notifications.show({
        color: 'red',
        title: 'Not ready yet',
        message: 'Family or user not loaded yet.',
      });
      return;
    }

    const trimmedTitle = title.trim();
    const nextErrors: typeof errors = {};
    if (!trimmedTitle) nextErrors.title = 'Please give the event a title.';
    if (!DATE_RE.test(date)) nextErrors.date = 'Use the format YYYY-MM-DD (e.g. 2025-05-22).';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const input: EventInput = {
      title: trimmedTitle,
      event_date: date,
      type,
      notes: notes.trim() ? notes.trim() : null,
      recurring,
    };

    setSaving(true);
    try {
      if (isEdit && id) {
        await updateEvent(id, input);
      } else {
        await createEvent(familyId, userId, input);
      }
      router.back();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Save failed',
        message: err instanceof Error ? err.message : 'Save failed.',
      });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!id) return;
    setConfirmingDelete(false);
    setDeleting(true);
    try {
      await deleteEvent(id);
      router.back();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Delete failed',
        message: err instanceof Error ? err.message : 'Delete failed.',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Container size={800} px="lg" pt="lg">
        <LoadingState />
      </Container>
    );
  }

  const busy = saving || deleting;

  return (
    <Container size={800} px="lg" pt="lg" pb={64}>
      <form onSubmit={onSave}>
        <Stack gap="lg">
          <TextInput
            label="Title"
            placeholder="Mom's birthday"
            size="md"
            value={title}
            error={errors.title}
            onChange={(e) => {
              setTitle(e.currentTarget.value);
              setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            disabled={busy}
          />

          <TextInput
            type="date"
            label="Date"
            size="md"
            value={date}
            error={errors.date}
            onChange={(e) => {
              setDate(e.currentTarget.value);
              setErrors((prev) => ({ ...prev, date: undefined }));
            }}
            disabled={busy}
          />

          <Input.Wrapper label="Type">
            <Chip.Group
              multiple={false}
              value={type}
              onChange={(value) => setType(value as EventType)}
            >
              <Group gap="sm" mt="xs">
                {TYPES.map((t) => (
                  <Chip key={t.value} value={t.value} disabled={busy}>
                    {t.label}
                  </Chip>
                ))}
              </Group>
            </Chip.Group>
          </Input.Wrapper>

          <Checkbox
            label="Repeats yearly"
            description="Birthdays and anniversaries usually do."
            checked={recurring}
            onChange={(e) => setRecurring(e.currentTarget.checked)}
            disabled={busy}
          />

          <Textarea
            label="Notes"
            placeholder="Anything to remember"
            rows={4}
            size="md"
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
            disabled={busy}
          />

          <Button type="submit" size="md" mt="sm" loading={saving} disabled={deleting}>
            {isEdit ? 'Save changes' : 'Create event'}
          </Button>

          {isEdit && (
            <Button
              variant="subtle"
              color="red"
              size="md"
              onClick={() => setConfirmingDelete(true)}
              loading={deleting}
              disabled={saving}
            >
              Delete event
            </Button>
          )}
        </Stack>
      </form>

      <Modal
        opened={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title="Delete event?"
        centered
      >
        <Stack gap="lg">
          <Text c="dimmed">This can&apos;t be undone.</Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={onDelete}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
