'use client';

import { useState, useEffect } from 'react';
import { Star, User, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [userName, setUserName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [dbRatings, setDbRatings] = useState<Rating[]>(ratings);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/reviews?filters[item_id][$eq]=${itemId}&populate=*`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_STRAPI_API_TOKEN}`,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const formattedReviews: Rating[] = data.data.map((review: any) => ({
            id: review.id,
            author: review.attributes.author,
            rating: review.attributes.rating,
            date: new Date(review.attributes.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
            }),
            comment: review.attributes.comment,
            verified: review.attributes.verified || false,
          }));
          setDbRatings(formattedReviews);
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        setDbRatings(ratings);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [itemId]);

  const displayRatings = dbRatings.length > 0 ? dbRatings : ratings;
  const avgRating = displayRatings.length > 0 
    ? (displayRatings.reduce((sum, r) => sum + r.rating, 0) / displayRatings.length).toFixed(1)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRating === 0 || !userName || !userComment) {
      alert('Please fill all fields');
      return;
    }

    try {
      await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          itemName,
          author: userName,
          rating: userRating,
          comment: userComment,
        }),
      });

      setSubmitted(true);
      setUserRating(0);
      setUserComment('');
      setUserName('');
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error('Rating submission error:', error);
    }
  };

  return (
    <div className="space-y-6 py-6 border-t border-gray-200">
      <div>
        <h3 className="text-2xl font-bold mb-4" style={{ color: '#0F1F3C' }}>Reviews</h3>

        {/* Average Rating */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg">
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: '#00BFB3' }}>{avgRating}</div>
            <div className="flex gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < Math.round(Number(avgRating)) ? 'fill-teal-500 text-teal-500' : 'text-gray-300'}
                  style={i < Math.round(Number(avgRating)) ? { fill: '#00BFB3', color: '#00BFB3' } : {}}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">{displayRatings.length} reviews</p>
            <p className="text-xs text-gray-500">Based on visitor feedback</p>
          </div>
        </div>

        {/* Submit Review Form */}
        {!submitted && (
          <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg space-y-4">
            <h4 className="font-semibold">Share Your Experience</h4>

            {/* Star Rating Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setUserRating(num)}
                    className="transition"
                  >
                    <Star
                      size={24}
                      className={userRating >= num ? 'fill-current' : ''}
                      style={userRating >= num ? { color: '#00BFB3', fill: '#00BFB3' } : { color: '#d1d5db' }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              style={{ borderColor: '#d1d5db' }}
            />

            <textarea
              placeholder="Share your thoughts..."
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              style={{ borderColor: '#d1d5db' }}
            />

            <button
              type="submit"
              className="px-6 py-2 rounded-lg font-semibold text-white"
              style={{ backgroundColor: '#00BFB3' }}
            >
              Post Review
            </button>
          </form>
        )}

        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-100 text-green-700 rounded-lg mb-8"
          >
            ✓ Thank you! Your review has been submitted.
          </motion.div>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {displayRatings.length > 0 ? (
            displayRatings.map((review, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      <User size={16} />
                      {review.author}
                      {review.verified && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Verified</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Calendar size={14} />
                      {review.date}
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < review.rating ? 'fill-current' : ''}
                        style={i < review.rating ? { color: '#00BFB3', fill: '#00BFB3' } : { color: '#d1d5db' }}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </motion.div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to share!</p>
          )}
        </div>
      </div>
    </div>
  );
}
