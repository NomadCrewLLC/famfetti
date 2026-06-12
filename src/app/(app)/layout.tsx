import { Box } from '@mantine/core';
import { redirect } from 'next/navigation';

import { NavBar } from '@/components/nav-bar';
import { createClient } from '@/lib/supabase/server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
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

  if (!membership?.family_id) redirect('/welcome');

  return (
    <Box mih="100vh">
      <NavBar />
      {children}
    </Box>
  );
}
