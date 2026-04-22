'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Heart, Users, Briefcase, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

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

          {/* Form CTA */}
          <motion.div variants={itemVariants} className="mt-12 p-8 rounded-lg bg-blue-50 border-2 border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">✍️ Interested in Participating?</h3>
            <p className="text-gray-700 mb-6">
              Fill out this form with your contact information and preferred areas of involvement. 
              Our team will reach out within 3 business days.
            </p>

            {submitStatus === 'success' && (
              <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-900">Submission Successful</h4>
                  <p className="text-sm text-green-800">{statusMessage}</p>
                </div>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900">Submission Error</h4>
                  <p className="text-sm text-red-800">{statusMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  name="name"
                  placeholder="Full Name" 
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2\" style={{ '--tw-ring-color': '#00BFB3' } as any} 
                />
                <input 
                  type="email" 
                  name="email"
                  placeholder="Email Address" 
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2\" style={{ '--tw-ring-color': '#00BFB3' } as any} 
                />
              </div>
              <input 
                type="tel" 
                name="phone"
                placeholder="Phone Number" 
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2" style={{ '--tw-ring-color': '#00BFB3' } as any} 
              />
              <textarea 
                name="message"
                placeholder="Tell us how you'd like to get involved..." 
                rows={4} 
                value={formData.message}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2\" style={{ '--tw-ring-color': '#00BFB3' } as any}
              ></textarea>
              <button 
                type="submit" 
                disabled={isLoading}
                className={`px-6 py-3 font-semibold rounded-lg transition ${
                  isLoading 
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                    : 'text-white hover:opacity-90'
                }`}
                style={{ backgroundColor: isLoading ? undefined : '#00BFB3' }}
              >
                {isLoading ? 'Submitting...' : 'Send Application'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-gray-900 text-white py-12 mt-20"
      >
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">&copy; 2026 Liliw Tourism. Together Building Community.</p>
        </div>
      </motion.footer>
    </div>
  );
}
