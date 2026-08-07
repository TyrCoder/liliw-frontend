'use client';

import { Palette } from 'lucide-react';
import CmsTab, { CmsTabConfig, statusColumn } from './CmsTab';
import { MediaItem } from './MediaUploader';

interface Entry {
  id: string; name: string; icon: string; description: string;
  features: string; sort_order: number; slug: string; status: string;
  created_by: string; reject_remarks: string | null; created_at: string; media?: MediaItem[];
}

const CONFIG: CmsTabConfig<Entry> = {
  slug: 'art-forms',
  title: 'Art Forms',
  subtitle: 'Crafts and creative traditions of Liliw',
  entityLabel: 'Art Form',
  emptyIcon: <Palette className="w-10 h-10 mb-3 opacity-20" />,
  emptyText: 'No art forms yet',
  empty: {
    name: '', icon: '', description: '', features: '', sort_order: 0, slug: '', reject_remarks: null, media: [],
  },
  fields: [
    { name: 'name',        label: 'Name',        type: 'text', required: true },
    { name: 'icon',        label: 'Icon (emoji)', type: 'text', colSpan: 1, placeholder: 'e.g. 🩴' },
    { name: 'sort_order',  label: 'Sort Order',  type: 'number', colSpan: 1 },
    { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
    { name: 'features',    label: 'Features',    type: 'richtext', placeholder: 'List features and techniques…' },
    { name: 'media',       label: 'Photos',      type: 'media' },
  ],
  columns: [
    { header: 'Name', primary: true, render: e => <p className="font-semibold text-gray-900">{e.name}</p> },
    { header: 'Icon', render: e => <span className="text-lg">{e.icon || '—'}</span> },
    statusColumn<Entry>(),
    { header: 'Order', render: e => <span className="text-gray-400 text-xs">{e.sort_order ?? 0}</span> },
  ],
};

interface Props { token: string | null; userEmail: string; isOfficer: boolean; isAdmin: boolean; }

export default function ArtFormsTab(props: Props) {
  return <CmsTab config={CONFIG} {...props} />;
}
