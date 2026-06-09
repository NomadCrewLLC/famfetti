'use client';

import { useFamilyMembershipBootstrap } from '@/hooks/use-family-membership';
import { useSessionBootstrap } from '@/hooks/use-session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useSessionBootstrap();
  useFamilyMembershipBootstrap();
  return children;
}
