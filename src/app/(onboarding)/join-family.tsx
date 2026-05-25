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
import { joinFamily } from '@/lib/families';
import { useFamilyStore } from '@/store/family';

export default function JoinFamilyScreen() {
  const theme = useTheme();
  const setActiveFamily = useFamilyStore((s) => s.setActiveFamily);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      Alert.alert('Code required', 'Enter the invite code your family shared with you.');
      return;
    }

    setSubmitting(true);
    try {
      const family = await joinFamily(normalized);
      // Flip the flag — the root gate will replace onboarding with the tabs.
      setActiveFamily(family.id);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong.';
      Alert.alert('Could not join family', message);
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
            <ThemedText type="subtitle">Join a family</ThemedText>
            <ThemedText type="default" themeColor="textSecondary">
              Enter the 7-character invite code shared with you.
            </ThemedText>

            <View style={styles.form}>
              <TextInput
                style={[
                  styles.input,
                  styles.codeInput,
                  { color: theme.text, borderColor: theme.backgroundSelected },
                ]}
                placeholder="ABC1234"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={7}
                value={code}
                onChangeText={(t) => setCode(t.toUpperCase())}
                editable={!submitting}
              />

              <Pressable
                style={[styles.primaryButton, { backgroundColor: theme.text }]}
                onPress={onSubmit}
                disabled={submitting}>
                <ThemedText type="smallBold" style={{ color: theme.background }}>
                  {submitting ? 'Joining…' : 'Join family'}
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
  codeInput: {
    textAlign: 'center',
    letterSpacing: 4,
    fontSize: 24,
    fontWeight: '700',
  },
  primaryButton: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
  },
});
