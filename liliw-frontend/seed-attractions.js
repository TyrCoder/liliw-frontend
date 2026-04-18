#!/usr/bin/env node

const axios = require('axios');

const strapiUrl = 'http://localhost:1337/api';
const token = '46061e8f19cec5028f41c9e08fa6875dca8a6a9e27a01201827457e584cad947f64f1be5ad420f6631fac2a20e5ba72001b36f6ba05a2a859e5b10d5afefc808c0478ce76bfcf234a9353d04ea775fc573ba55c5dfc5189c20c12e92325e8b4ee3a7d13660fe45a97ed42da571d37634e2571c6968a6b16c926b12108d92d7f7';

const api = axios.create({
  baseURL: strapiUrl,
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

// Sample heritage sites
const heritageSites = [
  {
    data: {
      name: 'Sto. Nino Church',
      description: 'A historic church established in the 17th century, featuring traditional Spanish colonial architecture and religious artifacts.',
      location: 'Poblacion, Liliw',
      category: 'Religious',
      rating: 4.5,
      phone: '+63 (2) 1234-5678',
      hours: '6:00 AM - 6:00 PM',
      website: 'https://stonino.example.com',
      best_for: 'Historical tours, photography',
      is_featured: true,
    },
  },
  {
    data: {
      name: 'Liliw Heritage Village',
      description: 'A preserved historical village showcasing traditional Filipino heritage and cultural practices.',
      location: 'San Vicente, Liliw',
      category: 'Cultural',
      rating: 4.3,
      phone: '+63 (2) 1234-5679',
      hours: '8:00 AM - 5:00 PM',
      website: 'https://heritagevillage.example.com',
      best_for: 'Cultural immersion, family outings',
      is_featured: true,
    },
  },
];

// Sample tourist spots
const touristSpots = [
  {
    data: {
      name: 'Laguna de Bay Viewpoint',
      description: 'A scenic overlook offering panoramic views of Laguna de Bay, perfect for sunset watching and photography.',
      location: 'Macabag, Liliw',
      category: 'Natural',
      rating: 4.7,
      phone: '+63 (2) 1234-5680',
      hours: '6:00 AM - 8:00 PM',
      website: 'https://laguna-viewpoint.example.com',
      best_for: 'Sunset viewing, photography, relaxation',
      is_featured: true,
    },
  },
  {
    data: {
      name: 'Marikina River Adventure Park',
      description: 'An adventure destination with water sports, hiking trails, and natural attractions along the scenic river.',
      location: 'Kawayanan, Liliw',
      category: 'Natural',
      rating: 4.6,
      phone: '+63 (2) 1234-5681',
      hours: '7:00 AM - 6:00 PM',
      website: 'https://river-adventure.example.com',
      best_for: 'Adventure activities, family fun, nature lovers',
      is_featured: true,
    },
  },
];

async function seedDatabase() {
  try {
    console.log('🌱 Seeding Strapi database...\n');

    // Add heritage sites
    console.log('📍 Adding heritage sites...');
    for (const site of heritageSites) {
      try {
        const response = await api.post('/heritage-sites', site);
        console.log(`✅ Created: ${response.data.data.attributes.name}`);
      } catch (error) {
        console.error(`❌ Failed to create heritage site:`, error.response?.data || error.message);
      }
    }

    console.log('\n🏞️  Adding tourist spots...');
    for (const spot of touristSpots) {
      try {
        const response = await api.post('/tourist-spots', spot);
        console.log(`✅ Created: ${response.data.data.attributes.name}`);
      } catch (error) {
        console.error(`❌ Failed to create tourist spot:`, error.response?.data || error.message);
      }
    }

    console.log('\n✨ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Seeding failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();
