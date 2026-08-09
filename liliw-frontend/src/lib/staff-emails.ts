import { supabaseServer } from './supabase-server';

/**
 * The mailboxes that should hear about a new contact message.
 *
 * Notifications used to go to a single ADMIN_EMAIL, so an officer whose job is
 * answering these never saw one arrive — they had to remember to open the
 * dashboard and look. This gathers the real staff accounts as well.
 *
 * Editors are deliberately excluded: they write content and have no business
 * in the public's correspondence.
 */
export async function staffNotifyEmails(): Promise<string[]> {
  const fromEnv = [
    ...(process.env.ADMIN_EMAILS || '').split(','),
    ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(','),
    process.env.ADMIN_EMAIL || '',
    process.env.BOOKING_NOTIFY_EMAIL || '',
  ];

  let fromDb: string[] = [];
  try {
    const { data } = await supabaseServer
      .from('profiles')
      .select('email, role')
      .in('role', ['admin', 'chatoofficer']);
    fromDb = (data || []).map(r => r.email as string);
  } catch {
    // A lookup failure must not stop the notification going to the env
    // addresses — a message nobody is told about is the thing being fixed.
  }

  const all = [...fromEnv, ...fromDb]
    .map(e => e.trim().toLowerCase())
    .filter(e => e.includes('@'));

  return [...new Set(all)];
}
