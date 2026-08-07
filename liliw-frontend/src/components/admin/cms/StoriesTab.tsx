'use client';

import { BookOpen } from 'lucide-react';
import CmsTab, { CmsTabConfig, statusColumn } from './CmsTab';
import { MediaItem } from './MediaUploader';

interface Entry {
  id: string; title: string; category: string; content: string;
  author: string; slug: string; status: string; created_by: string;
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
    title: '', category: 'heritage', content: '', author: '', slug: '', reject_remarks: null, media: [],
  },
  fields: [
    { name: 'title',    label: 'Title',    type: 'text', required: true },
    { name: 'category', label: 'Category', type: 'select', colSpan: 1,
      options: CATEGORIES.map(c => ({ value: c, label: c })) },
    { name: 'author',   label: 'Author',   type: 'text', colSpan: 1 },
    { name: 'content',  label: 'Content',  type: 'richtext', placeholder: 'Write the story…' },
    { name: 'media',    label: 'Cover Photo', type: 'media', maxFiles: 1 },
  ],
  columns: [
    { header: 'Title', primary: true, render: e => <p className="font-semibold text-gray-900">{e.title}</p> },
    { header: 'Category', render: e => <span className="text-gray-500 capitalize">{e.category}</span> },
    { header: 'Author', render: e => <span className="text-gray-500">{e.author || '—'}</span> },
    statusColumn<Entry>(),
  ],
};

interface Props { token: string | null; userEmail: string; isOfficer: boolean; isAdmin: boolean; }

export default function StoriesTab(props: Props) {
  return <CmsTab config={CONFIG} {...props} />;
}
