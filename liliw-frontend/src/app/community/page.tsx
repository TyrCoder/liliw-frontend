'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Users, Briefcase, MessageSquare, CheckCircle, AlertCircle, LogIn, Calendar, MapPin, ChevronRight, Clock, UserCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

function getPhotoUrl(p: any): string | null {
  if (!p) return null;
  const raw = p.url || p.data?.attributes?.url || p.attributes?.url || null;
  if (!raw) return null;
  return raw.startsWith('/') ? `${STRAPI}${raw}` : raw;
}

const CATEGORY_BADGE: Record<string, string> = {
  festival: 'bg-purple-100 text-purple-700',
  cultural: 'bg-blue-100 text-blue-700',
  competition: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-600',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4 },
  },
};

const ICON_MAP: Record<string, React.ReactNode> = {
  feedback:    <MessageSquare className="w-8 h-8" />,
  volunteer:   <Users className="w-8 h-8" />,
  partnership: <Briefcase className="w-8 h-8" />,
};

const DEFAULT_OPTIONS = [
  {
    icon: 'feedback',
    title: 'Share Your Feedback',
    description: 'Help us improve tourism experiences in Liliw',
    items: ['Tourist satisfaction surveys', 'Event evaluation forms', 'Service improvement suggestions', 'Experience sharing and testimonials'],
    cta_label: 'Give Feedback',
  },
  {
    icon: 'volunteer',
    title: 'Volunteer with Us',
    description: 'Join our community in welcoming visitors',
    items: ['Tour guide opportunities', 'Festival and event support', 'Cultural ambassador programs', 'Community workshop facilitation'],
    cta_label: 'Become a Volunteer',
  },
  {
    icon: 'partnership',
    title: 'Business Partnerships',
    description: 'Connect your business with tourism',
    items: ['Tourism enterprise development', 'Artisan cooperative formation', 'Hospitality service partnerships', 'Craft and product collaborations'],
    cta_label: 'Explore Partnerships',
  },
];

