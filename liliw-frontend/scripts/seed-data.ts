/**
 * Strapi Seed Data Script
 * Run: npx ts-node scripts/seed-data.ts
 * or from root: npm run seed
 */

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || 'your-api-token-here';

interface StrapiData {
  data: Record<string, any>;
}

async function seedData() {
  console.log('🌱 Starting Liliw database seeding...');

  // Tourist Spots Data
  const touristSpots = [
    {
      name: 'Pila Church of the Assumption',
      description: 'Historic colonial-era church built in 1622 featuring baroque architecture and intricate religious artwork.',
      location: 'Pila, Laguna',
      latitude: 14.3333,
      longitude: 121.2833,
      phone: '+63 49 501 2345',
      website: 'https://pilalaguna.gov.ph',
      bestFor: 'Heritage, Photography, Religious tours',
      category: 'Religious Heritage',
      rating: 4.7,
      images: [],
    },
    {
      name: 'Kawasan Falls',
      description: 'Stunning three-tiered waterfall with turquoise waters perfect for swimming and cliff jumping adventures.',
      location: 'Kawasan, Tanauan',
      latitude: 14.3167,
      longitude: 121.2667,
      phone: '+63 49 501 5678',
      website: 'https://www.kawasanfalls.ph',
      bestFor: 'Adventure, Swimming, Photography',
      category: 'Natural Attraction',
      rating: 4.8,
      images: [],
    },
    {
      name: 'Caliraya Lake',
      description: 'Mountain lake surrounded by lush greenery, ideal for water sports, kayaking, and scenic picnics.',
      location: 'Antipolo-Kalimaya Road',
      latitude: 14.3667,
      longitude: 121.3167,
      phone: '+63 49 501 9012',
      website: 'https://www.caliraya.ph',
      bestFor: 'Water sports, Kayaking, Relaxation',
      category: 'Nature',
      rating: 4.5,
      images: [],
    },
    {
      name: 'Nagcarlan Underground Cemetery',
      description: 'Famous limestone cave cemetery with elaborate tombs and historical significance from the Spanish colonial period.',
      location: 'Nagcarlan, Laguna',
      latitude: 14.2833,
      longitude: 121.5333,
      phone: '+63 49 501 3456',
      website: 'https://nagcarlan.gov.ph',
      bestFor: 'History, Cave exploration, Cultural tours',
      category: 'Historical',
      rating: 4.6,
      images: [],
    },
    {
      name: 'Santa Cruz Church',
      description: 'Magnificent 16th-century baroque church with intricate stone carvings and well-preserved colonial architecture.',
      location: 'Santa Cruz, Laguna',
      latitude: 14.1833,
      longitude: 121.35,
      phone: '+63 49 501 6789',
      website: 'https://santacruzlaguna.gov.ph',
      bestFor: 'Photography, Architecture, Religious tours',
      category: 'Religious Heritage',
      rating: 4.7,
      images: [],
    },
    {
      name: 'Mount Makiling',
      description: 'Sacred volcano with scenic trails, home to diverse flora and fauna, and spectacular sunset views.',
      location: 'Los Baños, Laguna',
      latitude: 14.15,
      longitude: 121.1833,
      phone: '+63 49 501 7890',
      website: 'https://uplb.edu.ph',
      bestFor: 'Hiking, Nature walks, Adventure',
      category: 'Nature',
      rating: 4.6,
      images: [],
    },
  ];

  // Heritage Sites Data
  const heritageSites = [
    {
      name: 'Spanish Colonial Houses of Liliw',
      description: 'Well-preserved Spanish colonial mansions showcasing traditional architecture with modern restorations.',
      location: 'Poblacion, Liliw',
      period: '1700s-1800s',
      architect: 'Spanish colonizers',
      heritage_value: 'High - UNESCO consideration',
      rating: 4.6,
      images: [],
    },
    {
      name: 'Saint James the Greater Church',
      description: 'Parish church of Liliw built during Spanish colonial times with elegant stone facade and bell tower.',
      location: 'San Santiago, Liliw',
      period: '1600s',
      architect: 'Spanish missionaries',
      heritage_value: 'Critical - Historical landmark',
      rating: 4.8,
      images: [],
    },
  ];

  // Events Data
  const events = [
    {
      title: 'Tsinelas Festival 2024',
      description: 'Annual celebration of Liliw heritage featuring traditional slipper-making, cultural performances, and artisan showcases.',
      date: '2024-05-15',
      location: 'Liliw Town Plaza',
      start_time: '08:00',
      end_time: '18:00',
      category: 'Festival',
      attendance: 5000,
      image: '',
    },
    {
      title: 'Heritage Walking Tour',
      description: 'Guided tour through historic Spanish colonial buildings and cultural landmarks with local historians.',
      date: '2024-06-01',
      location: 'Liliw Poblacion',
      start_time: '09:00',
      end_time: '12:00',
      category: 'Tour',
      attendance: 30,
      image: '',
    },
    {
      title: 'Farming & Cottage Industry Workshop',
      description: 'Learn traditional farming techniques and craft-making from local artisans. Hands-on experience included.',
      date: '2024-06-15',
      location: 'Liliw Agricultural Center',
      start_time: '10:00',
      end_time: '16:00',
      category: 'Workshop',
      attendance: 50,
      image: '',
    },
    {
      title: 'Laguna Art & Music Festival',
      description: 'Regional celebration showcasing local artists, musicians, and performers from surrounding municipalities.',
      date: '2024-07-10',
      location: 'Provincial Capitol Complex',
      start_time: '17:00',
      end_time: '22:00',
      category: 'Festival',
      attendance: 8000,
      image: '',
    },
    {
      title: 'Farm-to-Table Culinary Experience',
      description: 'Dinner event showcasing local Liliw produce and traditional recipes prepared by renowned chefs.',
      date: '2024-07-25',
      location: 'Liliw Cultural Center',
      start_time: '18:00',
      end_time: '21:00',
      category: 'Culinary',
      attendance: 100,
      image: '',
    },
  ];

  // FAQ Data
  const faqs = [
    {
      question: 'What is the best time to visit Liliw?',
      answer: 'The best time to visit Liliw is during the dry season (November to April) when weather is pleasant and festivals are happening. The Tsinelas Festival in May is also a great time to experience local culture.',
      category: 'Best Time to Visit',
    },
    {
      question: 'How do I get to Liliw from Manila?',
      answer: 'From Manila, take a bus from various terminals to Los Baños/Santa Cruz, Laguna (about 2-3 hours). From there, take a jeepney or taxi to Liliw (30-45 minutes). Alternatively, drive via the Maharlika Highway.',
      category: 'Transportation',
    },
    {
      question: 'Where can I buy authentic Liliw tsinelas?',
      answer: 'Visit local shops in the Poblacion area during the Tsinelas Festival. You can also order from certified local artisans through our tourism office or online platforms.',
      category: 'Shopping',
    },
    {
      question: 'Are there guided tours available?',
      answer: 'Yes! Contact the Liliw Tourism Office for heritage walks, farm tours, and cultural experiences. Private guides are also available through local agencies.',
      category: 'Tours & Activities',
    },
    {
      question: 'What are the accommodation options in Liliw?',
      answer: 'Liliw offers guesthouses, small hotels, and homestays. For more upscale options, nearby Los Baños and Santa Cruz have more resort-style accommodations.',
      category: 'Accommodation',
    },
  ];

  try {
    // Seed Tourist Spots
    console.log('📍 Adding tourist spots...');
    for (const spot of touristSpots) {
      await createRecord('tourist-spots', spot);
    }
    console.log(`✅ Added ${touristSpots.length} tourist spots`);

    // Seed Heritage Sites
    console.log('🏛️ Adding heritage sites...');
    for (const site of heritageSites) {
      await createRecord('heritage-sites', site);
    }
    console.log(`✅ Added ${heritageSites.length} heritage sites`);

    // Seed Events
    console.log('📅 Adding events...');
    for (const event of events) {
      await createRecord('events', event);
    }
    console.log(`✅ Added ${events.length} events`);

    // Seed FAQs
    console.log('❓ Adding FAQs...');
    for (const faq of faqs) {
      await createRecord('faqs', faq);
    }
    console.log(`✅ Added ${faqs.length} FAQs`);

    console.log('\n🌟 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

async function createRecord(collection: string, data: any) {
  try {
    const response = await fetch(`${STRAPI_URL}/api/${collection}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Error creating ${collection}:`, error);
    }
  } catch (error) {
    console.error(`Network error for ${collection}:`, error);
  }
}

// Run the seed
seedData();
