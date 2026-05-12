'use client';

import { useState, useEffect } from 'react';
import { Star, User, Calendar, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

interface Rating {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  verified?: boolean;
}

interface RatingsProps {
  itemId: string;
  itemName: string;
  ratings?: Rating[];
}

export default function Ratings({ itemId, itemName, ratings = [] }: RatingsProps) {
  const { user } = useAuth();
  const [userRating, setUserRating]   = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [guestName, setGuestName]     = useState('');
  const [submitted, setSubmitted]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [validationMsg, setValidationMsg] = useState('');
  const [dbRatings, setDbRatings]     = useState<Rating[]>(ratings);
  const [loading, setLoading]         = useState(false);

  const authorName = user ? user.username : guestName;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/strapi/reviews?itemId=${encodeURIComponent(itemId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.data?.length) return;
        setDbRatings(data.data.map((review: any) => {
          const a = review.attributes || review;
          return {
            id: String(review.id),
            author: a.author || 'Anonymous',
            rating: a.rating,
            date: new Date(a.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
            comment: a.comment || '',
            verified: a.verified || false,
          };
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [itemId]);

  const displayRatings = dbRatings.length > 0 ? dbRatings : ratings;
  const avgRating = displayRatings.length > 0
    ? (displayRatings.reduce((sum, r) => sum + r.rating, 0) / displayRatings.length).toFixed(1)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationMsg('');
    if (userRating === 0) { setValidationMsg('Please select a star rating.'); return; }
    if (!authorName.trim()) { setValidationMsg('Please enter your name.'); return; }
    if (!userComment.trim()) { setValidationMsg('Please write a comment.'); return; }

    setSubmitting(true);
    try {
      await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, itemName, author: authorName.trim(), rating: userRating, comment: userComment.trim() }),
      });
      setSubmitted(true);
      setUserRating(0);
      setUserComment('');
      setGuestName('');
      setTimeout(() => setSubmitted(false), 4000);
    } catch {
      setValidationMsg('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 py-6 border-t border-gray-200">
      <h3 className="text-2xl font-bold" style={{ color: '#0F1F3C' }}>Reviews</h3>

      {/* Average rating summary */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl">
        <div className="text-center">
          <div className="text-3xl font-bold" style={{ color: '#00BFB3' }}>{avgRating}</div>
          <div className="flex gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14}
                style={i < Math.round(Number(avgRating)) ? { fill: '#00BFB3', color: '#00BFB3' } : { color: '#d1d5db' }} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600">{loading ? '…' : displayRatings.length} reviews</p>
          <p className="text-xs text-gray-400">Based on visitor feedback</p>
        </div>
      </div>

      {/* Submit form */}
      {!submitted ? (
        <form onSubmit={handleSubmit} className="p-5 bg-gray-50 rounded-xl space-y-4 border border-gray-100">
          <h4 className="font-semibold text-gray-800">Share Your Experience</h4>

          {/* Star selector */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Your Rating</label>
            <div className="flex gap-1.5">
              {[1,2,3,4,5].map(num => (
                <button key={num} type="button"
                  onClick={() => setUserRating(num)}
                  onMouseEnter={() => setHoverRating(num)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110">
                  <Star size={28}
                    style={(hoverRating || userRating) >= num
                      ? { fill: '#00BFB3', color: '#00BFB3' }
                      : { color: '#d1d5db' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Name — hidden for logged-in users */}
          {!user && (
            <input
              type="text"
              placeholder="Your name"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          )}
          {user && (
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" style={{ color: '#00BFB3' }} />
              Posting as <span className="font-semibold text-gray-700">{user.username}</span>
            </p>
          )}

          <textarea
            placeholder="Share your thoughts about this place…"
            value={userComment}
            onChange={e => setUserComment(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
          />

          {validationMsg && (
            <p className="text-sm text-red-600">{validationMsg}</p>
          )}

          <button type="submit" disabled={submitting}
            className="px-6 py-2.5 rounded-lg font-semibold text-white text-sm transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#00BFB3' }}>
            {submitting ? 'Posting…' : 'Post Review'}
          </button>
        </form>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 text-sm font-semibold">
          Thank you! Your review has been submitted.
        </motion.div>
      )}

      {/* Reviews list */}
      <div className="space-y-3">
        {displayRatings.length > 0 ? displayRatings.map((review, idx) => (
          <motion.div key={review.id || idx}
            initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-4 border border-gray-100 rounded-xl bg-white">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-sm text-gray-800 flex items-center gap-1.5">
                  <User size={14} className="text-gray-400" />
                  {review.author}
                  {review.verified && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Calendar size={11} />{review.date}
                </p>
              </div>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14}
                    style={i < review.rating ? { fill: '#00BFB3', color: '#00BFB3' } : { color: '#e5e7eb' }} />
                ))}
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
          </motion.div>
        )) : (
          <p className="text-gray-400 text-sm text-center py-8">No reviews yet. Be the first to share!</p>
        )}
      </div>
    </div>
  );
}
