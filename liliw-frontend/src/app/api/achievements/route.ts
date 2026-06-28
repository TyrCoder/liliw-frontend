import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET() {
  const { data, error } = await supabaseServer
    .from('achievements')
    .select('id, name, description, icon, badge_color, trigger_type, trigger_value, points_reward, sort_order')
    .eq('is_active', true)
    .order('sort_order');

  if (error) return NextResponse.json({ data: [] });
  return NextResponse.json({ data });
}
