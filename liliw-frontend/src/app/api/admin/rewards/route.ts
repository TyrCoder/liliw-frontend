import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { requireAdminAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseServer
    .from('rewards')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ data: [], _error: error.message });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, description, icon, badge_color, points_cost, stock, sort_order } = body;

  if (!name?.trim() || !description?.trim() || points_cost == null) {
    return NextResponse.json({ error: 'name, description, and points_cost are required' }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from('rewards')
    .insert({
      name: name.trim(),
      description: description.trim(),
      icon: icon || '🎁',
      badge_color: badge_color || '#1565C0',
      points_cost,
      stock: stock === '' || stock == null ? null : stock,
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
  if ('stock' in fields && (fields.stock === '' || fields.stock == null)) fields.stock = null;

  const { data, error } = await supabaseServer
    .from('rewards')
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

  const { error } = await supabaseServer.from('rewards').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
