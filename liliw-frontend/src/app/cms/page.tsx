'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, MapPin, Calendar, Newspaper, Palette, Users,
  BookOpen, ImageIcon, HelpCircle, Route, ClipboardCheck, Edit3,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AttractionsTab    from '@/components/admin/cms/AttractionsTab';
import EventsTab         from '@/components/admin/cms/EventsTab';
import NewsTab           from '@/components/admin/cms/NewsTab';
import ArtFormsTab       from '@/components/admin/cms/ArtFormsTab';
import ArtisansTab       from '@/components/admin/cms/ArtisansTab';
import StoriesTab        from '@/components/admin/cms/StoriesTab';
import HeroSlidesTab     from '@/components/admin/cms/HeroSlidesTab';
import FaqsTab           from '@/components/admin/cms/FaqsTab';
import ItinerariesTab    from '@/components/admin/cms/ItinerariesTab';
import ContentApprovalsTab from '@/components/admin/cms/ContentApprovalsTab';

type CMSTab =
  | 'approvals' | 'attractions' | 'events' | 'news'
  | 'art-forms' | 'artisans' | 'stories'
  | 'hero-slides' | 'faqs' | 'itineraries';

interface NavItem {
  key: CMSTab;
  label: string;
  icon: React.ReactNode;
  roles: string[];
  color: string;
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Approvals',
    items: [
      { key: 'approvals',   label: 'Content Approvals', icon: <ClipboardCheck className="w-4 h-4" />, roles: ['officer', 'admin'], color: '#EF4444' },
    ],
  },
  {
    section: 'Content',
    items: [
      { key: 'attractions', label: 'Attractions',  icon: <MapPin      className="w-4 h-4" />, roles: ['editor', 'officer', 'admin'], color: '#F59E0B' },
      { key: 'events',      label: 'Events',       icon: <Calendar    className="w-4 h-4" />, roles: ['editor', 'officer', 'admin'], color: '#3B82F6' },
      { key: 'news',        label: 'News',         icon: <Newspaper   className="w-4 h-4" />, roles: ['editor', 'officer', 'admin'], color: '#8B5CF6' },
      { key: 'art-forms',   label: 'Art Forms',    icon: <Palette     className="w-4 h-4" />, roles: ['editor', 'officer', 'admin'], color: '#EC4899' },
      { key: 'artisans',    label: 'Artisans',     icon: <Users       className="w-4 h-4" />, roles: ['editor', 'officer', 'admin'], color: '#10B981' },
      { key: 'stories',     label: 'Stories',      icon: <BookOpen    className="w-4 h-4" />, roles: ['editor', 'officer', 'admin'], color: '#F97316' },
    ],
  },
  {
    section: 'Site',
    items: [
      { key: 'hero-slides', label: 'Hero Slides',  icon: <ImageIcon   className="w-4 h-4" />, roles: ['editor', 'officer', 'admin'], color: '#06B6D4' },
      { key: 'faqs',        label: 'FAQs',         icon: <HelpCircle  className="w-4 h-4" />, roles: ['editor', 'officer', 'admin'], color: '#6366F1' },
      { key: 'itineraries', label: 'Itineraries',  icon: <Route       className="w-4 h-4" />, roles: ['editor', 'officer', 'admin'], color: '#84CC16' },
    ],
  },
];

