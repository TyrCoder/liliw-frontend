'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Share2, MessageCircle, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const EXPLORE_LINKS = [
  { href: '/attractions', label: 'Attractions' },
  { href: '/heritage', label: 'Heritage Sites' },
  { href: '/culture', label: 'Culture & Traditions' },
  { href: '/arts', label: 'Arts & Creatives' },
  { href: '/itineraries', label: 'Tours & Itineraries' },
];

const RESOURCE_LINKS = [
  { href: '/news', label: 'News & Events' },
  { href: '/community', label: 'Community & Participate' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About Liliw' },
  { href: '/contact', label: 'Contact Us' },
];

const SOCIAL = [
  { icon: Share2, href: 'https://facebook.com/liliwtourism', label: 'Facebook' },
  { icon: MessageCircle, href: 'https://instagram.com/liliwtourism', label: 'Instagram' },
  { icon: Send, href: 'https://twitter.com/liliwtourism', label: 'Twitter' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  const openChat = () => {
    window.dispatchEvent(new CustomEvent('open-lilio-chat'));
  };

  return (
    <footer className="mt-20 text-white" style={{ backgroundColor: '#0F1F3C' }}>
      {/* Teal accent line */}
      <div
        style={{
          height: 2,
          background: 'linear-gradient(to right, transparent 0%, #00BFB3 40%, #00BFB3 60%, transparent 100%)',
          opacity: 0.6,
        }}
      />

      {/* Main grid */}
      <div className="max-w-6xl mx-auto px-4 pt-14 pb-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-14"
        >
          {/* Brand */}
          <motion.div variants={itemVariants}>
            <h3 className="text-2xl font-bold mb-1" style={{ color: '#00BFB3' }}>
              Liliw
            </h3>
            <div className="w-8 h-0.5 mb-4 rounded-full" style={{ backgroundColor: '#00BFB3', opacity: 0.5 }} />
            <p className="text-gray-300 text-sm leading-relaxed mb-5">
              Discover the natural beauty, cultural heritage, and authentic traditions of Liliw, Laguna.
            </p>
            <div className="flex gap-2 flex-wrap">
              {['Tourism', 'Heritage', 'Community'].map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: 'rgba(0,191,179,0.12)', color: '#00BFB3', border: '1px solid rgba(0,191,179,0.2)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Explore */}
          <motion.div variants={itemVariants}>
            <h4 className="font-bold mb-1 text-sm uppercase tracking-widest" style={{ color: '#00BFB3' }}>
              Explore
            </h4>
            <div className="w-5 h-0.5 mb-4 rounded-full" style={{ backgroundColor: '#00BFB3', opacity: 0.4 }} />
            <nav className="space-y-2.5">
              {EXPLORE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-400 hover:text-white transition-colors text-sm block group flex items-center gap-1.5"
                >
                  <span className="w-1 h-1 rounded-full flex-shrink-0 transition-all group-hover:w-2" style={{ backgroundColor: '#00BFB3', opacity: 0.5 }} />
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>

          {/* Resources */}
          <motion.div variants={itemVariants}>
            <h4 className="font-bold mb-1 text-sm uppercase tracking-widest" style={{ color: '#00BFB3' }}>
              Resources
            </h4>
            <div className="w-5 h-0.5 mb-4 rounded-full" style={{ backgroundColor: '#00BFB3', opacity: 0.4 }} />
            <nav className="space-y-2.5">
              {RESOURCE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-400 hover:text-white transition-colors text-sm block group flex items-center gap-1.5"
                >
                  <span className="w-1 h-1 rounded-full flex-shrink-0 transition-all group-hover:w-2" style={{ backgroundColor: '#00BFB3', opacity: 0.5 }} />
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>

          {/* Contact */}
          <motion.div variants={itemVariants}>
            <h4 className="font-bold mb-1 text-sm uppercase tracking-widest" style={{ color: '#00BFB3' }}>
              Contact
            </h4>
            <div className="w-5 h-0.5 mb-4 rounded-full" style={{ backgroundColor: '#00BFB3', opacity: 0.4 }} />
            <div className="space-y-3.5 text-sm text-gray-400">
              <div className="flex items-start gap-3 group">
                <div className="p-1.5 rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(0,191,179,0.1)' }}>
                  <Phone size={13} style={{ color: '#00BFB3' }} />
                </div>
                <span className="group-hover:text-white transition-colors">+63 (49) 501-1234</span>
              </div>
              <div className="flex items-start gap-3 group">
                <div className="p-1.5 rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(0,191,179,0.1)' }}>
                  <Mail size={13} style={{ color: '#00BFB3' }} />
                </div>
                <span className="group-hover:text-white transition-colors">info@liliwtourism.com</span>
              </div>
              <div className="flex items-start gap-3 group">
                <div className="p-1.5 rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(0,191,179,0.1)' }}>
                  <MapPin size={13} style={{ color: '#00BFB3' }} />
                </div>
                <span className="group-hover:text-white transition-colors">
                  Liliw, Laguna<br />Philippines 4002
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom bar */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 pt-6 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          {/* Copyright */}
          <motion.p variants={itemVariants} className="text-sm text-gray-500">
            &copy; {year} Liliw Tourism. All rights reserved.
          </motion.p>

          {/* Lilio Chat — centered CTA */}
          <motion.button
            variants={itemVariants}
            onClick={openChat}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-opacity hover:opacity-90 shadow-lg"
            style={{ backgroundColor: '#00BFB3', color: '#0F1F3C', boxShadow: '0 0 20px rgba(0,191,179,0.25)' }}
          >
            <MessageCircle size={16} />
            Chat with Lilio
          </motion.button>

          {/* Social + Legal */}
          <motion.div variants={itemVariants} className="flex items-center gap-5">
            <div className="flex gap-2">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.label}
                  className="p-2 rounded-full transition hover:opacity-80"
                  style={{ backgroundColor: 'rgba(0,191,179,0.12)', border: '1px solid rgba(0,191,179,0.15)' }}
                >
                  <s.icon size={15} style={{ color: '#00BFB3' }} />
                </a>
              ))}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <Link href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
              <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
              <Link href="#" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}
