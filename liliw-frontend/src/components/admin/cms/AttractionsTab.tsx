'use client';

import { MapPin } from 'lucide-react';
import CmsTab, { CmsTabConfig, statusColumn } from './CmsTab';
import { MediaItem } from './MediaUploader';

interface Entry {
  id: string; name: string; category: string; description: string;
  location: string; map_lat: number | null; map_lng: number | null;
  features: string; sort_order: number; slug: string;
  opening_hours: string; best_time: string; entrance_fee: string; price_level: string;
  visitor_tips: string;
  phone: string; website: string; best_for: string;
  status: string; created_by: string; reject_remarks: string | null;
  created_at: string; media?: MediaItem[];
}

const CATEGORIES = ['heritage', 'tourist_spot', 'dining', 'other'];

// Drives the ₱ meter on the attraction page. Blank is allowed so an editor
// who doesn't know the cost isn't forced to guess one.
const PRICE_LEVELS = [
  { value: '',         label: '— not set —' },
  { value: 'free',     label: 'Free' },
  { value: 'budget',   label: '₱ Budget (under ₱200)' },
  { value: 'moderate', label: '₱₱ Moderate (₱200 – ₱500)' },
  { value: 'premium',  label: '₱₱₱ Premium (₱500+)' },
];

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
    opening_hours: '', best_time: '', entrance_fee: '', price_level: '', visitor_tips: '',
    phone: '', website: '', best_for: '',
    reject_remarks: null, media: [],
  },
  fields: [
    { name: 'name',        label: 'Name',      type: 'text', required: true },
    { name: 'category',    label: 'Category',  type: 'select', colSpan: 1,
      options: CATEGORIES.map(c => ({ value: c, label: c.replace('_', ' ') })) },
    { name: 'location',    label: 'Location',  type: 'text',   colSpan: 1 },
    { name: 'map_lat',     label: 'Latitude',  type: 'number', colSpan: 1 },
    { name: 'map_lng',     label: 'Longitude', type: 'number', colSpan: 1 },
    // Visitor info — these drive the Hours card and the ₱ cost meter on the
    // public attraction page, which had no way to be filled in before.
    { name: 'opening_hours', label: 'Opening Hours', type: 'text', colSpan: 1,
      placeholder: 'e.g. 8:00 AM – 6:00 PM daily' },
    { name: 'best_time',     label: 'Best Time to Visit', type: 'text', colSpan: 1,
      placeholder: 'e.g. Early morning or late afternoon' },
    { name: 'entrance_fee',  label: 'Entrance Fee',  type: 'text', colSpan: 1,
      placeholder: 'e.g. ₱100 adults · ₱50 children, or Free' },
    { name: 'price_level',   label: 'Cost Level',    type: 'select', colSpan: 1,
      options: PRICE_LEVELS },
    { name: 'best_for',      label: 'Best For',      type: 'text', colSpan: 1,
      placeholder: 'e.g. Families, photographers' },
    { name: 'phone',         label: 'Phone',         type: 'text', colSpan: 1 },
    { name: 'website',       label: 'Website',       type: 'text', colSpan: 1,
      placeholder: 'https://…' },
    { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
    { name: 'visitor_tips', label: 'Tips for Visitors', type: 'richtext',
      placeholder: 'One tip per line — what to bring, what to watch out for…' },
    { name: 'features',    label: 'Highlights / Other Info',  type: 'richtext',
      placeholder: 'Anything else worth knowing about this place…' },
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
