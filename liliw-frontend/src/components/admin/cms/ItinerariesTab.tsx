'use client';

import { Route } from 'lucide-react';
import CmsTab, { CmsTabConfig, statusColumn } from './CmsTab';

interface Entry {
  id: string; title: string; description: string; duration_days: number;
  category: string; highlights: string; slug: string;
  status: string; created_by: string; reject_remarks: string | null; created_at: string;
}

const CONFIG: CmsTabConfig<Entry> = {
  slug: 'itineraries',
  title: 'Itineraries',
  subtitle: 'Suggested routes and day plans for visitors',
  entityLabel: 'Itinerary',
  emptyIcon: <Route className="w-10 h-10 mb-3 opacity-20" />,
  emptyText: 'No itineraries yet',
  empty: {
    title: '', description: '', duration_days: 1, category: '',
    highlights: '', slug: '', reject_remarks: null,
  },
  fields: [
    { name: 'title',         label: 'Title',           type: 'text', required: true },
    { name: 'category',      label: 'Category',        type: 'text', colSpan: 1, placeholder: 'e.g. Heritage walk' },
    { name: 'duration_days', label: 'Duration (days)', type: 'number', colSpan: 1 },
    { name: 'description',   label: 'Description',     type: 'textarea', rows: 3 },
    { name: 'highlights',    label: 'Highlights',      type: 'richtext',
      placeholder: 'What this route takes in — one per line…' },
  ],
  columns: [
    { header: 'Title', primary: true, render: e => <p className="font-semibold text-gray-900">{e.title}</p> },
    { header: 'Category', render: e => <span className="text-gray-500">{e.category || '—'}</span> },
    { header: 'Days', render: e => <span className="text-gray-400 text-xs">{e.duration_days ?? '—'}</span> },
    statusColumn<Entry>(),
  ],
};

interface Props { token: string | null; userEmail: string; isOfficer: boolean; isAdmin: boolean; }

export default function ItinerariesTab(props: Props) {
  return <CmsTab config={CONFIG} {...props} />;
}
