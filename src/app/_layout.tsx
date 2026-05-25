import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View, useColorScheme } from 'react-native';

import { useFamilyMembershipBootstrap } from '@/hooks/use-family-membership';
import { useSessionBootstrap } from '@/hooks/use-session';
import { useAuthStore } from '@/store/auth';
import { useFamilyStore } from '@/store/family';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useSessionBootstrap();
  useFamilyMembershipBootstrap();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile" options={{ headerShown: true, title: 'Edit profile' }} />
          <Stack.Screen name="event-form" options={{ headerShown: true, title: 'Event' }} />
        </Stack>
      </AuthGate>
    </ThemeProvider>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const session = useAuthStore((s) => s.session);
  const initializing = useAuthStore((s) => s.initializing);
  const hasFamily = useFamilyStore((s) => s.hasFamily);

  // Hold the splash while we either (a) restore the persisted session or
  // (b) have a session but haven't yet checked family membership. Otherwise
  // a signed-in user without a family would briefly see the tabs before
  // being kicked to onboarding.
  const checkingFamily = !!session && hasFamily === null;

  useEffect(() => {
    if (initializing || checkingFamily) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!session) {
      if (!inAuthGroup) router.replace('/sign-in');
      return;
    }

    if (!hasFamily) {
      if (!inOnboardingGroup) router.replace('/welcome');
      return;
    }

    if (inAuthGroup || inOnboardingGroup) {
      router.replace('/');
    }
  }, [session, initializing, checkingFamily, hasFamily, segments, router]);

  if (initializing || checkingFamily) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
