import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

const BUCKET = 'avatars';
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Custom avatar upload, into Supabase Storage rather than Cloudinary — the
 * image belongs to the account, so it lives with the rest of the account data
 * and is removed by the same delete.
 *
 * The browser screens the picture before sending it, but that check runs on
 * the client and is therefore advisory: it stops honest mistakes, not someone
 * calling this endpoint directly. What is enforced here is everything that
 * can be: who you are, how big it is, and what type it claims to be.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user } } = await supabaseServer.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No image was received.' }, { status: 400 });
  }

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Use a JPEG, PNG or WebP image.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 2 MB.` },
      { status: 400 },
    );
  }

  // Foldered by user id, which is what the Storage policy checks, and named
  // fresh each time so a replaced avatar is never served from cache.
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${user.id}/${Date.now()}.${ext}`;

  // Clear the previous upload rather than accumulating one file per change.
  const { data: existing } = await supabaseServer.storage.from(BUCKET).list(user.id);
  if (existing?.length) {
    await supabaseServer.storage
      .from(BUCKET)
      .remove(existing.map(f => `${user.id}/${f.name}`));
  }

  const { error } = await supabaseServer.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true, cacheControl: '3600' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: pub } = supabaseServer.storage.from(BUCKET).getPublicUrl(path);

  const { error: saveError } = await supabaseServer
    .from('tourist_profiles')
    .upsert(
      { email: user.email!.toLowerCase(), avatar: pub.publicUrl, avatar_updated_at: new Date().toISOString() },
      { onConflict: 'email' },
    );

  if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 });

  return NextResponse.json({ url: pub.publicUrl });
}

/** Drop a custom avatar and its file, returning the profile to initials. */
export async function DELETE(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user } } = await supabaseServer.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: existing } = await supabaseServer.storage.from(BUCKET).list(user.id);
  if (existing?.length) {
    await supabaseServer.storage.from(BUCKET).remove(existing.map(f => `${user.id}/${f.name}`));
  }

  await supabaseServer
    .from('tourist_profiles')
    .upsert({ email: user.email!.toLowerCase(), avatar: null }, { onConflict: 'email' });

  return NextResponse.json({ success: true });
}
