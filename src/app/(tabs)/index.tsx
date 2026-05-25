import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { listFamilyEvents, upcomingFeed, type FamilyEvent } from '@/lib/events';
import { useAuthStore } from '@/store/auth';
import { useFamilyStore } from '@/store/family';

const TYPE_LABEL: Record<FamilyEvent['type'], string> = {
  birthday: 'Birthday',
  anniversary: 'Anniversary',
  holiday: 'Holiday',
  other: 'Event',
};

const DATE_FMT = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

function daysLabel(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `in ${days} days`;
}

const HORIZON_DAYS = 30;

export default function HomeScreen() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const familyId = useFamilyStore((s) => s.activeFamilyId);
  const greeting = (user?.user_metadata?.name as string | undefined) ?? user?.email ?? 'there';

  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!familyId) return;
    setError(null);
    try {
      setEvents(await listFamilyEvents(familyId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load events.');
    }
  }, [familyId]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      load().finally(() => {
        if (!cancelled) setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const feed = upcomingFeed(events).filter((e) => e.days <= HORIZON_DAYS);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <ThemedText type="title">Hi, {greeting}</ThemedText>
            <ThemedText type="default" themeColor="textSecondary">
              Next {HORIZON_DAYS} days
            </ThemedText>
          </View>
          <Link href="/event-form" asChild>
            <Pressable
              style={StyleSheet.flatten([styles.addButton, { backgroundColor: theme.text }])}>
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                + Add
              </ThemedText>
            </Pressable>
          </Link>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : (
          <FlatList
            data={feed}
            keyExtractor={(item) => item.event.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <ThemedText type="default" themeColor="textSecondary">
                  {error
                    ? error
                    : `Nothing in the next ${HORIZON_DAYS} days. Tap "+ Add" to create an event.`}
                </ThemedText>
              </View>
            }
            renderItem={({ item }) => (
              <Link href={{ pathname: '/event-form', params: { id: item.event.id } }} asChild>
                <Pressable
                  style={StyleSheet.flatten([
                    styles.row,
                    { backgroundColor: theme.backgroundElement },
                  ])}>
                  <View style={styles.rowMain}>
                    <ThemedText type="default">{item.event.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {TYPE_LABEL[item.event.type]}
                      {item.event.recurring ? ' · yearly' : ''}
                    </ThemedText>
                  </View>
                  <View style={styles.rowSide}>
                    <ThemedText type="smallBold">{DATE_FMT.format(item.next)}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {daysLabel(item.days)}
                    </ThemedText>
                  </View>
                </Pressable>
              </Link>
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  addButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  list: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { paddingVertical: Spacing.six, alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.three,
  },
  rowMain: { flex: 1, gap: Spacing.half },
  rowSide: { alignItems: 'flex-end', gap: Spacing.half },
});
