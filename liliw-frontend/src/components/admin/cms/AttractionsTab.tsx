'use client';

import { MapPin } from 'lucide-react';
import CmsTab, { CmsTabConfig, statusColumn } from './CmsTab';
import { MediaItem } from './MediaUploader';

interface Entry {
  id: string; name: string; category: string; description: string;
  location: string; map_lat: number | null; map_lng: number | null;
  features: string; sort_order: number; slug: string;
  status: string; created_by: string; reject_remarks: string | null;
  created_at: string; media?: MediaItem[];
}

const CATEGORIES = ['heritage', 'tourist_spot', 'dining', 'other'];

const CONFIG: CmsTabConfig<Entry> = {
  slug: 'attractions',
  title: 'Attractions',
  subtitle: 'Heritage sites, tourist spots, dining',
  entityLabel: 'Attraction',
  emptyIcon: <MapPin className="w-10 h-10 mb-3 opacity-20" />,
  emptyText: 'No entries yet',
  empty: {
    name: '', category: 'heritage', description: '', location: '',
    map_lat: null, map_lng: null, features: '', sort_order: 0, slug: '',
    reject_remarks: null, media: [],
  },
  fields: [
    { name: 'name',        label: 'Name',      type: 'text', required: true },
    { name: 'category',    label: 'Category',  type: 'select', colSpan: 1,
      options: CATEGORIES.map(c => ({ value: c, label: c.replace('_', ' ') })) },
    { name: 'location',    label: 'Location',  type: 'text',   colSpan: 1 },
    { name: 'map_lat',     label: 'Latitude',  type: 'number', colSpan: 1 },
    { name: 'map_lng',     label: 'Longitude', type: 'number', colSpan: 1 },
    { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
    { name: 'features',    label: 'Features',  type: 'richtext', placeholder: 'List features, highlights, or key points…' },
    { name: 'media',       label: 'Photos',    type: 'media' },
  ],
  columns: [
    { header: 'Name', primary: true, render: e => <p className="font-semibold text-gray-900">{e.name}</p> },
    { header: 'Category', render: e => <span className="text-gray-500 capitalize">{e.category?.replace('_', ' ')}</span> },
    statusColumn<Entry>(),
    { header: 'Created', render: e => (
      <span className="text-gray-400 text-xs">
        {new Date(e.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
    ) },
  ],
};

interface Props { token: string | null; userEmail: string; isOfficer: boolean; isAdmin: boolean; }

export default function AttractionsTab(props: Props) {
  return <CmsTab config={CONFIG} {...props} />;
}
