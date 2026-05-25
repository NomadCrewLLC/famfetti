import { create } from 'zustand';

type FamilyState = {
  // null = not yet checked for the current user; false/true = checked.
  // The auth gate waits until this resolves before deciding where to route a
  // signed-in user, so we don't flash the tabs before sending them to onboarding.
  hasFamily: boolean | null;
  // v1 assumes one family per user. If the user is in multiple, this holds
  // the first one returned. Scoped queries (events, messages) read from here.
  activeFamilyId: string | null;
  setActiveFamily: (familyId: string) => void;
  setNoFamily: () => void;
  setUnknown: () => void;
};

export const useFamilyStore = create<FamilyState>((set) => ({
  hasFamily: null,
  activeFamilyId: null,
  setActiveFamily: (familyId) => set({ hasFamily: true, activeFamilyId: familyId }),
  setNoFamily: () => set({ hasFamily: false, activeFamilyId: null }),
  setUnknown: () => set({ hasFamily: null, activeFamilyId: null }),
}));
