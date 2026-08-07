'use client';

import { Images } from 'lucide-react';
import CmsTab, { CmsTabConfig, statusColumn } from './CmsTab';
import { MediaItem } from './MediaUploader';

interface Entry {
  id: string; title: string; subtitle: string; button_text: string;
  button_link: string; sort_order: number; slug: string;
  status: string; created_by: string; reject_remarks: string | null;
  created_at: string; media?: MediaItem[];
}

const CONFIG: CmsTabConfig<Entry> = {
  slug: 'hero-slides',
  title: 'Hero Slides',
  subtitle: 'The rotating banner at the top of the home page',
  entityLabel: 'Slide',
  emptyIcon: <Images className="w-10 h-10 mb-3 opacity-20" />,
  emptyText: 'No slides yet',
  empty: {
    title: '', subtitle: '', button_text: '', button_link: '',
    sort_order: 0, slug: '', reject_remarks: null, media: [],
  },
  fields: [
    { name: 'title',       label: 'Title',       type: 'text', required: true },
    { name: 'subtitle',    label: 'Subtitle',    type: 'text' },
    { name: 'button_text', label: 'Button Text', type: 'text', colSpan: 1, placeholder: 'e.g. Explore Liliw' },
    { name: 'button_link', label: 'Button Link', type: 'text', colSpan: 1, placeholder: '/attractions' },
    { name: 'sort_order',  label: 'Sort Order',  type: 'number', colSpan: 1 },
    { name: 'media',       label: 'Background Image', type: 'media', maxFiles: 1 },
  ],
  columns: [
    { header: 'Title', primary: true, render: e => <p className="font-semibold text-gray-900">{e.title}</p> },
    { header: 'Button', render: e => <span className="text-gray-500">{e.button_text || '—'}</span> },
    { header: 'Order', render: e => <span className="text-gray-400 text-xs">{e.sort_order ?? 0}</span> },
    statusColumn<Entry>(),
  ],
};

interface Props { token: string | null; userEmail: string; isOfficer: boolean; isAdmin: boolean; }

export default function HeroSlidesTab(props: Props) {
  return <CmsTab config={CONFIG} {...props} />;
}
