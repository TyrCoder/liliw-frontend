import { supabaseServer } from './supabase-server';

const TYPE_LABELS: Record<string, string> = {
  cms_attractions:  'Attraction',
  cms_events:       'Event',
  cms_news:         'News',
  cms_art_forms:    'Art Form',
  cms_artisans:     'Artisan',
  cms_stories:      'Story',
  cms_faqs:         'FAQ',
  cms_itineraries:  'Itinerary',
};

export async function logCmsAction(opts: {
  table:       string;
  entryId:     string;
  entryTitle:  string;
  // archive/restore are distinct from delete on purpose: the audit trail should
  // show that something was taken off the site and could still be brought back,
  // not imply it was destroyed.
  event:       'entry.create' | 'entry.update' | 'entry.delete' | 'entry.submit'
             | 'entry.publish' | 'entry.unpublish' | 'entry.archive' | 'entry.restore';
  performedBy: string;
  role:        string;
}) {
  const model = TYPE_LABELS[opts.table] ?? opts.table;
  void supabaseServer.from('audit_logs').insert({
    event:        opts.event,
    model,
    entry_id:     opts.entryId,
    entry_title:  opts.entryTitle.slice(0, 120),
    performed_by: opts.performedBy,
    changes:      { role: opts.role },
  }).then(null, () => {}); // fire-and-forget, never block the main response
}