export default function CMSPage() {
  const { user, loading, isAdmin, isChatoOfficer, isChatoEditor, isStaff, token } = useAuth();
  const router = useRouter();

  const myRole = isAdmin ? 'admin' : isChatoOfficer ? 'officer' : 'editor';

  const allItems = NAV.flatMap(s => s.items).filter(i => i.roles.includes(myRole));
  const [activeTab, setActiveTab] = useState<CMSTab | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!loading && (!user || !isStaff)) router.replace('/');
  }, [user, loading, isStaff, router]);

  useEffect(() => {
    if (!loading && isStaff && activeTab === null) {
      setActiveTab(allItems[0]?.key ?? 'attractions');
    }
  }, [loading, isStaff]);

  useEffect(() => {
    if (!token || !(isChatoOfficer || isAdmin)) return;
    fetch('/api/cms/pending', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setPendingCount(d.total || 0))
      .catch(() => {});
  }, [token, isChatoOfficer, isAdmin]);

  if (loading || !user || !isStaff) return null;

  const currentItem = NAV.flatMap(s => s.items).find(i => i.key === activeTab);

  return (
    <div style={{ background: '#f0f4f8' }}>
      {/* Top bar */}
      <div style={{ background: 'linear-gradient(135deg,#0F1F3C 0%,#1a3a5c 100%)' }} className="py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-semibold opacity-70 hover:opacity-100 transition" style={{ color: '#00BFB3' }}>
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,191,179,0.15)', border: '1px solid rgba(0,191,179,0.3)' }}>
              <Edit3 className="w-4 h-4" style={{ color: '#00BFB3' }} />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Content Management</p>
              <p className="text-gray-400 text-[11px]">Liliw Tourism CMS</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold border" style={{ color: '#00BFB3', borderColor: 'rgba(0,191,179,0.4)', background: 'rgba(0,191,179,0.1)' }}>
            {isAdmin ? 'Admin' : isChatoOfficer ? 'Officer' : 'Editor'}
          </span>
          <span className="text-gray-400 text-sm hidden sm:inline">{user.username}</span>
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 py-5 px-3 border-r border-gray-200 bg-white">
          {NAV.map(({ section, items }) => {
            const visible = items.filter(i => i.roles.includes(myRole));
            if (visible.length === 0) return null;
            return (
              <div key={section} className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2 mb-1.5">{section}</p>
                <nav className="space-y-0.5">
                  {visible.map(item => {
                    const isActive = activeTab === item.key;
                    const badge = item.key === 'approvals' ? pendingCount : 0;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setActiveTab(item.key)}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                          isActive
                            ? 'text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        style={isActive ? { backgroundColor: item.color } : undefined}
                      >
                        <span className="flex items-center gap-2.5">
                          <span style={{ color: isActive ? 'white' : item.color }}>{item.icon}</span>
                          {item.label}
                        </span>
                        {badge > 0 && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                            isActive ? 'bg-white/25 text-white' : 'bg-red-100 text-red-600'
                          }`}>
                            {badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 min-w-0">
          {activeTab === 'approvals' && (
            <ContentApprovalsTab token={token} />
          )}
          {activeTab === 'attractions' && (
            <AttractionsTab token={token} userEmail={user.email} isOfficer={isChatoOfficer} isAdmin={isAdmin} />
          )}
          {activeTab === 'events' && (
            <EventsTab token={token} userEmail={user.email} isOfficer={isChatoOfficer} isAdmin={isAdmin} />
          )}
          {activeTab === 'news' && (
            <NewsTab token={token} userEmail={user.email} isOfficer={isChatoOfficer} isAdmin={isAdmin} />
          )}
          {activeTab === 'art-forms' && (
            <ArtFormsTab token={token} userEmail={user.email} isOfficer={isChatoOfficer} isAdmin={isAdmin} />
          )}
          {activeTab === 'artisans' && (
            <ArtisansTab token={token} userEmail={user.email} isOfficer={isChatoOfficer} isAdmin={isAdmin} />
          )}
          {activeTab === 'stories' && (
            <StoriesTab token={token} userEmail={user.email} isOfficer={isChatoOfficer} isAdmin={isAdmin} />
          )}
          {activeTab === 'hero-slides' && (
            <HeroSlidesTab token={token} userEmail={user.email} isOfficer={isChatoOfficer} isAdmin={isAdmin} />
          )}
          {activeTab === 'faqs' && (
            <FaqsTab token={token} userEmail={user.email} isOfficer={isChatoOfficer} isAdmin={isAdmin} />
          )}
          {activeTab === 'itineraries' && (
            <ItinerariesTab token={token} userEmail={user.email} isOfficer={isChatoOfficer} isAdmin={isAdmin} />
          )}
        </main>
      </div>
    </div>
  );
}
