import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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

export default function EventFormScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const userId = useAuthStore((s) => s.user?.id ?? null);
  const familyId = useFamilyStore((s) => s.activeFamilyId);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<EventType>('birthday');
  const [notes, setNotes] = useState('');
  const [recurring, setRecurring] = useState(true);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        Alert.alert('Could not load event', e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const onSave = async () => {
    if (!familyId || !userId) {
      Alert.alert('Not ready', 'Family or user not loaded yet.');
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Title required', 'Please give the event a title.');
      return;
    }
    if (!DATE_RE.test(date)) {
      Alert.alert('Invalid date', 'Use the format YYYY-MM-DD (e.g. 2025-05-22).');
      return;
    }

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
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!id) return;
    Alert.alert('Delete event?', 'This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteEvent(id);
            router.back();
          } catch (e) {
            Alert.alert('Delete failed', e instanceof Error ? e.message : 'Unknown error');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </ThemedView>
    );
  }

  const busy = saving || deleting;

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Title
            </ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
              placeholder="Mom's birthday"
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
              editable={!busy}
              autoCapitalize="sentences"
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Date
            </ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textSecondary}
              value={date}
              onChangeText={setDate}
              editable={!busy}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Type
            </ThemedText>
            <View style={styles.typeRow}>
              {TYPES.map((t) => {
                const selected = type === t.value;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => setType(t.value)}
                    disabled={busy}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: selected ? theme.text : theme.backgroundElement,
                        borderColor: theme.backgroundSelected,
                      },
                    ]}>
                    <ThemedText
                      type="smallBold"
                      style={{ color: selected ? theme.background : theme.text }}>
                      {t.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.field, styles.switchRow]}>
            <View style={styles.flex}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Repeats yearly
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Birthdays and anniversaries usually do.
              </ThemedText>
            </View>
            <Switch value={recurring} onValueChange={setRecurring} disabled={busy} />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Notes
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.notes,
                { color: theme.text, borderColor: theme.backgroundSelected },
              ]}
              placeholder="Anything to remember"
              placeholderTextColor={theme.textSecondary}
              value={notes}
              onChangeText={setNotes}
              editable={!busy}
              multiline
            />
          </View>

          <Pressable
            style={[styles.primaryButton, { backgroundColor: theme.text }]}
            onPress={onSave}
            disabled={busy}>
            <ThemedText type="smallBold" style={{ color: theme.background }}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create event'}
            </ThemedText>
          </Pressable>

          {isEdit && (
            <Pressable style={styles.deleteButton} onPress={onDelete} disabled={busy}>
              <ThemedText type="smallBold" style={{ color: '#d12c2c' }}>
                {deleting ? 'Deleting…' : 'Delete event'}
              </ThemedText>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  field: { gap: Spacing.one },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  notes: { minHeight: 96, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  typeChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    borderWidth: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  primaryButton: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    marginTop: Spacing.two,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
});
