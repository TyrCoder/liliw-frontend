'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2, ChevronLeft, Loader2, CheckCircle, AlertCircle,
  Clock, FileText, ArrowRight, RefreshCw, Users, Plus, X,
  Edit, TrendingUp, MapPin, Star, Send, Layers, QrCode, LayoutDashboard, Pencil,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';
import QRPoster from '@/components/QRPoster';
import LboOverview from '@/components/admin/dashboard/LboOverview';
import { stripHtml } from '@/lib/text';
import SafeHtml from '@/components/SafeHtml';
import DesktopOnly from '@/components/DesktopOnly';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Marks a booking for a 360° shoot in the shared change-request queue. Kept as
// a constant because both the submit and the "already requested" lookup match
// on it — a typo in either would silently allow duplicate bookings.
const VT_FIELD = 'Virtual Tour (360°)';

const FIELDS_TO_CHANGE = [
  'Name / Listing Title',
  'Description',
  'Location / Address',
  'Contact Number',
  'Operating Hours',
  'Entrance Fee / Price',
  'Photos / Images',
  'Other',
];

type Tab = 'dashboard' | 'overview' | 'requests' | 'visitors' | 'ratings';

const CATEGORIES = ['heritage', 'spot', 'dining'] as const;
type AttrCategory = typeof CATEGORIES[number];
const CATEGORY_LABELS: Record<AttrCategory, string> = { heritage: 'Heritage Site', spot: 'Tourist Spot', dining: 'Dining & Food' };
const CATEGORY_ICONS: Record<AttrCategory, string> = { heritage: '🏛️', spot: '🌿', dining: '🍽️' };

const TYPE_COLORS: Record<string, string> = { heritage: '#F59E0B', spot: '#3B82F6', dining: '#EF4444' };
const TYPE_LABELS: Record<string, string>  = { heritage: 'Heritage Site', spot: 'Tourist Spot', dining: 'Dining & Food' };

const CR_STATUS_COLOR: Record<string, string> = {
  pending:     'bg-yellow-50 text-yellow-700',
  in_progress: 'bg-blue-50 text-blue-700',
  done:        'bg-green-50 text-green-700',
  rejected:    'bg-red-50 text-red-600',
};

const CR_STATUS_LABEL: Record<string, string> = {
  pending:     'Pending',
  in_progress: 'In Progress',
  done:        'Done',
  rejected:    'Rejected',
};

const AR_STATUS_COLOR: Record<string, string> = {
  pending:         'bg-yellow-50 text-yellow-700',
  editor_reviewed: 'bg-blue-50 text-blue-700',
  approved:        'bg-green-50 text-green-700',
  rejected:        'bg-red-50 text-red-600',
};

const AR_STATUS_LABEL: Record<string, string> = {
  pending:         'Pending Review',
  editor_reviewed: 'Under Review',
  approved:        'Approved',
  rejected:        'Rejected',
};

type AppInfo = {
  id: number;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  attraction_name: string;
  business_type: string;
  category?: string | null;
  strapi_attraction_id?: string | null;
  strapi_attraction_type?: string | null;
};

type AttractionData = {
  linked: boolean;
  type?: string;
  strapiId?: string;
  virtualTour?: { exists: boolean; scenes: number };
  attraction?: {
    id?: string | null;
    slug?: string | null;
    name: string;
    description?: string | null;
    features?: string | null;
    location?: string | null;
    category?: string | null;
    rating?: number | null;
    reviewCount?: number;
    latitude?: number | null;
    longitude?: number | null;
    published?: boolean;
    photos?: { url: string; alt?: string | null }[];
  };
  error?: string;
};

type VisitorRow = { label: string; male_key: string; female_key: string };

const VISITOR_ROWS: VisitorRow[] = [
  { label: 'Local (Liliw Residents)',    male_key: 'local_male',          female_key: 'local_female' },
  { label: 'Other City (Same Province)', male_key: 'other_city_male',     female_key: 'other_city_female' },
  { label: 'Other Province',             male_key: 'other_province_male', female_key: 'other_province_female' },
  { label: 'Foreign',                    male_key: 'foreign_male',        female_key: 'foreign_female' },
];

const BLANK_VISITORS = Object.fromEntries(
  VISITOR_ROWS.flatMap(r => [[r.male_key, ''], [r.female_key, '']])
) as Record<string, string>;

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Reads a list response instead of turning a failure into an empty panel.
 * See the note on the admin page's readList — an expired session returns 401
 * with a JSON body, so r.json() succeeds and `d.data || []` renders a table
 * that says there is nothing here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readList(res: Response): Promise<any> {
  if (!res.ok) {
    const where = (() => { try { return new URL(res.url).pathname; } catch { return 'a request'; } })();
    throw new Error(`${where} — ${res.status}`);
  }
  return res.json();
}

