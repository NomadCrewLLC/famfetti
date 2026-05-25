import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createFamily } from '@/lib/families';
import { useFamilyStore } from '@/store/family';

export default function CreateFamilyScreen() {
  const theme = useTheme();
  const setActiveFamily = useFamilyStore((s) => s.setActiveFamily);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please give your family a name.');
      return;
    }

    setSubmitting(true);
    try {
      const family = await createFamily(trimmed);
      // Show the invite code so the user can share it before we drop them
      // into the app. Routing happens when they dismiss — the gate picks up
      // hasFamily=true and replaces to /.
      Alert.alert(
        `${family.name} created`,
        `Share this invite code so others can join:\n\n${family.invite_code}`,
        [{ text: 'Got it', onPress: () => setActiveFamily(family.id) }],
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong.';
      Alert.alert('Could not create family', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.content}>
            <ThemedText type="subtitle">Create a family</ThemedText>
            <ThemedText type="default" themeColor="textSecondary">
              You&apos;ll get an invite code to share with the rest of your family.
            </ThemedText>

            <View style={styles.form}>
              <TextInput
                style={[
                  styles.input,
                  { color: theme.text, borderColor: theme.backgroundSelected },
                ]}
                placeholder="Family name (e.g. The Vergaras)"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
                editable={!submitting}
              />

              <Pressable
                style={[styles.primaryButton, { backgroundColor: theme.text }]}
                onPress={onSubmit}
                disabled={submitting}>
                <ThemedText type="smallBold" style={{ color: theme.background }}>
                  {submitting ? 'Creating…' : 'Create family'}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  form: { gap: Spacing.three, marginTop: Spacing.four },
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
  },
});
