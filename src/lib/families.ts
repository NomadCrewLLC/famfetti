import { supabase } from './supabase/client';

export type Family = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export async function createFamily(name: string): Promise<Family> {
  const { data, error } = await supabase.rpc('create_family', { p_name: name });
  if (error) throw error;
  return data as Family;
}

export async function joinFamily(inviteCode: string): Promise<Family> {
  const { data, error } = await supabase.rpc('join_family', {
    p_invite_code: inviteCode,
  });
  if (error) throw error;
  return data as Family;
}

export async function getFamily(familyId: string): Promise<Family> {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .single();

  if (error) throw error;
  return data as Family;
}
