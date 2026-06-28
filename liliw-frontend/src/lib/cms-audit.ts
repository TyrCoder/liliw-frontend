import { supabaseServer } from './supabase-server';

const TYPE_LABELS: Record<string, string> = {
  cms_attractions:  'Attraction',
  cms_events:       'Event',
  cms_news:         'News',
  cms_art_forms:    'Art Form',
  cms_artisans:     'Artisan',
  cms_stories:      'Story',
  cms_hero_slides:  'Hero Slide',
  cms_faqs:         'FAQ',
  cms_itineraries:  'Itinerary',
};

export async function logCmsAction(opts: {
  table:       string;
  entryId:     string;
  entryTitle:  string;
  event:       'entry.create' | 'entry.update' | 'entry.delete' | 'entry.submit' | 'entry.publish' | 'entry.unpublish';
  performedBy: string;
  role:        string;
}) {
  const model = TYPE_LABELS[opts.table] ?? opts.table;
  await supabaseServer.from('audit_logs').insert({
    event:        opts.event,
    model,
    entry_id:     opts.entryId,
    entry_title:  opts.entryTitle.slice(0, 120),
    performed_by: opts.performedBy,
    changes:      { role: opts.role },
  }).catch(() => {}); // fire-and-forget, never block the main response
}
