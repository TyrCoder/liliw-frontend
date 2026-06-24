import { supabaseServer } from './supabase-server';

export type CMSMedia = {
  id: string; content_type: string; content_id: string;
  url: string; alt_text: string | null; sort_order: number;
};

export async function fetchApproved(table: string, extra?: (q: any) => any) {
  let q = supabaseServer.from(table).select('*').eq('status', 'approved');
  if (extra) q = extra(q);
  const { data, error } = await q;
  if (error) { console.error(`[cms] ${table}:`, error.message); return []; }
  return data ?? [];
}

export async function fetchMedia(contentType: string, ids: string[]): Promise<Record<string, CMSMedia[]>> {
  if (!ids.length) return {};
  const { data } = await supabaseServer
    .from('cms_media')
    .select('*')
    .eq('content_type', contentType)
    .in('content_id', ids)
    .order('sort_order', { ascending: true });
  const grouped: Record<string, CMSMedia[]> = {};
  for (const m of data ?? []) {
    (grouped[m.content_id] ??= []).push(m);
  }
  return grouped;
}

export async function fetchApprovedWithMedia(table: string, contentType: string, extra?: (q: any) => any) {
  const items = await fetchApproved(table, extra);
  const ids = items.map((i: any) => i.id);
  const media = await fetchMedia(contentType, ids);
  return items.map((item: any) => ({ ...item, _media: media[item.id] ?? [] }));
}

export function mediaToPhotos(mediaArr: CMSMedia[]) {
  return mediaArr.map(m => ({ id: m.id, url: m.url, name: m.alt_text, formats: {} }));
}