function LboDashboard() {
  const { user, token, loading: authLoading } = useAuth();

  // Which panel loads failed, so an empty dashboard can say why it is empty.
  const [loadFailures, setLoadFailures] = useState<string[]>([]);
  const noteFailure = (err: unknown) => {
    const text = err instanceof Error ? err.message : String(err);
    setLoadFailures(prev => (prev.includes(text) ? prev : [...prev, text]));
  };

  const [checking, setChecking] = useState(true);
  const [appInfo,  setAppInfo]  = useState<AppInfo | null>(null);
  const [notLbo,     setNotLbo]     = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [loadError,      setLoadError]      = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  /* ── Attraction Overview ── */
  const [attrData,    setAttrData]    = useState<AttractionData | null>(null);
  const [loadingAttr, setLoadingAttr] = useState(false);

  /* ── Attraction Requests ── */
  const [attrReqs,       setAttrReqs]       = useState<any[]>([]);
  const [loadingAttrReqs,setLoadingAttrReqs]= useState(false);
  const [showArForm,     setShowArForm]     = useState(false);
  const [arForm,         setArForm]         = useState({
    category: '' as AttrCategory | '',
    attraction_name: '', description: '', location: '',
    has_virtual_tour: false,
    // tourist spot
    opening_hours: '', entrance_fee: '', best_time_to_visit: '', difficulty_level: '',
    // heritage site
    place_type: '', distance_from_center: '',
    // dining
    cuisine_type: '', price_range: '', contact_number: '',
  });
  const [submittingAr,   setSubmittingAr]   = useState(false);
  const [arMsg,          setArMsg]          = useState<{ ok: boolean; text: string } | null>(null);

  /* ── Change Requests ── */
  const [requests,      setRequests]    = useState<any[]>([]);
  const [loadingReqs,   setLoadingReqs] = useState(true);
  const [showCrForm,    setShowCrForm]  = useState(false);
  const [crForm,        setCrForm]      = useState({ field_to_change: '', current_value: '', requested_value: '', reason: '' });

  /**
   * Ask for one field to be changed, from the field itself.
   *
   * Editing a listing goes through review — the adviser's decision — so this
   * is not an inline edit. It is the same change request, opened with the
   * field and its current value already filled in, because choosing "Location
   * / Address" from a dropdown and retyping what it already says is the part
   * owners were skipping.
   */
  const requestEdit = (field: string, currentValue: string) => {
    setCrForm({ field_to_change: field, current_value: currentValue, requested_value: '', reason: '' });
    setCrMsg(null);
    setActiveTab('requests');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [submittingCr,  setSubmittingCr]= useState(false);
  const [crMsg,         setCrMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  /* ── Virtual Tour request ──
     Owners cannot upload a 360° tour themselves — the panoramas and hotspots
     are placed by CHATO staff in the /immersive editor. So this is a booking
     request, filed through the same change-request queue staff already work. */
  const [showVtForm,   setShowVtForm]   = useState(false);
  const [vtForm,       setVtForm]       = useState({ areas: '', preferred_date: '', contact: '', notes: '' });
  const [submittingVt, setSubmittingVt] = useState(false);
  const [vtMsg,        setVtMsg]        = useState<{ ok: boolean; text: string } | null>(null);

  /* ── Ratings ── */
  const [ratings,        setRatings]        = useState<any[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);

  /* ── Visitor Records ── */
  const [records,      setRecords]     = useState<any[]>([]);
  const [loadingRecs,  setLoadingRecs] = useState(true);
  const now = new Date();
  const [vrMonth,      setVrMonth]     = useState(now.getMonth() + 1);
  const [vrYear,       setVrYear]      = useState(now.getFullYear());
  const [vrCounts,     setVrCounts]    = useState<Record<string, string>>(BLANK_VISITORS);
  const [submittingVr, setSubmittingVr]= useState(false);
  const [vrMsg,        setVrMsg]       = useState<{ ok: boolean; text: string } | null>(null);
  const [scanStats,    setScanStats]   = useState<{ linked: boolean; total: number; counts: Record<string, number>; unknownGender: number; unknownOrigin: number } | null>(null);

  /* ── Auth check ── */
  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) { setChecking(false); return; }

    /**
     * 401 and 403 mean different things here and used to be treated alike.
     *
     * /api/lbo/me answers 403 for "no approved application" and 401 for a
     * token the server would not accept — and every failure landed in the same
     * catch. So an approved owner whose token had expired was told their
     * account has no approved application and invited to apply again, which is
     * what "the business dashboard is malfunctioning" looks like from the
     * owner's side.
     *
     * A 401 is retried once through /api/auth/me, which reissues the signed
     * session cookie the API also accepts.
     */
    const check = async (): Promise<void> => {
      const h = { Authorization: `Bearer ${token}` };

      let res = await fetch('/api/lbo/me', { headers: h }).catch(() => null);

      if (res?.status === 401) {
        await fetch('/api/auth/me', { headers: h }).catch(() => {});
        res = await fetch('/api/lbo/me', { headers: h }).catch(() => null);
      }

      if (!res) { setLoadError('Could not reach the server. Check your connection and try again.'); return; }
      if (res.status === 401) { setSessionExpired(true); return; }

      const d = await res.json().catch(() => ({} as { isLbo?: boolean; application?: unknown }));

      if (res.ok && d.isLbo) setAppInfo(d.application as typeof appInfo);
      else if (res.status === 403) setNotLbo(true);
      else setLoadError('Could not load your business dashboard. Please try again.');
    };

    check().finally(() => setChecking(false));
  }, [authLoading, user, token]);

  useEffect(() => {
    if (!token) { setScanStats(null); return; }
    let cancelled = false;
    fetch(`/api/lbo/checkins?month=${vrMonth}&year=${vrYear}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled) setScanStats(d); })
      .catch(() => { if (!cancelled) setScanStats(null); });
    return () => { cancelled = true; };
  }, [token, vrMonth, vrYear]);

  /** Copies the scanned figures into the form, leaving it editable. */
  const fillFromScans = () => {
    if (!scanStats) return;
    setVrCounts(Object.fromEntries(
      Object.entries(scanStats.counts).map(([k, v]) => [k, String(v)]),
    ) as Record<string, string>);
    setVrMsg({ ok: true, text: 'Filled from QR check-ins. Add anyone who did not scan, then submit.' });
  };

  /* ── Fetch attraction data ── */
  useEffect(() => {
    if (!appInfo || !token) return;
    setLoadingAttr(true);
    fetch('/api/lbo/attraction', { headers: { Authorization: `Bearer ${token}` } })
      .then(readList)
      .then(d => setAttrData(d))
      .catch(() => setAttrData({ linked: false }))
      .finally(() => setLoadingAttr(false));
  }, [appInfo, token]);

  /* ── Fetch attraction requests (only if no linked attraction) ── */
  useEffect(() => {
    if (!appInfo || !token || appInfo.strapi_attraction_id) return;
    setLoadingAttrReqs(true);
    fetch('/api/lbo/attraction-request', { headers: { Authorization: `Bearer ${token}` } })
      .then(readList)
      .then(d => setAttrReqs(d.data || []))
      .catch(noteFailure)
      .finally(() => setLoadingAttrReqs(false));
  }, [appInfo, token]);

  /* ── Fetch change requests ── */
  useEffect(() => {
    if (!appInfo || !token) return;
    fetch('/api/lbo/change-requests', { headers: { Authorization: `Bearer ${token}` } })
      .then(readList)
      .then(d => setRequests(d.data || []))
      .catch(noteFailure)
      .finally(() => setLoadingReqs(false));
  }, [appInfo, token]);

  /* ── Fetch ratings ── */
  useEffect(() => {
    if (!attrData?.linked || !attrData.strapiId || !token) return;
    setLoadingRatings(true);
    fetch(`/api/content/reviews?itemId=${attrData.strapiId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(readList)
      .then(d => setRatings(d.data || []))
      .catch(noteFailure)
      .finally(() => setLoadingRatings(false));
  }, [attrData, token]);

  /* ── Fetch visitor records ── */
  useEffect(() => {
    if (!appInfo || !token) return;
    fetch('/api/lbo/visitor-records', { headers: { Authorization: `Bearer ${token}` } })
      .then(readList)
      .then(d => setRecords(d.data || []))
      .catch(noteFailure)
      .finally(() => setLoadingRecs(false));
  }, [appInfo, token]);

  /* ── Handlers ── */
  const handleSubmitAr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appInfo) return;
    setSubmittingAr(true);
    setArMsg(null);
    try {
      const res = await fetch('/api/lbo/attraction-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          attraction_name: arForm.attraction_name,
          category:        arForm.category || undefined,
          description: (() => {
            const extras: string[] = [];
            if (arForm.location)              extras.push(`Location: ${arForm.location}`);
            if (arForm.opening_hours)         extras.push(`Opening Hours: ${arForm.opening_hours}`);
            if (arForm.entrance_fee)          extras.push(`Entrance Fee: ${arForm.entrance_fee}`);
            if (arForm.best_time_to_visit)    extras.push(`Best Time to Visit: ${arForm.best_time_to_visit}`);
            if (arForm.difficulty_level)      extras.push(`Difficulty: ${arForm.difficulty_level}`);
            if (arForm.place_type)            extras.push(`Place Type: ${arForm.place_type}`);
            if (arForm.distance_from_center)  extras.push(`Distance from Center: ${arForm.distance_from_center}`);
            if (arForm.cuisine_type)          extras.push(`Cuisine: ${arForm.cuisine_type}`);
            if (arForm.price_range)           extras.push(`Price Range: ${arForm.price_range}`);
            if (arForm.contact_number)        extras.push(`Contact: ${arForm.contact_number}`);
            if (arForm.has_virtual_tour)      extras.push(`Has Virtual Tour: Yes`);
            const base = arForm.description.trim();
            return base && extras.length ? `${base}\n\n--- Details ---\n${extras.join('\n')}`
                 : extras.length ? extras.join('\n')
                 : base || undefined;
          })(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setArMsg({ ok: true, text: 'Request submitted! Our team will review it shortly.' });
        setArForm({ category: '', attraction_name: '', description: '', location: '', has_virtual_tour: false, opening_hours: '', entrance_fee: '', best_time_to_visit: '', difficulty_level: '', place_type: '', distance_from_center: '', cuisine_type: '', price_range: '', contact_number: '' });
        setShowArForm(false);
        fetch('/api/lbo/attraction-request', { headers: { Authorization: `Bearer ${token}` } })
          .then(readList).then(d => setAttrReqs(d.data || []));
      } else {
        setArMsg({ ok: false, text: data.error || 'Submission failed' });
      }
    } catch {
      setArMsg({ ok: false, text: 'Network error' });
    }
    setSubmittingAr(false);
    setTimeout(() => setArMsg(null), 5000);
  };

  const handleSubmitCr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appInfo) return;
    setSubmittingCr(true);
    setCrMsg(null);
    try {
      const res = await fetch('/api/lbo/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          attraction_name: appInfo.attraction_name || appInfo.business_name,
          field_to_change: crForm.field_to_change,
          current_value:   crForm.current_value,
          requested_value: crForm.requested_value,
          reason:          crForm.reason,
          lbo_name:        appInfo.owner_name,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCrMsg({ ok: true, text: 'Request submitted successfully!' });
        setCrForm({ field_to_change: '', current_value: '', requested_value: '', reason: '' });
        setShowCrForm(false);
        fetch('/api/lbo/change-requests', { headers: { Authorization: `Bearer ${token}` } })
          .then(readList).then(d => setRequests(d.data || []));
      } else {
        setCrMsg({ ok: false, text: data.error || 'Submission failed' });
      }
    } catch {
      setCrMsg({ ok: false, text: 'Network error' });
    }
    setSubmittingCr(false);
    setTimeout(() => setCrMsg(null), 4000);
  };

  const hasTour     = !!attrData?.virtualTour?.exists;
  const tourScenes  = attrData?.virtualTour?.scenes ?? 0;
  // One open booking at a time — staff schedule a shoot per request, and a
  // second identical row in the queue only creates confusion about which is live.
  const pendingTour = requests.find(
    (r: any) => r.field_to_change === VT_FIELD && (r.status === 'pending' || r.status === 'in_progress'),
  );

  const handleSubmitVt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appInfo) return;
    setSubmittingVt(true);
    setVtMsg(null);

    // Folded into requested_value because the queue is a single free-text
    // field — staff read the whole booking in one place without a new table.
    const summary = [
      `Areas to capture: ${vtForm.areas.trim()}`,
      vtForm.preferred_date.trim() ? `Preferred shoot date: ${vtForm.preferred_date.trim()}` : null,
      vtForm.contact.trim()        ? `On-site contact: ${vtForm.contact.trim()}`             : null,
      vtForm.notes.trim()          ? `Notes: ${vtForm.notes.trim()}`                          : null,
    ].filter(Boolean).join('\n');

    try {
      const res = await fetch('/api/lbo/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          attraction_name: appInfo.attraction_name || appInfo.business_name,
          field_to_change: VT_FIELD,
          current_value:   hasTour ? `Existing tour with ${tourScenes} scene${tourScenes === 1 ? '' : 's'}` : 'No virtual tour yet',
          requested_value: summary,
          reason:          hasTour ? 'Requesting an update to the existing 360° tour' : 'Requesting a new 360° virtual tour',
          lbo_name:        appInfo.owner_name,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setVtMsg({ ok: true, text: 'Request sent. CHATO will contact you to schedule the shoot.' });
        setVtForm({ areas: '', preferred_date: '', contact: '', notes: '' });
        setShowVtForm(false);
        fetch('/api/lbo/change-requests', { headers: { Authorization: `Bearer ${token}` } })
          .then(readList).then(d => setRequests(d.data || []));
      } else {
        setVtMsg({ ok: false, text: data.error || 'Submission failed' });
      }
    } catch {
      setVtMsg({ ok: false, text: 'Network error' });
    }
    setSubmittingVt(false);
    setTimeout(() => setVtMsg(null), 6000);
  };

  const handleSubmitVr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appInfo) return;
    setSubmittingVr(true);
    setVrMsg(null);
    try {
      const res = await fetch('/api/lbo/visitor-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          attraction_name: appInfo.attraction_name || appInfo.business_name,
          month: vrMonth,
          year:  vrYear,
          ...Object.fromEntries(Object.entries(vrCounts).map(([k, v]) => [k, v === '' ? 0 : Number(v)])),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setVrMsg({ ok: true, text: `Visitor record for ${MONTHS[vrMonth - 1]} ${vrYear} submitted!` });
        setVrCounts({ ...BLANK_VISITORS });
        fetch('/api/lbo/visitor-records', { headers: { Authorization: `Bearer ${token}` } })
          .then(readList).then(d => setRecords(d.data || []));
      } else {
        setVrMsg({ ok: false, text: data.error || 'Submission failed' });
      }
    } catch {
      setVrMsg({ ok: false, text: 'Network error' });
    }
    setSubmittingVr(false);
    setTimeout(() => setVrMsg(null), 4000);
  };

  /* ── Loading / access states ── */
  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--warm-white)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1565C0' }} />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--warm-white)' }}>
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-blue-50">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">LBO Dashboard</h1>
            <p className="text-gray-500 mb-6">Please log in with your Local Business Owner account to access your dashboard.</p>
            <button onClick={() => setShowAuthModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition hover:opacity-90"
              style={{ backgroundColor: '#1565C0' }}>
              Log In <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        {showAuthModal && <AuthModal defaultTab="login" onClose={() => setShowAuthModal(false)} />}
      </>
    );
  }

  if (sessionExpired || loadError) {
    const expired = sessionExpired;
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--warm-white)' }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-blue-50">
            <AlertCircle className="w-8 h-8" style={{ color: '#1565C0' }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {expired ? 'Your session has expired' : 'Something went wrong'}
          </h1>
          <p className="text-gray-500 mb-6">
            {expired
              ? 'Sign in again to get back to your business dashboard. Nothing has changed on your account.'
              : loadError}
          </p>
          <button onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition hover:opacity-90"
            style={{ backgroundColor: '#1565C0' }}>
            Reload <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (notLbo) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--warm-white)' }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-amber-50">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Not Granted</h1>
          <p className="text-gray-500 mb-2">Your account ({user.email}) does not have an approved Local Business Owner application.</p>
          <p className="text-sm text-gray-400 mb-6">If you haven't applied yet, submit an application and wait for CHATO approval.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/business/apply"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition hover:opacity-90"
              style={{ backgroundColor: '#1565C0' }}>
              Apply Now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
              <ChevronLeft className="w-4 h-4" /> Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Dashboard ── */
  const totalVisitors = (r: any) => {
    const a = r.attributes || r;
    return (a.local_male||0)+(a.local_female||0)+(a.other_city_male||0)+(a.other_city_female||0)+(a.other_province_male||0)+(a.other_province_female||0)+(a.foreign_male||0)+(a.foreign_female||0);
  };

  const vrTotal = (male_key: string, female_key: string) => {
    const m = Number(vrCounts[male_key]) || 0;
    const f = Number(vrCounts[female_key]) || 0;
    return m + f;
  };

  const vrGrandTotal = VISITOR_ROWS.reduce((sum, r) => sum + vrTotal(r.male_key, r.female_key), 0);

  const pendingCrCount = requests.filter(r => (r.attributes?.status || r.status) === 'pending').length;
  const isLinked = appInfo?.strapi_attraction_id;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Utility bar — matches /admin and /cms. The business name and
          linked attraction moved into the dashboard below, which had been
          repeating both a few hundred pixels further down. */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200/80">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-700 transition shrink-0">
              <ChevronLeft className="w-3.5 h-3.5" /> Site
            </Link>
            <span className="w-px h-4 bg-gray-200 shrink-0" />
            <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(15,95,181,0.1)', color: '#0F5FB5' }}>
              <Building2 className="w-4 h-4" />
            </span>
            <span className="font-bold text-sm text-gray-800 truncate">{appInfo!.business_name}</span>
            <span className="hidden sm:inline text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: 'rgba(15,95,181,0.1)', color: '#0F5FB5' }}>LBO</span>
          </div>
          <span className="text-xs text-gray-400 hidden sm:inline shrink-0 truncate">{appInfo!.owner_name}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex flex-wrap gap-1">
          {([
            { key: 'dashboard', label: 'Dashboard',       icon: <LayoutDashboard className="w-3.5 h-3.5" />, badge: 0 },
            { key: 'overview',  label: 'Your Listing',    icon: <MapPin className="w-3.5 h-3.5" />,     badge: 0 },
            { key: 'requests',  label: 'Change Requests',  icon: <Edit className="w-3.5 h-3.5" />,       badge: pendingCrCount },
            { key: 'visitors',  label: 'Visitor Records',  icon: <TrendingUp className="w-3.5 h-3.5" />, badge: 0 },
            ...(attrData?.linked ? [{ key: 'ratings' as Tab, label: 'Ratings & Reviews', icon: <Star className="w-3.5 h-3.5" />, badge: 0 }] : []),
          ] as { key: Tab; label: string; icon: React.ReactNode; badge: number }[]).map(({ key, label, icon, badge }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === key
                  ? 'text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
              style={activeTab === key ? { backgroundColor: '#1565C0' } : undefined}>
              {icon}{label}
              {badge > 0 && (
                <span className={`px-1.5 rounded-full text-[10px] font-bold leading-[18px] ${
                  activeTab === key ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700'
                }`}>{badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* An empty panel and a panel that failed to load look identical, and
            the difference matters to a business owner checking their listing. */}
        {loadFailures.length > 0 && (
          <div className="rounded-xl border px-4 py-3 text-sm"
            style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA', color: '#991B1B' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">
                  {loadFailures.length === 1 ? 'Something could not load' : `${loadFailures.length} panels could not load`}
                  {loadFailures.some(f => f.includes('401') || f.includes('403')) && ' — your session may have expired'}
                </p>
                <p className="mt-1 opacity-80 break-words">{loadFailures.join(' · ')}</p>
                <p className="mt-1 opacity-70">What you see below may be incomplete. Reload, or sign in again.</p>
              </div>
              <button onClick={() => setLoadFailures([])} className="shrink-0 font-bold opacity-60 hover:opacity-100">✕</button>
            </div>
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {activeTab === 'dashboard' && (
          <LboOverview token={token} onGoToTab={(t, anchor) => {
            setActiveTab(t as Tab);
            // The tab has to render before the target exists to scroll to.
            if (anchor) requestAnimationFrame(() =>
              document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
          }} />
        )}

        {activeTab === 'overview' && (
          <>
            {loadingAttr ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1565C0' }} />
              </div>
            ) : attrData?.linked && attrData.attraction ? (
              <>
              {/* ── Linked attraction card ── */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${TYPE_COLORS[attrData.type!] || '#64748b'}20` }}>
                      <Layers className="w-5 h-5" style={{ color: TYPE_COLORS[attrData.type!] || '#64748b' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-gray-900">{attrData.attraction.name}</h2>
                        <button onClick={() => requestEdit('Name / Listing Title', attrData.attraction!.name ?? '')}
                          title="Request a change to the name"
                          className="p-1 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: TYPE_COLORS[attrData.type!] || '#64748b' }}>
                          {TYPE_LABELS[attrData.type!] || attrData.type}
                        </span>
                        {attrData.attraction.category && (
                          <span className="text-xs text-gray-400 capitalize">{attrData.attraction.category}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {(attrData.attraction.rating ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                      <span className="text-sm font-bold text-gray-700">{Number(attrData.attraction.rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Photos from the published listing — the owner's own gallery */}
                {(attrData.attraction.photos?.length ?? 0) > 0 && (
                  <div className="px-6 pt-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Photos ({attrData.attraction.photos!.length})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {attrData.attraction.photos!.map((p, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={p.url} alt={p.alt || `${attrData.attraction!.name} photo ${i + 1}`}
                          loading="lazy"
                          className="w-full h-28 object-cover rounded-xl border border-gray-100" />
                      ))}
                    </div>
                  </div>
                )}

                <div className="px-6 py-5 space-y-4">
                  {attrData.attraction.description && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</p>
                        <button onClick={() => requestEdit('Description', stripHtml(attrData.attraction!.description ?? ''))}
                          title="Request a change to the description"
                          className="p-0.5 rounded text-gray-300 hover:text-blue-600 transition">
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {stripHtml(attrData.attraction.description)}
                      </p>
                    </div>
                  )}
                  {attrData.attraction.features && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Details</p>
                      {/* Rendered as HTML, not stripped — this field is authored
                          as paragraphs, and flattening it ran every line
                          (best time, fee, hours, tips) into one block of text. */}
                      <SafeHtml html={attrData.attraction.features}
                        className="prose prose-sm max-w-none text-gray-700 leading-relaxed" />
                    </div>
                  )}
                  {attrData.attraction.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                      {attrData.attraction.location}
                    </div>
                  )}
                  {attrData.attraction.latitude != null && attrData.attraction.longitude != null && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {Number(attrData.attraction.latitude).toFixed(5)}, {Number(attrData.attraction.longitude).toFixed(5)}
                    </div>
                  )}
                  {(attrData.attraction.reviewCount ?? 0) > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Star className="w-4 h-4 fill-amber-400 stroke-amber-400 shrink-0" />
                      {Number(attrData.attraction.rating).toFixed(1)} average from {attrData.attraction.reviewCount} review
                      {attrData.attraction.reviewCount === 1 ? '' : 's'}
                    </div>
                  )}
                  {!attrData.attraction.description && !attrData.attraction.location
                    && (attrData.attraction.photos?.length ?? 0) === 0 && (
                    <p className="text-sm text-gray-400">
                      Your listing has no published details yet. An Editor adds these in the CMS.
                    </p>
                  )}
                  {attrData.attraction.id && (
                    <Link href={`/attractions/${attrData.type}-${attrData.attraction.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
                      style={{ color: '#1565C0' }}>
                      View public listing →
                    </Link>
                  )}
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs text-gray-400">To update your listing information, submit a Change Request</p>
                  <button onClick={() => setActiveTab('requests')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                    style={{ backgroundColor: '#1565C0' }}>
                    <Edit className="w-3.5 h-3.5" /> Request Changes
                  </button>
                </div>
              </div>
            {/* 360° tour status. Read-only here — the panoramas are placed by
                CHATO staff, so the only action an owner has is to ask. */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mt-6 px-6 py-5 flex items-center gap-4 flex-wrap">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: hasTour ? '#DCFCE7' : '#F3F4F6' }}>
                <Layers className="w-5 h-5" style={{ color: hasTour ? '#16A34A' : '#9CA3AF' }} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-900 text-sm">360° Virtual Tour</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {hasTour
                    ? `Published with ${tourScenes} scene${tourScenes === 1 ? '' : 's'} on the 3D Tours page.`
                    : pendingTour
                      ? 'Your request is with CHATO — they will contact you to schedule the shoot.'
                      : 'Not set up yet. Request one and a CHATO photographer will capture your place.'}
                </p>
              </div>
              {hasTour ? (
                <Link href="/immersive"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 shrink-0"
                  style={{ backgroundColor: '#16A34A' }}>
                  View Tour <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <button onClick={() => setActiveTab('requests')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition hover:opacity-90 shrink-0"
                  style={{ backgroundColor: pendingTour ? '#FEF3C7' : '#1565C0', color: pendingTour ? '#B45309' : '#fff' }}>
                  {pendingTour ? <><Clock className="w-3.5 h-3.5" /> Request Pending</> : <>Request a Tour <ArrowRight className="w-3.5 h-3.5" /></>}
                </button>
              )}
            </div>

            {/* Printable check-in poster. Owners print this and display it at
                the entrance; scanning it is what credits a visitor's visit. */}
            {attrData.attraction.id && (
              <div id="qr-poster" className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-6 scroll-mt-24">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <QrCode className="w-4 h-4" style={{ color: '#1565C0' }} /> Your Check-In QR Poster
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Print this and display it at your entrance. Visitors scan it to check in and earn points —
                    scans are confirmed against your location, so keep your coordinates accurate.
                  </p>
                </div>
                <div className="px-6 py-5">
                  <QRPoster
                    attractionId={`${attrData.type}-${attrData.attraction.id}`}
                    attractionName={attrData.attraction.name}
                  />
                </div>
              </div>
            )}

              </>
            ) : (
              /* ── No attraction linked, or the listing could not be loaded ── */
              <>
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-blue-400" />
                  </div>
                  <h2 className="font-bold text-gray-900 mb-1">No Attraction Linked Yet</h2>
                  <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
                    Your business hasn't been linked to an attraction listing in our tourism directory.
                    {attrData?.linked === false && !attrData.error
                      ? " Submit a request and our team will create and link your attraction."
                      : " Contact us if you believe this is an error."}
                  </p>
                  {!showArForm && (
                    <button onClick={() => { setShowArForm(true); setArMsg(null); }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition hover:opacity-90"
                      style={{ backgroundColor: '#1565C0' }}>
                      <Plus className="w-4 h-4" /> Request New Listing
                    </button>
                  )}
                </div>

                {/* Attraction Request Form */}
                {showArForm && (
                  <form onSubmit={handleSubmitAr} className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">Request New Attraction Listing</h3>
                      <button type="button" onClick={() => { setShowArForm(false); setArMsg(null); }}
                        className="text-gray-400 hover:text-red-500 transition">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Step 1 — Category */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">What type of attraction is this? <span className="text-red-500">*</span></p>
                      <div className="grid grid-cols-3 gap-2">
                        {CATEGORIES.map(c => (
                          <button key={c} type="button"
                            onClick={() => setArForm(f => ({ ...f, category: c, place_type: '', difficulty_level: '', cuisine_type: '', price_range: '' }))}
                            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-sm font-semibold transition ${arForm.category === c ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-blue-300 hover:bg-blue-50'}`}>
                            <span className="text-xl">{CATEGORY_ICONS[c]}</span>
                            {CATEGORY_LABELS[c]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {arForm.category && <>
                      {/* Step 2 — Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">What is the name of your attraction? <span className="text-red-500">*</span></label>
                        <input required type="text" value={arForm.attraction_name}
                          onChange={e => setArForm(f => ({ ...f, attraction_name: e.target.value }))}
                          placeholder="Official name"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </div>

                      {/* Step 3 — Description */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Describe your attraction <span className="text-xs font-normal text-gray-400">(optional)</span></label>
                        <textarea value={arForm.description}
                          onChange={e => setArForm(f => ({ ...f, description: e.target.value }))}
                          rows={3} placeholder="Brief description…"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                      </div>

                      {/* Step 4 — Location */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Where is it located? <span className="text-xs font-normal text-gray-400">(optional)</span></label>
                        <input type="text" value={arForm.location}
                          onChange={e => setArForm(f => ({ ...f, location: e.target.value }))}
                          placeholder="e.g. 123 Rizal Street, Liliw, Laguna"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </div>

                      {/* Heritage Site fields */}
                      {arForm.category === 'heritage' && <>
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">What type of heritage site is it? <span className="text-xs font-normal text-gray-400">(optional)</span></p>
                          <div className="flex gap-2 flex-wrap">
                            {[['heritage_site','Heritage Site'],['landmark','Landmark'],['museum','Museum']].map(([val, label]) => (
                              <button key={val} type="button"
                                onClick={() => setArForm(f => ({ ...f, place_type: f.place_type === val ? '' : val }))}
                                className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${arForm.place_type === val ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Distance from town center <span className="text-xs font-normal text-gray-400">(optional)</span></label>
                          <input type="text" value={arForm.distance_from_center}
                            onChange={e => setArForm(f => ({ ...f, distance_from_center: e.target.value }))}
                            placeholder="e.g. 2.5 km from town center"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        </div>
                      </>}

                      {/* Tourist Spot fields */}
                      {arForm.category === 'spot' && <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Opening Hours <span className="text-xs font-normal text-gray-400">(optional)</span></label>
                            <input type="text" value={arForm.opening_hours}
                              onChange={e => setArForm(f => ({ ...f, opening_hours: e.target.value }))}
                              placeholder="e.g. 8AM – 5PM daily"
                              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Entrance Fee <span className="text-xs font-normal text-gray-400">(optional)</span></label>
                            <input type="text" value={arForm.entrance_fee}
                              onChange={e => setArForm(f => ({ ...f, entrance_fee: e.target.value }))}
                              placeholder="e.g. ₱50 / Free"
                              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Best Time to Visit <span className="text-xs font-normal text-gray-400">(optional)</span></label>
                          <input type="text" value={arForm.best_time_to_visit}
                            onChange={e => setArForm(f => ({ ...f, best_time_to_visit: e.target.value }))}
                            placeholder="e.g. Early morning, dry season"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">How difficult is it to reach? <span className="text-xs font-normal text-gray-400">(optional)</span></p>
                          <div className="flex gap-2">
                            {[['easy','Easy'],['moderate','Moderate'],['difficult','Difficult']].map(([val, label]) => (
                              <button key={val} type="button"
                                onClick={() => setArForm(f => ({ ...f, difficulty_level: f.difficulty_level === val ? '' : val }))}
                                className={`flex-1 py-2 rounded-xl border text-sm font-medium transition ${arForm.difficulty_level === val ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>}

                      {/* Dining & Food fields */}
                      {arForm.category === 'dining' && <>
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">What type of cuisine? <span className="text-xs font-normal text-gray-400">(optional)</span></p>
                          <div className="flex gap-2 flex-wrap">
                            {[['local','Local'],['international','International'],['fusion','Fusion'],['cafe','Café'],['food_stall','Food Stall']].map(([val, label]) => (
                              <button key={val} type="button"
                                onClick={() => setArForm(f => ({ ...f, cuisine_type: f.cuisine_type === val ? '' : val }))}
                                className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${arForm.cuisine_type === val ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">What is the price range? <span className="text-xs font-normal text-gray-400">(optional)</span></p>
                          <div className="flex gap-2">
                            {[['budget','💰 Budget'],['moderate','💰💰 Moderate'],['expensive','💰💰💰 Expensive']].map(([val, label]) => (
                              <button key={val} type="button"
                                onClick={() => setArForm(f => ({ ...f, price_range: f.price_range === val ? '' : val }))}
                                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition ${arForm.price_range === val ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact Number <span className="text-xs font-normal text-gray-400">(optional)</span></label>
                            <input type="text" value={arForm.contact_number}
                              onChange={e => setArForm(f => ({ ...f, contact_number: e.target.value }))}
                              placeholder="e.g. 09171234567"
                              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Opening Hours <span className="text-xs font-normal text-gray-400">(optional)</span></label>
                            <input type="text" value={arForm.opening_hours}
                              onChange={e => setArForm(f => ({ ...f, opening_hours: e.target.value }))}
                              placeholder="e.g. 9AM – 9PM"
                              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                          </div>
                        </div>
                      </>}

                      {/* Virtual Tour checkbox */}
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input type="checkbox" checked={arForm.has_virtual_tour}
                          onChange={e => setArForm(f => ({ ...f, has_virtual_tour: e.target.checked }))}
                          className="w-4 h-4 rounded accent-blue-600" />
                        <span className="text-sm font-medium text-gray-700">This attraction has a virtual tour available</span>
                      </label>
                    </>}

                    {arMsg && (
                      <div className={`flex items-center gap-2 text-sm font-semibold ${arMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                        {arMsg.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {arMsg.text}
                      </div>
                    )}

                    <button type="submit" disabled={submittingAr || !arForm.category || !arForm.attraction_name.trim()}
                      className="w-full py-3 rounded-xl text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#1565C0' }}>
                      {submittingAr ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Send className="w-4 h-4" /> Submit Request</>}
                    </button>
                  </form>
                )}

                {/* Global arMsg when form is closed */}
                {!showArForm && arMsg && (
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border ${arMsg.ok ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-500'}`}>
                    {arMsg.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {arMsg.text}
                  </div>
                )}

                {/* Past attraction requests */}
                {(loadingAttrReqs || attrReqs.length > 0) && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h2 className="font-bold text-gray-900">Your Listing Requests</h2>
                      <span className="text-sm text-gray-400">{attrReqs.length} total</span>
                    </div>
                    {loadingAttrReqs ? (
                      <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" style={{ color: '#1565C0' }} /></div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {attrReqs.map(req => {
                          const status = req.status || 'pending';
                          return (
                            <div key={req.id} className="px-6 py-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-gray-900 text-sm">{req.attraction_name}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${AR_STATUS_COLOR[status] || 'bg-gray-100 text-gray-600'}`}>
                                      {AR_STATUS_LABEL[status] || status}
                                    </span>
                                    {req.category && (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 capitalize">{req.category}</span>
                                    )}
                                  </div>
                                  {req.description && (
                                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{req.description}</p>
                                  )}
                                  {(req.editor_notes || req.officer_notes) && (
                                    <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
                                      <p className="text-xs font-semibold text-amber-700">Staff note:</p>
                                      <p className="text-xs text-amber-800 mt-0.5">{req.officer_notes || req.editor_notes}</p>
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-gray-400 shrink-0">{req.created_at ? fmt(req.created_at) : '—'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── CHANGE REQUESTS ── */}
        {activeTab === 'requests' && (
          <>
            {/* ── Virtual Tour booking ── */}
            <div className="bg-white rounded-2xl border shadow-sm p-5"
              style={{ borderColor: hasTour ? '#BBF7D0' : '#DBEAFE' }}>
              <div className="flex items-start gap-4 flex-wrap justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: hasTour ? '#DCFCE7' : '#EFF6FF' }}>
                    <Layers className="w-5 h-5" style={{ color: hasTour ? '#16A34A' : '#1565C0' }} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                      360° Virtual Tour
                      {hasTour && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                          LIVE · {tourScenes} scene{tourScenes === 1 ? '' : 's'}
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5 max-w-lg">
                      {hasTour
                        ? 'Visitors can walk through your place from the 3D Tours page. Ask for an update if it no longer matches how the place looks.'
                        : 'A CHATO photographer captures 360° panoramas of your place and publishes them to the 3D Tours page. Request a shoot and they will contact you to schedule it.'}
                    </p>
                  </div>
                </div>

                {pendingTour ? (
                  <span className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0 bg-yellow-50 text-yellow-700">
                    <Clock className="w-4 h-4" /> Request {CR_STATUS_LABEL[pendingTour.status] ?? pendingTour.status}
                  </span>
                ) : (
                  <button onClick={() => { setShowVtForm(v => !v); setVtMsg(null); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 shrink-0"
                    style={{ backgroundColor: showVtForm ? '#6B7280' : hasTour ? '#16A34A' : '#1565C0' }}>
                    {showVtForm
                      ? <><X className="w-4 h-4" /> Cancel</>
                      : <><Plus className="w-4 h-4" /> {hasTour ? 'Request an Update' : 'Request a Virtual Tour'}</>}
                  </button>
                )}
              </div>

              {showVtForm && (
                <form onSubmit={handleSubmitVt} className="mt-5 pt-5 border-t border-gray-100 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Areas to Capture <span className="text-red-500">*</span>
                    </label>
                    <textarea required value={vtForm.areas} rows={2}
                      onChange={e => setVtForm(f => ({ ...f, areas: e.target.value }))}
                      placeholder="e.g. Main dining hall, garden, second-floor viewing deck"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Preferred Date / Time</label>
                      <input type="text" value={vtForm.preferred_date}
                        onChange={e => setVtForm(f => ({ ...f, preferred_date: e.target.value }))}
                        placeholder="e.g. Weekday mornings, before 10 AM"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">On-site Contact</label>
                      <input type="text" value={vtForm.contact}
                        onChange={e => setVtForm(f => ({ ...f, contact: e.target.value }))}
                        placeholder="Who will meet the photographer?"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes (optional)</label>
                    <textarea value={vtForm.notes} rows={2}
                      onChange={e => setVtForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Anything the photographer should know — access, busy hours, areas to avoid"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                  </div>

                  <button type="submit" disabled={submittingVt}
                    className="w-full py-3 rounded-xl text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ backgroundColor: hasTour ? '#16A34A' : '#1565C0' }}>
                    {submittingVt ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : 'Send Request'}
                  </button>
                </form>
              )}

              {vtMsg && (
                <div className={`flex items-center gap-2 mt-4 text-sm font-semibold ${vtMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                  {vtMsg.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {vtMsg.text}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4 flex-wrap justify-between">
              <div>
                <h2 className="font-bold text-gray-900">Change Requests</h2>
                <p className="text-xs text-gray-400 mt-0.5 max-w-lg">Submit a request to update any information about your attraction listing. Our CHATO Editor will review and apply the changes.</p>
              </div>
              <button onClick={() => { setShowCrForm(v => !v); setCrMsg(null); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 shrink-0"
                style={{ backgroundColor: showCrForm ? '#6B7280' : '#1565C0' }}>
                {showCrForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Request</>}
              </button>
            </div>

            {showCrForm && (
              <form onSubmit={handleSubmitCr} className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-gray-900 text-sm mb-1">New Change Request</h3>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Field to Change <span className="text-red-500">*</span></label>
                  <select required value={crForm.field_to_change} onChange={e => setCrForm(f => ({ ...f, field_to_change: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="" disabled>Select field…</option>
                    {FIELDS_TO_CHANGE.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Current Value (optional)</label>
                  <textarea value={crForm.current_value} onChange={e => setCrForm(f => ({ ...f, current_value: e.target.value }))} rows={2}
                    placeholder="What does it say now?"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Requested Value <span className="text-red-500">*</span></label>
                  <textarea required value={crForm.requested_value} onChange={e => setCrForm(f => ({ ...f, requested_value: e.target.value }))} rows={2}
                    placeholder="What should it say?"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Reason (optional)</label>
                  <textarea value={crForm.reason} onChange={e => setCrForm(f => ({ ...f, reason: e.target.value }))} rows={2}
                    placeholder="Why is this change needed?"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                </div>

                {crMsg && (
                  <div className={`flex items-center gap-2 text-sm font-semibold ${crMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                    {crMsg.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {crMsg.text}
                  </div>
                )}

                <button type="submit" disabled={submittingCr}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#1565C0' }}>
                  {submittingCr ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit Request'}
                </button>
              </form>
            )}

            {!showCrForm && crMsg && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border ${crMsg.ok ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-500'}`}>
                {crMsg.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {crMsg.text}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Your Requests</h2>
                <span className="text-sm text-gray-400">{requests.length} total</span>
              </div>
              {loadingReqs ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#1565C0' }} /></div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center text-gray-400">
                  <FileText className="w-10 h-10 opacity-20 mb-3" />
                  <p className="font-semibold">No requests yet</p>
                  <p className="text-xs mt-1">Use the button above to submit your first change request</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {requests.map(req => {
                    const a = req.attributes || req;
                    const status = a.status || 'pending';
                    return (
                      <div key={req.id} className="px-6 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900 text-sm">{a.field_to_change}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${CR_STATUS_COLOR[status] || 'bg-gray-100 text-gray-600'}`}>
                                {CR_STATUS_LABEL[status] || status}
                              </span>
                            </div>
                            {a.current_value && (
                              <p className="text-xs text-gray-400 mt-1 line-clamp-1"><span className="font-medium">From:</span> {a.current_value}</p>
                            )}
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2"><span className="font-medium">To:</span> {a.requested_value}</p>
                            {a.reason && <p className="text-xs text-gray-400 mt-0.5 italic">{a.reason}</p>}
                            {a.editor_notes && (
                              <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
                                <p className="text-xs font-semibold text-amber-700">Editor note:</p>
                                <p className="text-xs text-amber-800 mt-0.5">{a.editor_notes}</p>
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 shrink-0">{(a.created_at || a.createdAt) ? fmt(a.created_at || a.createdAt) : '—'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── RATINGS & REVIEWS ── */}
        {activeTab === 'ratings' && (
          <>
            {!attrData?.linked ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="font-bold text-gray-900 mb-1">Ratings Not Available Yet</h2>
                <p className="text-sm text-gray-400 max-w-md mx-auto">
                  This tab will show ratings and reviews once your attraction has been registered in the tourism directory by an Editor.
                </p>
              </div>
            ) : loadingRatings ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1565C0' }} />
              </div>
            ) : (() => {
              const avgRating = ratings.length > 0
                ? ratings.reduce((sum, r) => sum + (r.attributes?.rating || r.rating || 0), 0) / ratings.length
                : 0;
              return (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-center">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Average Rating</p>
                      <div className="flex items-center justify-center gap-2">
                        <Star className="w-6 h-6 fill-amber-400 stroke-amber-400" />
                        <span className="text-3xl font-black text-gray-900">{ratings.length > 0 ? avgRating.toFixed(1) : '—'}</span>
                      </div>
                      <div className="flex justify-center gap-0.5 mt-2">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'fill-amber-400 stroke-amber-400' : 'fill-gray-200 stroke-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-center">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Total Reviews</p>
                      <p className="text-3xl font-black text-gray-900">{ratings.length}</p>
                      <p className="text-xs text-gray-400 mt-1">from visitors</p>
                    </div>
                  </div>

                  {/* Rating distribution */}
                  {ratings.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                      <h3 className="font-bold text-gray-900 text-sm mb-4">Rating Breakdown</h3>
                      {[5,4,3,2,1].map(star => {
                        const count = ratings.filter(r => (r.attributes?.rating || r.rating) === star).length;
                        const pct = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-1 w-16 shrink-0">
                              <span className="text-sm font-semibold text-gray-700">{star}</span>
                              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                            </div>
                            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div className="h-2 rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 w-8 text-right shrink-0">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Individual reviews */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h2 className="font-bold text-gray-900">All Reviews</h2>
                      <span className="text-sm text-gray-400">{ratings.length} total</span>
                    </div>
                    {ratings.length === 0 ? (
                      <div className="flex flex-col items-center py-16 text-center text-gray-400">
                        <Star className="w-10 h-10 opacity-20 mb-3" />
                        <p className="font-semibold">No reviews yet</p>
                        <p className="text-xs mt-1">Reviews from visitors will appear here</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {ratings.map((rev, i) => {
                          const a = rev.attributes || rev;
                          const stars = a.rating || 0;
                          return (
                            <div key={rev.id ?? i} className="px-6 py-5">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                    <span className="font-semibold text-gray-900 text-sm">{a.author || 'Anonymous'}</span>
                                    {a.verified && (
                                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-600">
                                        <CheckCircle className="w-3 h-3" /> Verified
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-0.5 mb-2">
                                    {[1,2,3,4,5].map(s => (
                                      <Star key={s} className={`w-3.5 h-3.5 ${s <= stars ? 'fill-amber-400 stroke-amber-400' : 'fill-gray-200 stroke-gray-200'}`} />
                                    ))}
                                  </div>
                                  {a.comment && <p className="text-sm text-gray-600 leading-relaxed">{a.comment}</p>}
                                </div>
                                <span className="text-xs text-gray-400 shrink-0">{(a.createdAt || a.created_at) ? fmt(a.createdAt || a.created_at) : '—'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </>
        )}

        {/* ── VISITOR RECORDS ── */}
        {activeTab === 'visitors' && (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-bold text-gray-900">Visitor Records</h2>
              <p className="text-xs text-gray-400 mt-0.5">Submit monthly visitor counts for your attraction. These are used for tourism statistics reporting.</p>
            </div>

            {/* What the app counted, next to what the owner is about to type.
                Only signed-in visitors who scanned the poster appear here, so
                it is the floor of the real number rather than the number —
                walk-ins and groups never will. Offered as a starting point,
                which is why it fills the form rather than replacing it. */}
            {scanStats && scanStats.linked && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <QrCode className="w-4 h-4" style={{ color: '#16A34A' }} />
                      QR check-ins in {MONTHS[vrMonth - 1]} {vrYear}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Counted automatically when a visitor scans your poster on site.
                    </p>
                  </div>
                  <span className="ml-auto text-2xl font-extrabold" style={{ color: '#16A34A' }}>
                    {scanStats.total}
                  </span>
                </div>

                {scanStats.total > 0 && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                      {VISITOR_ROWS.map(row => {
                        const m = scanStats.counts[row.male_key] ?? 0;
                        const f = scanStats.counts[row.female_key] ?? 0;
                        return (
                          <div key={row.label} className="rounded-xl bg-gray-50 px-3 py-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 leading-tight">{row.label}</p>
                            <p className="text-sm font-bold text-gray-800 mt-1">{m + f}</p>
                            <p className="text-[11px] text-gray-400">{m} male · {f} female</p>
                          </div>
                        );
                      })}
                    </div>

                    {(scanStats.unknownGender > 0 || scanStats.unknownOrigin > 0) && (
                      <p className="text-[11px] text-gray-400 mt-2.5">
                        {scanStats.unknownGender > 0 && `${scanStats.unknownGender} visitor${scanStats.unknownGender === 1 ? '' : 's'} did not state a gender`}
                        {scanStats.unknownGender > 0 && scanStats.unknownOrigin > 0 && ', and '}
                        {scanStats.unknownOrigin > 0 && `${scanStats.unknownOrigin} did not say where they travelled from`}
                        {' '}— counted in the total above, but not in the boxes.
                      </p>
                    )}

                    <button type="button" onClick={fillFromScans}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
                      style={{ backgroundColor: '#16A34A' }}>
                      <ArrowRight className="w-3.5 h-3.5" /> Use these numbers
                    </button>
                    <span className="text-[11px] text-gray-400 ml-2">
                      Fills the form below — add anyone who did not scan before submitting.
                    </span>
                  </>
                )}
              </div>
            )}

            <form onSubmit={handleSubmitVr} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
              <h3 className="font-bold text-gray-900 text-sm">Submit Monthly Record</h3>

              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Month</label>
                  <select value={vrMonth} onChange={e => setVrMonth(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="w-32">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Year</label>
                  <input type="number" value={vrYear} onChange={e => setVrYear(Number(e.target.value))} min={2000} max={2100}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[1fr_100px_100px_80px] bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Visitor Category</span>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Male</span>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Female</span>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Total</span>
                </div>
                {/* Rows */}
                <div className="divide-y divide-gray-100">
                  {VISITOR_ROWS.map(row => {
                    const rowTotal = vrTotal(row.male_key, row.female_key);
                    return (
                      <div key={row.label} className="grid grid-cols-[1fr_100px_100px_80px] items-center px-4 py-3 hover:bg-gray-50 transition-colors">
                        <span className="text-sm font-medium text-gray-700">{row.label}</span>
                        <div className="px-1">
                          <input type="number" min={0}
                            value={vrCounts[row.male_key]}
                            onChange={e => setVrCounts(c => ({ ...c, [row.male_key]: e.target.value }))}
                            placeholder="0"
                            className="w-full text-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition" />
                        </div>
                        <div className="px-1">
                          <input type="number" min={0}
                            value={vrCounts[row.female_key]}
                            onChange={e => setVrCounts(c => ({ ...c, [row.female_key]: e.target.value }))}
                            placeholder="0"
                            className="w-full text-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition" />
                        </div>
                        <div className="text-center">
                          <span className={`text-sm font-bold ${rowTotal > 0 ? 'text-gray-900' : 'text-gray-300'}`}>{rowTotal || '—'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Grand Total */}
                <div className="grid grid-cols-[1fr_100px_100px_80px] items-center px-4 py-3 border-t border-gray-200" style={{ backgroundColor: '#EFF6FF' }}>
                  <span className="text-sm font-bold text-blue-900">Grand Total</span>
                  <span className="text-sm font-bold text-blue-900 text-center">
                    {VISITOR_ROWS.reduce((s, r) => s + (Number(vrCounts[r.male_key]) || 0), 0)}
                  </span>
                  <span className="text-sm font-bold text-blue-900 text-center">
                    {VISITOR_ROWS.reduce((s, r) => s + (Number(vrCounts[r.female_key]) || 0), 0)}
                  </span>
                  <span className="text-sm font-bold text-blue-900 text-center">{vrGrandTotal || '—'}</span>
                </div>
              </div>

              {vrMsg && (
                <div className={`flex items-center gap-2 text-sm font-semibold ${vrMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                  {vrMsg.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {vrMsg.text}
                </div>
              )}

              <button type="submit" disabled={submittingVr}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#0B3D91,#1565C0)' }}>
                {submittingVr ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><RefreshCw className="w-4 h-4" /> Submit Record</>}
              </button>
            </form>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Past Submissions</h2>
                <span className="text-sm text-gray-400">{records.length} total</span>
              </div>
              {loadingRecs ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#1565C0' }} /></div>
              ) : records.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center text-gray-400">
                  <Users className="w-10 h-10 opacity-20 mb-3" />
                  <p className="font-semibold">No records submitted yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        <th className="px-5 py-3 text-left">Period</th>
                        <th className="px-5 py-3 text-center">Local</th>
                        <th className="px-5 py-3 text-center">Other City</th>
                        <th className="px-5 py-3 text-center">Other Province</th>
                        <th className="px-5 py-3 text-center">Foreign</th>
                        <th className="px-5 py-3 text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {records.map(rec => {
                        const a = rec.attributes || rec;
                        const total = totalVisitors(rec);
                        return (
                          <tr key={rec.id} className="hover:bg-gray-50">
                            <td className="px-5 py-4 font-semibold text-gray-900">
                              {MONTHS[(a.month || 1) - 1]} {a.year}
                            </td>
                            <td className="px-5 py-4 text-center text-gray-600">{(a.local_male||0)+(a.local_female||0)}</td>
                            <td className="px-5 py-4 text-center text-gray-600">{(a.other_city_male||0)+(a.other_city_female||0)}</td>
                            <td className="px-5 py-4 text-center text-gray-600">{(a.other_province_male||0)+(a.other_province_female||0)}</td>
                            <td className="px-5 py-4 text-center text-gray-600">{(a.foreign_male||0)+(a.foreign_female||0)}</td>
                            <td className="px-5 py-4 text-center font-bold text-gray-900">{total}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function LboDashboardPage() {
  return (
    <DesktopOnly>
      <LboDashboard />
    </DesktopOnly>
  );
}
