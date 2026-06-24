import { NextRequest } from 'next/server';
import { supabaseServer } from './supabase-server';

export async function verifyToken(req: NextRequest): Promise<{ userId: string } | null> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const { data: { user }, error } = await supabaseServer.auth.getUser(token);
  if (error || !user?.id) return null;
  return { userId: user.id };
}
