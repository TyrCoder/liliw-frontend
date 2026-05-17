'use client';

import { useState, useEffect } from 'react';
import { Star, User, Calendar, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';

const HL = 'var(--font-heading), Outfit, sans-serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

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

export default function Ratings({ itemId, itemName }: RatingsProps) {
  const { user, token } = useAuth();
  const [userRating, setUserRating]       = useState(0);
  const [hoverRating, setHoverRating]     = useState(0);
  const [userComment, setUserComment]     = useState('');
  const [submitted, setSubmitted]         = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [validationMsg, setValidationMsg] = useState('');
  const [dbRatings, setDbRatings]         = useState<Rating[]>([]);
  const [loading, setLoading]             = useState(false);
  const [showAuth, setShowAuth]           = useState(false);

  const fetchReviews = () => {
    setLoading(true);
    fetch(`/api/strapi/reviews?itemId=${encodeURIComponent(itemId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.data) return;
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
  };

  useEffect(() => { fetchReviews(); }, [itemId]);

  const avgRating = dbRatings.length > 0
    ? (dbRatings.reduce((sum, r) => sum + r.rating, 0) / dbRatings.length).toFixed(1)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationMsg('');
    if (!token) { setValidationMsg('Please log in to submit a review.'); return; }
    if (userRating === 0) { setValidationMsg('Please select a star rating.'); return; }
    if (!userComment.trim()) { setValidationMsg('Please write a comment.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemId,
          itemName,
          author: user!.username,
          rating: userRating,
          comment: userComment.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setValidationMsg(err.error || 'Failed to submit. Please try again.');
        return;
      }
      setSubmitted(true);
      setUserRating(0);
      setUserComment('');
      fetchReviews();
      setTimeout(() => setSubmitted(false), 4000);
    } catch {
      setValidationMsg('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 py-6 border-t border-gray-100">
      <h3 className="text-2xl font-bold" style={{ color: '#1A1A2E', fontFamily: HL }}>Reviews</h3>

      {/* Average rating summary */}
      <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white">
        <div className="text-center px-4 border-r border-gray-100">
          <div className="text-4xl font-extrabold" style={{ color: '#0B3D91', fontFamily: HL }}>{avgRating}</div>
          <div className="flex gap-0.5 mt-1 justify-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={13}
                style={i < Math.round(Number(avgRating)) ? { fill: '#F5C518', color: '#F5C518' } : { color: '#d1d5db' }} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700" style={{ fontFamily: HL }}>
            {loading ? '…' : `${dbRatings.length} review${dbRatings.length !== 1 ? 's' : ''}`}
          </p>
          <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: BL }}>Based on visitor feedback</p>
        </div>
      </div>

      {/* Submit form — login required */}
      {!user ? (
        <div className="p-5 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 text-center">
          <LogIn className="w-6 h-6 mx-auto mb-2" style={{ color: '#1565C0' }} />
          <p className="text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: HL }}>Log in to leave a review</p>
          <p className="text-xs text-gray-400 mb-3" style={{ fontFamily: BL }}>Share your experience with other visitors</p>
          <button onClick={() => setShowAuth(true)}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
            style={{ backgroundColor: '#1565C0', fontFamily: BL }}>
            Log In
          </button>
          {showAuth && <AuthModal defaultTab="login" onClose={() => setShowAuth(false)} />}
        </div>
      ) : !submitted ? (
        <form onSubmit={handleSubmit} className="p-5 bg-gray-50 rounded-2xl space-y-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: '#1565C0', fontFamily: HL }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm font-semibold text-gray-700" style={{ fontFamily: HL }}>
              Posting as <span style={{ color: '#1565C0' }}>{user.username}</span>
            </p>
          </div>

          {/* Star selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2" style={{ fontFamily: HL }}>
              Your Rating
            </label>
            <div className="flex gap-1.5">
              {[1,2,3,4,5].map(num => (
                <button key={num} type="button"
                  onClick={() => setUserRating(num)}
                  onMouseEnter={() => setHoverRating(num)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110">
                  <Star size={28}
                    style={(hoverRating || userRating) >= num
                      ? { fill: '#F5C518', color: '#F5C518' }
                      : { color: '#d1d5db' }} />
                </button>
              ))}
            </div>
          </div>

          <textarea
            placeholder="Share your thoughts about this place…"
            value={userComment}
            onChange={e => setUserComment(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
            style={{ fontFamily: BL }}
          />

          {validationMsg && (
            <p className="text-sm text-red-500" style={{ fontFamily: BL }}>{validationMsg}</p>
          )}

          <button type="submit" disabled={submitting}
            className="px-6 py-2.5 rounded-xl font-bold text-white text-sm transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#1565C0', fontFamily: BL }}>
            {submitting ? 'Posting…' : 'Post Review'}
          </button>
        </form>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 text-green-700 rounded-2xl border border-green-200 text-sm font-semibold"
          style={{ fontFamily: BL }}>
          Thank you! Your review has been submitted.
        </motion.div>
      )}

      {/* Reviews list */}
      <div className="space-y-3">
        {dbRatings.length > 0 ? dbRatings.map((review, idx) => (
          <motion.div key={review.id || idx}
            initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-4 border border-gray-100 rounded-2xl bg-white hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: '#0B3D91', fontFamily: HL }}>
                  {review.author.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800 flex items-center gap-1.5" style={{ fontFamily: HL }}>
                    {review.author}
                    {review.verified && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold" style={{ fontFamily: HL }}>
                        Verified
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1" style={{ fontFamily: BL }}>
                    <Calendar size={10} />{review.date}
                  </p>
                </div>
              </div>
              <div className="flex gap-0.5 shrink-0">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13}
                    style={i < review.rating ? { fill: '#F5C518', color: '#F5C518' } : { color: '#e5e7eb' }} />
                ))}
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed pl-10" style={{ fontFamily: BL }}>{review.comment}</p>
          </motion.div>
        )) : (
          <p className="text-gray-400 text-sm text-center py-8" style={{ fontFamily: BL }}>
            No reviews yet. Be the first to share!
          </p>
        )}
      </div>
    </div>
  );
}
