import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { requireAdminAuth } from '@/lib/auth';

const TRIGGER_TYPES = ['event_count', 'review_count', 'total_points'];

export async function GET(request: NextRequest) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseServer
    .from('achievements')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ data: [], _error: error.message });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, description, icon, badge_color, trigger_type, trigger_value, points_reward, sort_order } = body;

  if (!name?.trim() || !description?.trim() || !trigger_type || trigger_value == null) {
    return NextResponse.json({ error: 'name, description, trigger_type, and trigger_value are required' }, { status: 400 });
  }
  if (!TRIGGER_TYPES.includes(trigger_type)) {
    return NextResponse.json({ error: 'Invalid trigger_type' }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from('achievements')
    .insert({
      name: name.trim(),
      description: description.trim(),
      icon: icon || '🏆',
      badge_color: badge_color || '#F59E0B',
      trigger_type,
      trigger_value,
      points_reward: points_reward || 0,
      sort_order: sort_order || 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, ...fields } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (fields.trigger_type && !TRIGGER_TYPES.includes(fields.trigger_type)) {
    return NextResponse.json({ error: 'Invalid trigger_type' }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from('achievements')
    .update(fields)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabaseServer.from('achievements').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
