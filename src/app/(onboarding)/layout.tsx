import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  const { data: membership } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (membership?.family_id) redirect('/');

  return children;
}
