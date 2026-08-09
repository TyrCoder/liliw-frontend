'use client';

import { HeartHandshake } from 'lucide-react';
import CmsTab, { CmsTabConfig, statusColumn } from './CmsTab';
import { MediaItem } from './MediaUploader';

interface Entry {
  id: string; title: string; category: string; description: string;
  venue: string; date_start: string | null; date_end: string | null;
  organizer: string; contact_email: string; slots: number | null;
  how_to_join: string; is_open: boolean;
  slug: string; status: string; created_by: string;
  reject_remarks: string | null; created_at: string;
  media?: MediaItem[];
}

const CATEGORIES = ['volunteer', 'cleanup', 'workshop', 'outreach', 'festival-prep', 'other'];

const CONFIG: CmsTabConfig<Entry> = {
  slug: 'community-events',
  title: 'Community Events',
  subtitle: 'Activities residents and volunteers can take part in — shown on the Participate page',
  entityLabel: 'Community Event',
  emptyIcon: <HeartHandshake className="w-10 h-10 mb-3 opacity-20" />,
  emptyText: 'No community events yet',
  empty: {
    title: '', category: 'volunteer', description: '', venue: '',
    date_start: null, date_end: null, organizer: '', contact_email: '',
    slots: null, how_to_join: '', is_open: true,
    slug: '', reject_remarks: null, media: [],
  },
  fields: [
    { name: 'title',        label: 'Title', type: 'text', required: true },
    { name: 'category',     label: 'Category', type: 'select', colSpan: 1,
      options: CATEGORIES.map(c => ({ value: c, label: c.replace('-', ' ') })) },
    { name: 'venue',        label: 'Where', type: 'text', colSpan: 1 },
    { name: 'date_start',   label: 'Starts', type: 'datetime', colSpan: 1 },
    { name: 'date_end',     label: 'Ends',   type: 'datetime', colSpan: 1 },
    { name: 'organizer',    label: 'Organised by', type: 'text', colSpan: 1,
      placeholder: 'e.g. CHATO, Barangay Bayate' },
    { name: 'contact_email',label: 'Contact Email', type: 'text', colSpan: 1 },
    { name: 'slots',        label: 'Volunteers Needed', type: 'text', colSpan: 1,
      placeholder: 'Leave blank if there is no limit' },
    { name: 'is_open',      label: 'Still accepting volunteers', type: 'checkbox' },
    { name: 'description',  label: 'What it involves', type: 'textarea', rows: 4 },
    { name: 'how_to_join',  label: 'How to join', type: 'textarea', rows: 3,
      placeholder: 'What someone should do or bring. Shown under the listing.' },
    { name: 'media',        label: 'Cover Photo', type: 'media', maxFiles: 1 },
  ],
  columns: [
    { header: 'Title', primary: true, render: e => <p className="font-semibold text-gray-900">{e.title}</p> },
    { header: 'Category', render: e => <span className="text-gray-500 capitalize">{(e.category || '').replace('-', ' ')}</span> },
    { header: 'When', render: e => (
      <span className="text-gray-400 text-xs">
        {e.date_start
          ? new Date(e.date_start).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—'}
      </span>
    ) },
    { header: 'Open', render: e => (
      <span className={`text-xs font-semibold ${e.is_open ? 'text-green-600' : 'text-gray-400'}`}>
        {e.is_open ? 'Yes' : 'Closed'}
      </span>
    ) },
    statusColumn<Entry>(),
  ],
};

interface Props { token: string | null; userEmail: string; isOfficer: boolean; isAdmin: boolean; }

export default function CommunityEventsTab(props: Props) {
  return <CmsTab config={CONFIG} {...props} />;
}
