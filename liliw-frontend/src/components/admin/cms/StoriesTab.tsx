'use client';

import { BookOpen } from 'lucide-react';
import CmsTab, { CmsTabConfig, statusColumn } from './CmsTab';
import { MediaItem } from './MediaUploader';
import { NARRATION_KEYS, NARRATION_LABELS } from '@/lib/narrations';

interface Entry {
  id: string; title: string; category: string; content: string;
  author: string; slug: string; status: string; created_by: string;
  /** Which narration Gat Tayaw reads. Empty means work it out from the title. */
  audio_key: string | null;
  /** Recordings uploaded for this story, one per language. */
  audio_en: string | null;
  audio_fil: string | null;
  reject_remarks: string | null; created_at: string; media?: MediaItem[];
}

const CATEGORIES = ['heritage', 'culture', 'tradition', 'people', 'legend', 'other'];

const CONFIG: CmsTabConfig<Entry> = {
  slug: 'stories',
  title: 'Stories',
  subtitle: 'Local history, legends and the people behind them',
  entityLabel: 'Story',
  emptyIcon: <BookOpen className="w-10 h-10 mb-3 opacity-20" />,
  emptyText: 'No stories yet',
  empty: {
    title: '', category: 'heritage', content: '', author: '', slug: '',
    audio_key: '', audio_en: '', audio_fil: '', reject_remarks: null, media: [],
  },
  fields: [
    { name: 'title',    label: 'Title',    type: 'text', required: true },
    { name: 'category', label: 'Category', type: 'select', colSpan: 1,
      options: CATEGORIES.map(c => ({ value: c, label: c })) },
    { name: 'author',   label: 'Author',   type: 'text', colSpan: 1 },
    { name: 'content',  label: 'Content',  type: 'richtext', placeholder: 'Write the story…' },
    /* Blank is a real answer and the default: the page falls back to reading
       the title, which is what every story published before this existed
       relies on. It is only worth setting when that guess would be wrong. */
    { name: 'audio_key', label: 'Gat Tayaw narration', type: 'select', colSpan: 1,
      options: [
        { value: '', label: 'Choose automatically' },
        ...NARRATION_KEYS.map(k => ({ value: k, label: NARRATION_LABELS[k] })),
      ],
      hint: 'Only used when no recording is uploaded below.' },

    /* Uploaded recordings win over the built-in ones. Both optional and both
       independent: a story may have English recorded and Filipino not yet,
       and should play the new English and fall back for the other rather than
       wait for the pair. */
    { name: 'audio_en',  label: 'English narration',  type: 'audio', colSpan: 1,
      hint: 'MP3. Replaces the built-in English recording for this story.' },
    { name: 'audio_fil', label: 'Filipino narration', type: 'audio', colSpan: 1,
      hint: 'MP3. Replaces the built-in Filipino recording for this story.' },
    /* The story page has had a carousel for these all along; only this cap
       kept it to one. The first is the cover — it is what the listing and the
       slideshow show — and the rest appear in the carousel on the story. */
    { name: 'media',    label: 'Photos', type: 'media', maxFiles: 8,
      hint: 'The first photo is the cover. The rest appear in the story\u2019s gallery.' },
  ],
  columns: [
    { header: 'Title', primary: true, render: e => <p className="font-semibold text-gray-900">{e.title}</p> },
    { header: 'Category', render: e => <span className="text-gray-500 capitalize">{e.category}</span> },
    { header: 'Author', render: e => <span className="text-gray-500">{e.author || '—'}</span> },
    { header: 'Narration', render: e => {
      const own = [e.audio_en && 'EN', e.audio_fil && 'FIL'].filter(Boolean);
      if (own.length) return <span className="text-gray-500">Uploaded ({own.join(' + ')})</span>;
      return (
        <span className="text-gray-500">
          {e.audio_key ? NARRATION_LABELS[e.audio_key as keyof typeof NARRATION_LABELS] ?? e.audio_key : 'Automatic'}
        </span>
      );
    } },
    statusColumn<Entry>(),
  ],
};

interface Props { token: string | null; userEmail: string; isOfficer: boolean; isAdmin: boolean; }

export default function StoriesTab(props: Props) {
  return <CmsTab config={CONFIG} {...props} />;
}