export default function CommunityPage() {
  const { user } = useAuth();
  const [authModal, setAuthModal] = useState(false);
  const [joinableEvents, setJoinableEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [participationOptions, setParticipationOptions] = useState(DEFAULT_OPTIONS);

  useEffect(() => {
    fetch('/api/strapi/events')
      .then(r => r.json())
      .then(data => setJoinableEvents(data.data || []))
      .catch(() => setJoinableEvents([]))
      .finally(() => setEventsLoading(false));

    fetch('/api/strapi/participation-options')
      .then(r => r.json())
      .then(data => {
        const items = data.data || [];
        if (items.length > 0) {
          setParticipationOptions(items.map((item: any) => {
            const a = item.attributes || item;
            return {
              icon: a.icon || 'feedback',
              title: a.title || '',
              description: a.description || '',
              items: Array.isArray(a.items) ? a.items : [],
              cta_label: a.cta_label || 'Learn More',
            };
          }));
        }
      })
      .catch(() => {});
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          type: 'feedback',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setStatusMessage(data.message || 'Thank you for your submission!');
        setFormData({ name: '', email: '', phone: '', message: '' });
        setTimeout(() => setSubmitStatus('idle'), 5000);
      } else {
        setSubmitStatus('error');
        setStatusMessage(data.error || 'Failed to submit form');
      }
    } catch (error) {
      setSubmitStatus('error');
      setStatusMessage('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      {/* Page Header */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center font-semibold mb-4 sm:mb-6 group text-sm sm:text-base" style={{ color: '#00BFB3' }}>
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" />
            Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3" style={{ color: '#00BFB3' }}>Community Engagement</h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600">Be part of Liliw&apos;s tourism story</p>
        </motion.div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-12"
        >
          {/* Joinable Events */}
          {(eventsLoading || joinableEvents.length > 0) && (
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Open Events — Join Now</h2>
              {eventsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-56 rounded-2xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {joinableEvents.map(item => {
                    const a = item.attributes || item;

                    // Extract plain text from rich-text blocks or plain string
                    const description = (() => {
                      const d = a.description;
                      if (!d) return '';
                      if (typeof d === 'string') return d;
                      if (Array.isArray(d)) {
                        return d.map((b: any) => (b?.children ?? []).map((c: any) => c?.text ?? '').join(' ')).join(' ');
                      }
                      return '';
                    })();

                    const dateStart = a.date_start ? new Date(a.date_start) : null;
                    const schedule = a.schedule ||
                      (dateStart ? dateStart.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : null);

                    const pricingLabel: string = a.pricing_label || (a.is_free ? 'Free entry' : a.price ? `Starting at ₱${a.price}` : '');
                    const pricingColor =
                      pricingLabel.toLowerCase().includes('free') ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                      pricingLabel.toLowerCase().includes('limited') ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                      'bg-purple-50 text-purple-700 border border-purple-200';

                    return (
                      <Link key={item.id} href={`/community/events/${a.slug || item.id}`}>
                        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}
                          className="group rounded-2xl bg-white border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer p-5 flex flex-col gap-3">

                          {/* Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block" />
                              Open
                            </span>
                            {pricingLabel && (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${pricingColor}`}>
                                {pricingLabel}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-teal-600 transition-colors">
                            {a.title}
                          </h3>

                          {/* Meta rows */}
                          <div className="space-y-1.5 text-xs text-gray-500">
                            {schedule && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: '#00BFB3' }} />
                                <span>{schedule}</span>
                              </div>
                            )}
                            {a.venue && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: '#00BFB3' }} />
                                <span>{a.venue}</span>
                              </div>
                            )}
                            {a.capacity_note && (
                              <div className="flex items-center gap-2">
                                <UserCheck className="w-3.5 h-3.5 shrink-0" style={{ color: '#00BFB3' }} />
                                <span>{a.capacity_note}</span>
                              </div>
                            )}
                          </div>

                          {/* Divider */}
                          {description && <hr className="border-gray-100" />}

                          {/* Description */}
                          {description && (
                            <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{description}</p>
                          )}
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Participation Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {participationOptions.map((option, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="p-8 rounded-2xl bg-white border-2 hover:shadow-lg transition-all duration-300" style={{ borderColor: '#00BFB3' }}
              >
                <div className="mb-4" style={{ color: '#00BFB3' }}>{ICON_MAP[option.icon] ?? <MessageSquare className="w-8 h-8" />}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{option.title}</h3>
                <p className="text-gray-600 mb-6">{option.description}</p>
                <ul className="space-y-2 mb-6">
                  {option.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="font-bold mt-1" style={{ color: '#00BFB3' }}>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full px-4 py-2 text-white font-semibold rounded-lg transition" style={{ backgroundColor: '#00BFB3' }}>
                  {option.cta_label}
                </button>
              </motion.div>
            ))}
          </div>

          {/* Why Participate */}
          <motion.div variants={itemVariants} className="mt-16 space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Why Your Participation Matters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)', borderColor: '#00BFB3' }}>
                <h4 className="text-lg font-bold text-gray-900 mb-3">Share Your Voice</h4>
                <p className="text-gray-700">
                  Your feedback helps us create better experiences for residents and visitors alike. 
                  Every opinion matters in shaping Liliw's future as a tourism destination.
                </p>
              </div>
              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)', borderColor: '#00BFB3' }}>
                <h4 className="text-lg font-bold text-gray-900 mb-3">Build Connections</h4>
                <p className="text-gray-700">
                  Join a vibrant community of locals and travelers. Volunteer opportunities allow you to 
                  meet people from around the world and grow your network.
                </p>
              </div>
              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)', borderColor: '#00BFB3' }}>
                <h4 className="text-lg font-bold text-gray-900 mb-3">Create Economic Opportunities</h4>
                <p className="text-gray-700">
                  Business partnerships and community enterprises generate income while preserving local culture.
                  Support sustainable tourism that benefits everyone.
                </p>
              </div>
              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)', borderColor: '#00BFB3' }}>
                <h4 className="text-lg font-bold text-gray-900 mb-3">Learn & Grow</h4>
                <p className="text-gray-700">
                  Develop new skills through training programs and workshops. Share your knowledge with 
                  visitors and fellow community members.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Contact & Resources */}
          <motion.div variants={itemVariants} className="mt-16 space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Get Involved Today</h2>
            <div className="text-white rounded-2xl p-8" style={{ backgroundColor: '#00BFB3' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-bold mb-3">Liliw Tourism Office</h4>
                  <p className="mb-2">Municipal Hall, Liliw, Laguna 4004</p>
                  <p className="mb-2">Contact: +63 (2) XXXX-XXXX</p>
                  <p className="mb-4">Email: tourism@liliw.gov.ph</p>
                  <p className="opacity-90">Hours: Monday - Friday, 8:00 AM - 5:00 PM</p>
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-3">Follow Us Online</h4>
                  <p className="mb-3">Stay updated on community initiatives and opportunities</p>
                  <div className="space-y-2">
                    <p>Facebook: @LiliwTourism</p>
                    <p>Instagram: @LiliwTourism</p>
                    <p>Website: tourism.liliw.gov.ph</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form CTA — auth gated */}
          <motion.div variants={itemVariants} className="mt-12 p-8 rounded-lg bg-blue-50 border-2 border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Interested in Participating?</h3>

            {!user ? (
              /* Not logged in — show login prompt */
              <div className="flex flex-col items-center text-center py-8 gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,191,179,.12)' }}>
                  <LogIn className="w-7 h-7" style={{ color: '#00BFB3' }} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg mb-1">Login to Participate</p>
                  <p className="text-gray-500 text-sm max-w-sm">
                    You need a Liliw account to submit your participation. It only takes a minute to register!
                  </p>
                </div>
                <button
                  onClick={() => setAuthModal(true)}
                  className="px-6 py-3 rounded-xl text-white font-bold text-sm transition hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#00BFB3,#009E99)', boxShadow: '0 6px 20px rgba(0,191,179,.35)' }}
                >
                  Login / Create Account
                </button>
              </div>
            ) : (
              /* Logged in — show form */
              <>
                <p className="text-gray-700 mb-6">
                  Fill out this form with your preferred area of involvement.
                  Our team will reach out within 3 business days.
                </p>

                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-green-900">Submission Successful</h4>
                      <p className="text-sm text-green-800">{statusMessage}</p>
                    </div>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-red-900">Submission Error</h4>
                      <p className="text-sm text-red-800">{statusMessage}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="name" placeholder="Full Name"
                      value={formData.name} onChange={handleInputChange} required
                      className="px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400" />
                    <input type="email" name="email" placeholder="Email Address"
                      value={formData.email} onChange={handleInputChange} required
                      className="px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400" />
                  </div>
                  <input type="tel" name="phone" placeholder="Phone Number"
                    value={formData.phone} onChange={handleInputChange} required
                    className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400" />
                  <textarea name="message" placeholder="Tell us how you'd like to get involved..."
                    rows={4} value={formData.message} onChange={handleInputChange} required
                    className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400" />
                  <button type="submit" disabled={isLoading}
                    className={`px-6 py-3 font-semibold rounded-lg transition ${isLoading ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'text-white hover:opacity-90'}`}
                    style={{ backgroundColor: isLoading ? undefined : '#00BFB3' }}>
                    {isLoading ? 'Submitting...' : 'Send Application'}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      </div>

      {authModal && <AuthModal defaultTab="login" onClose={() => setAuthModal(false)} />}
    </div>
  );
}
