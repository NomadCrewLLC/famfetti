import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function WelcomeScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Famfetti
            </ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.tagline}>
              Create a family to get started, or join one with an invite code.
            </ThemedText>
          </View>

          <View style={styles.actions}>
            <Link href="/create-family" asChild>
              <Pressable
                style={StyleSheet.flatten([
                  styles.primaryButton,
                  { backgroundColor: theme.text },
                ])}>
                <ThemedText type="smallBold" style={{ color: theme.background }}>
                  Create a family
                </ThemedText>
              </Pressable>
            </Link>

            <Link href="/join-family" asChild>
              <Pressable
                style={StyleSheet.flatten([
                  styles.secondaryButton,
                  { borderColor: theme.backgroundSelected },
                ])}>
                <ThemedText type="smallBold">Join with invite code</ThemedText>
              </Pressable>
            </Link>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    justifyContent: 'space-between',
    paddingBottom: Spacing.six,
  },
  header: { gap: Spacing.three, marginTop: Spacing.six },
  title: { textAlign: 'center' },
  tagline: { textAlign: 'center' },
  actions: { gap: Spacing.three },
  primaryButton: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
});
