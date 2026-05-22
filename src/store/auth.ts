import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

type AuthState = {
  session: Session | null;
  user: User | null;
  // `initializing` is true until we've checked AsyncStorage for a persisted session.
  // The root layout gates redirects on this so we don't bounce the user to /sign-in
  // before the saved session has been restored.
  initializing: boolean;
  setSession: (session: Session | null) => void;
  setInitializing: (initializing: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  initializing: true,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setInitializing: (initializing) => set({ initializing }),
}));
