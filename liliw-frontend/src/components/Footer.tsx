'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Share2, MessageCircle, Send } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <footer className="mt-20 text-white" style={{ backgroundColor: '#0F1F3C' }}>
      {/* Main Footer Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12"
        >
          {/* About Liliw */}
          <motion.div variants={itemVariants}>
            <h3 className="text-2xl font-bold mb-4" style={{ color: '#00BFB3' }}>
              Liliw
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Discover the natural beauty, cultural heritage, and authentic traditions of Liliw, Laguna.
            </p>
            <p className="text-xs text-gray-400">
              Tourism | Heritage | Community
            </p>
          </motion.div>

          {/* Explore */}
          <motion.div variants={itemVariants}>
            <h4 className="font-bold mb-4" style={{ color: '#00BFB3' }}>
              Explore
            </h4>
            <nav className="space-y-2">
              {[
                { href: '/attractions', label: 'Attractions' },
                { href: '/heritage', label: 'Heritage Sites' },
                { href: '/culture', label: 'Culture & Traditions' },
                { href: '/itineraries', label: 'Tours & Itineraries' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-300 hover:opacity-80 transition text-sm block"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>

          {/* Resources */}
          <motion.div variants={itemVariants}>
            <h4 className="font-bold mb-4" style={{ color: '#00BFB3' }}>
              Resources
            </h4>
            <nav className="space-y-2">
              {[
                { href: '/news', label: 'News & Events' },
                { href: '/community', label: 'Community & Participate' },
                { href: '/faq', label: 'FAQ' },
                { href: '/about', label: 'About Liliw' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-300 hover:opacity-80 transition text-sm block"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>

          {/* Contact */}
          <motion.div variants={itemVariants}>
            <h4 className="font-bold mb-4" style={{ color: '#00BFB3' }}>
              Contact
            </h4>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start gap-3">
                <Phone size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#00BFB3' }} />
                <span>+63 (49) 501-1234</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#00BFB3' }} />
                <span>info@liliwtourism.com</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#00BFB3' }} />
                <span>Liliw, Laguna<br />Philippines 4002</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pt-8 border-t border-gray-700"
        >
          {/* Copyright */}
          <motion.div variants={itemVariants} className="text-sm text-gray-400">
            <p>
              &copy; {currentYear} Liliw Tourism. All rights reserved.
            </p>
            <p className="text-xs mt-1">
              Built with <span style={{ color: '#00BFB3' }}>♥</span> for the community
            </p>
          </motion.div>

          {/* Social Links */}
          <motion.div variants={itemVariants} className="flex gap-4">
            {[
              { icon: Share2, href: 'https://facebook.com/liliwtourism', label: 'Facebook' },
              { icon: MessageCircle, href: 'https://instagram.com/liliwtourism', label: 'Instagram' },
              { icon: Send, href: 'https://twitter.com/liliwtourism', label: 'Twitter' },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full transition hover:opacity-80"
                style={{ backgroundColor: 'rgba(0, 191, 179, 0.15)' }}
                title={social.label}
              >
                <social.icon size={18} style={{ color: '#00BFB3' }} />
              </a>
            ))}
          </motion.div>

          {/* Legal Links */}
          <motion.div variants={itemVariants} className="flex gap-4 text-xs text-gray-400">
            <Link href="#" className="hover:opacity-80 transition">
              Privacy Policy
            </Link>
            <span className="text-gray-600">•</span>
            <Link href="#" className="hover:opacity-80 transition">
              Terms of Service
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}
