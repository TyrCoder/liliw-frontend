'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Users, Briefcase, MessageSquare, CheckCircle, AlertCircle, LogIn, Calendar, MapPin, ChevronRight } from 'lucide-react';
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

export default function CommunityPage() {
  const { user } = useAuth();
  const [authModal, setAuthModal] = useState(false);
  const [joinableEvents, setJoinableEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/strapi/events')
      .then(r => r.json())
      .then(data => setJoinableEvents(data.data || []))
      .catch(() => setJoinableEvents([]))
      .finally(() => setEventsLoading(false));
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

  const participationOptions = [
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: 'Share Your Feedback',
      description: 'Help us improve tourism experiences in Liliw',
      items: [
        'Tourist satisfaction surveys',
        'Event evaluation forms',
        'Service improvement suggestions',
        'Experience sharing and testimonials',
      ],
      cta: 'Give Feedback',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Volunteer with Us',
      description: 'Join our community in welcoming visitors',
      items: [
        'Tour guide opportunities',
        'Festival and event support',
        'Cultural ambassador programs',
        'Community workshop facilitation',
      ],
      cta: 'Become a Volunteer',
    },
    {
      icon: <Briefcase className="w-8 h-8" />,
      title: 'Business Partnerships',
      description: 'Connect your business with tourism',
      items: [
        'Tourism enterprise development',
        'Artisan cooperative formation',
        'Hospitality service partnerships',
        'Craft and product collaborations',
      ],
      cta: 'Explore Partnerships',
    },
  ];

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      {/* Page Header */}
      <div className="py-12" style={{ background: 'linear-gradient(to bottom right, rgba(0, 191, 179, 0.05), rgba(0, 191, 179, 0.1))' }}>
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/"
              className="inline-flex items-center font-semibold mb-6 group" style={{ color: '#00BFB3' }}
            >
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition" />
              Back to Home
            </Link>
            <h1 className="text-5xl font-bold mb-3" style={{ color: '#00BFB3' }}>Community Engagement</h1>
            <p className="text-xl text-gray-600">
              Be part of Liliw's tourism story
            </p>
          </motion.div>
        </div>
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
              <h2 className="text-3xl font-bold text-gray-900 mb-6">🎉 Open Events — Join Now</h2>
              {eventsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {joinableEvents.map(item => {
                    const a = item.attributes || item;
                    const cover = getPhotoUrl(a.cover_image?.data?.attributes || a.cover_image?.attributes || a.cover_image);
                    const dateStart = a.date_start ? new Date(a.date_start) : null;
                    return (
                      <Link key={item.id} href={`/community/events/${a.slug}`}>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          className="group relative rounded-2xl overflow-hidden border-2 bg-white shadow-sm hover:shadow-lg transition-all cursor-pointer"
                          style={{ borderColor: '#00BFB3' }}>
                          <div className="relative h-40 bg-linear-to-br from-teal-100 to-cyan-50">
                            {cover
                              ? <img src={cover} alt={a.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              : <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">🎉</div>
                            }
                            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                            {a.category && (
                              <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${CATEGORY_BADGE[a.category] || 'bg-gray-100 text-gray-600'}`}>
                                {a.category}
                              </span>
                            )}
                            <div className="absolute bottom-3 left-4 right-4">
                              <p className="text-white font-bold text-base leading-snug">{a.title}</p>
                            </div>
                          </div>
                          <div className="px-4 py-3 flex items-center justify-between">
                            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                              {dateStart && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" style={{ color: '#00BFB3' }} />
                                  {dateStart.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              )}
                              {a.venue && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" style={{ color: '#00BFB3' }} />
                                  {a.venue}
                                </span>
                              )}
                            </div>
                            <span className="flex items-center gap-1 text-xs font-bold shrink-0 ml-2" style={{ color: '#00BFB3' }}>
                              Join <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
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
                <div className="mb-4" style={{ color: '#00BFB3' }}>{option.icon}</div>
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
                  {option.cta}
                </button>
              </motion.div>
            ))}
          </div>

          {/* Why Participate */}
          <motion.div variants={itemVariants} className="mt-16 space-y-6">
            <h2 className="text-4xl font-bold text-gray-900">💖 Why Your Participation Matters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)', borderColor: '#00BFB3' }}>
                <h4 className="text-lg font-bold text-gray-900 mb-3">💬 Share Your Voice</h4>
                <p className="text-gray-700">
                  Your feedback helps us create better experiences for residents and visitors alike. 
                  Every opinion matters in shaping Liliw's future as a tourism destination.
                </p>
              </div>
              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)', borderColor: '#00BFB3' }}>
                <h4 className="text-lg font-bold text-gray-900 mb-3">🤝 Build Connections</h4>
                <p className="text-gray-700">
                  Join a vibrant community of locals and travelers. Volunteer opportunities allow you to 
                  meet people from around the world and grow your network.
                </p>
              </div>
              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)', borderColor: '#00BFB3' }}>
                <h4 className="text-lg font-bold text-gray-900 mb-3">💰 Create Economic Opportunities</h4>
                <p className="text-gray-700">
                  Business partnerships and community enterprises generate income while preserving local culture.
                  Support sustainable tourism that benefits everyone.
                </p>
              </div>
              <div className="p-6 rounded-lg border" style={{ backgroundColor: 'rgba(0, 191, 179, 0.08)', borderColor: '#00BFB3' }}>
                <h4 className="text-lg font-bold text-gray-900 mb-3">🎓 Learn & Grow</h4>
                <p className="text-gray-700">
                  Develop new skills through training programs and workshops. Share your knowledge with 
                  visitors and fellow community members.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Contact & Resources */}
          <motion.div variants={itemVariants} className="mt-16 space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">📞 Get Involved Today</h2>
            <div className="text-white rounded-2xl p-8" style={{ backgroundColor: '#00BFB3' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-bold mb-3">Liliw Tourism Office</h4>
                  <p className="mb-2">📍 Municipal Hall, Liliw, Laguna 4004</p>
                  <p className="mb-2">📱 Contact: +63 (2) XXXX-XXXX</p>
                  <p className="mb-4">📧 Email: tourism@liliw.gov.ph</p>
                  <p className="opacity-90">Hours: Monday - Friday, 8:00 AM - 5:00 PM</p>
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-3">Follow Us Online</h4>
                  <p className="mb-3">Stay updated on community initiatives and opportunities</p>
                  <div className="space-y-2">
                    <p>👍 Facebook: @LiliwTourism</p>
                    <p>📷 Instagram: @LiliwTourism</p>
                    <p>🌐 Website: tourism.liliw.gov.ph</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form CTA — auth gated */}
          <motion.div variants={itemVariants} className="mt-12 p-8 rounded-lg bg-blue-50 border-2 border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">✍️ Interested in Participating?</h3>

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
