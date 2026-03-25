'use client';

import { useEffect, useState } from 'react';
import { getAllAttractions } from '@/lib/strapi';

interface Attraction {
  id: number;
  attributes: {
    name: string;
    description?: string;
    location?: string;
    category?: string;
    is_featured?: boolean;
    rating?: number;
  };
  type: 'heritage' | 'spot';
}

export default function AttractionsPage() {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllAttractions();
        setAttractions(data);
      } catch (err) {
        setError('Failed to load attractions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading attractions...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Liliw Attractions</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {attractions.map((attraction) => (
            <div
              key={attraction.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold">{attraction.attributes.name}</h2>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {attraction.type === 'heritage' ? 'Heritage' : 'Tourist Spot'}
                  </span>
                </div>

                {attraction.attributes.category && (
                  <p className="text-sm text-gray-600 mb-2">
                    Category: {attraction.attributes.category}
                  </p>
                )}

                {attraction.attributes.location && (
                  <p className="text-sm text-gray-600 mb-2">
                    📍 {attraction.attributes.location}
                  </p>
                )}

                {attraction.attributes.rating && (
                  <p className="text-sm text-yellow-600 mb-2">
                    ⭐ Rating: {attraction.attributes.rating}/5
                  </p>
                )}

                {attraction.attributes.description && (
                  <p className="text-gray-700 text-sm line-clamp-3">
                    {attraction.attributes.description}
                  </p>
                )}

                <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {attractions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No attractions found</p>
          </div>
        )}
      </div>
    </main>
  );
}
