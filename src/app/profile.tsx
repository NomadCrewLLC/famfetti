import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';

export default function EditProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState('');
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
        Alert.alert('Could not load profile', error.message);
      } else {
        setName(data?.name ?? '');
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const onSave = async () => {
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter a name.');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ name: trimmed, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    setSaving(false);

    if (error) {
      Alert.alert('Save failed', error.message);
      return;
    }
    router.back();
  };

  const initial = (name.trim()[0] ?? user?.email?.[0] ?? '?').toUpperCase();

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.avatarRow}>
              <View
                style={[styles.avatar, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="subtitle">{initial}</ThemedText>
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                Avatar upload coming soon
              </ThemedText>
            </View>

            <View style={styles.field}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Name
              </ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                placeholder="Your name"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
                editable={!saving}
              />
            </View>

            <View style={styles.field}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Email
              </ThemedText>
              <ThemedText type="default">{user?.email ?? '—'}</ThemedText>
            </View>

            <Pressable
              style={[styles.primaryButton, { backgroundColor: theme.text }]}
              onPress={onSave}
              disabled={saving}>
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                {saving ? 'Saving…' : 'Save'}
              </ThemedText>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  avatarRow: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: { gap: Spacing.one },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  primaryButton: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    marginTop: Spacing.two,
  },
});
