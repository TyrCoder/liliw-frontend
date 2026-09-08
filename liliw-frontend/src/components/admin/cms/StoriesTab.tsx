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
    audio_key: '', reject_remarks: null, media: [],
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
      ] },
    { name: 'media',    label: 'Cover Photo', type: 'media', maxFiles: 1 },
  ],
  columns: [
    { header: 'Title', primary: true, render: e => <p className="font-semibold text-gray-900">{e.title}</p> },
    { header: 'Category', render: e => <span className="text-gray-500 capitalize">{e.category}</span> },
    { header: 'Author', render: e => <span className="text-gray-500">{e.author || '—'}</span> },
    { header: 'Narration', render: e => (
      <span className="text-gray-500">
        {e.audio_key ? NARRATION_LABELS[e.audio_key as keyof typeof NARRATION_LABELS] ?? e.audio_key : 'Automatic'}
      </span>
    ) },
    statusColumn<Entry>(),
  ],
};

interface Props { token: string | null; userEmail: string; isOfficer: boolean; isAdmin: boolean; }

export default function StoriesTab(props: Props) {
  return <CmsTab config={CONFIG} {...props} />;
}
