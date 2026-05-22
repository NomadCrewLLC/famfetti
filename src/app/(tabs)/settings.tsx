import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const onSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Sign out failed', error.message);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <ThemedText type="title">Settings</ThemedText>

          <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Signed in as
            </ThemedText>
            <ThemedText type="default">{user?.email ?? '—'}</ThemedText>
          </View>

          <Pressable
            style={[styles.button, { borderColor: theme.backgroundSelected }]}
            onPress={() => router.push('/profile')}>
            <ThemedText type="smallBold">Edit profile</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.button, { borderColor: theme.backgroundSelected }]}
            onPress={onSignOut}>
            <ThemedText type="smallBold">Sign out</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.four, gap: Spacing.three },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.one,
  },
  button: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
