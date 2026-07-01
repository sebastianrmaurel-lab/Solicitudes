import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  localStorage.setItem('sb-token', data.session.access_token);
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
  localStorage.removeItem('sb-token');
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
