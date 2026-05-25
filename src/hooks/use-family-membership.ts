import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { useFamilyStore } from '@/store/family';

/**
 * Whenever the signed-in user changes, fetch the family they belong to (or
 * the first one if multiple) and write it into the family store. Drives both
 * the onboarding redirect and downstream family-scoped queries.
 * Mount once at the root of the app.
 */
export function useFamilyMembershipBootstrap() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const setActiveFamily = useFamilyStore((s) => s.setActiveFamily);
  const setNoFamily = useFamilyStore((s) => s.setNoFamily);
  const setUnknown = useFamilyStore((s) => s.setUnknown);

  useEffect(() => {
    if (!userId) {
      setUnknown();
      return;
    }

    let cancelled = false;
    setUnknown();

    (async () => {
      const { data, error } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        // Fail open to onboarding rather than blocking the user on a splash.
        console.warn('family_members lookup failed', error.message);
        setNoFamily();
        return;
      }

      if (data?.family_id) {
        setActiveFamily(data.family_id);
      } else {
        setNoFamily();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, setActiveFamily, setNoFamily, setUnknown]);
}
