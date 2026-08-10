'use client';

import { Newspaper } from 'lucide-react';
import CmsTab, { CmsTabConfig, statusColumn } from './CmsTab';
import { MediaItem } from './MediaUploader';

interface Entry {
  id: string; title: string; category: string; content: string;
  video_url: string; slug: string; status: string; created_by: string;
  reject_remarks: string | null; created_at: string; media?: MediaItem[];
}

const CATEGORIES = ['announcement', 'event', 'tourism', 'culture', 'local-news', 'other'];

const CONFIG: CmsTabConfig<Entry> = {
  slug: 'news',
  title: 'News',
  subtitle: 'Announcements and articles for the News & Events page',
  entityLabel: 'Article',
  emptyIcon: <Newspaper className="w-10 h-10 mb-3 opacity-20" />,
  emptyText: 'No articles yet',
  empty: {
    title: '', category: 'announcement', content: '', video_url: '', slug: '', reject_remarks: null, media: [],
  },
  fields: [
    { name: 'title',    label: 'Title',    type: 'text', required: true },
    { name: 'category', label: 'Category', type: 'select',
      options: CATEGORIES.map(c => ({ value: c, label: c.replace('-', ' ') })) },
    { name: 'content',  label: 'Content',  type: 'richtext', placeholder: 'Write the news article…' },
    { name: 'video_url', label: 'Facebook Video Link', type: 'text',
      placeholder: 'https://www.facebook.com/LiliwCHATO/videos/… — plays inside the article' },
    // Facebook serves no thumbnail for a reel or video to anyone without an
    // app token — the page, the Graph API and oEmbed all answer 400 — so the
    // first photo here is the only cover a video post can have.
    { name: 'media',    label: 'Photos',   type: 'media',
      hint: 'The first photo is the thumbnail on the homepage and news list. Add one for video posts too — Facebook does not provide a still.' },
  ],
  columns: [
    { header: 'Title', primary: true, render: e => <p className="font-semibold text-gray-900">{e.title}</p> },
    { header: 'Category', render: e => <span className="text-gray-500 capitalize">{e.category?.replace('-', ' ')}</span> },
    statusColumn<Entry>(),
    { header: 'Created', render: e => (
      <span className="text-gray-400 text-xs">
        {new Date(e.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
    ) },
  ],
};

interface Props { token: string | null; userEmail: string; isOfficer: boolean; isAdmin: boolean; }

export default function NewsTab(props: Props) {
  return <CmsTab config={CONFIG} {...props} />;
}
