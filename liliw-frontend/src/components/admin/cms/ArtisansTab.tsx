'use client';

import { Users } from 'lucide-react';
import CmsTab, { CmsTabConfig, statusColumn } from './CmsTab';
import { MediaItem } from './MediaUploader';

interface Entry {
  id: string; name: string; craft_type: string; description: string;
  location: string; contact_number: string; rating: number;
  social_media: Record<string, string>; slug: string; status: string;
  created_by: string; reject_remarks: string | null; created_at: string; media?: MediaItem[];
}

const CONFIG: CmsTabConfig<Entry> = {
  slug: 'artisans',
  title: 'Artisans',
  subtitle: 'The makers behind Liliw’s crafts',
  entityLabel: 'Artisan',
  emptyIcon: <Users className="w-10 h-10 mb-3 opacity-20" />,
  emptyText: 'No artisans yet',
  empty: {
    name: '', craft_type: '', description: '', location: '', contact_number: '',
    rating: 0, social_media: {}, slug: '', reject_remarks: null, media: [],
  },
  fields: [
    { name: 'name',           label: 'Name',           type: 'text', required: true },
    { name: 'craft_type',     label: 'Craft Type',     type: 'text', colSpan: 1, placeholder: 'e.g. Tsinelas making' },
    { name: 'location',       label: 'Location',       type: 'text', colSpan: 1 },
    { name: 'contact_number', label: 'Contact Number', type: 'text', colSpan: 1 },
    { name: 'rating',         label: 'Rating (0–5)',   type: 'number', colSpan: 1 },
    { name: 'description',    label: 'Description',    type: 'textarea', rows: 4 },
    // Dotted name: edits one key of the social_media JSON column and leaves
    // any other links in it untouched.
    { name: 'social_media.facebook', label: 'Facebook URL', type: 'text', placeholder: 'https://facebook.com/…' },
    { name: 'media',          label: 'Photos',         type: 'media' },
  ],
  columns: [
    { header: 'Name', primary: true, render: e => <p className="font-semibold text-gray-900">{e.name}</p> },
    { header: 'Craft', render: e => <span className="text-gray-500">{e.craft_type || '—'}</span> },
    { header: 'Location', render: e => <span className="text-gray-500">{e.location || '—'}</span> },
    statusColumn<Entry>(),
  ],
};

interface Props { token: string | null; userEmail: string; isOfficer: boolean; isAdmin: boolean; }

export default function ArtisansTab(props: Props) {
  return <CmsTab config={CONFIG} {...props} />;
}
