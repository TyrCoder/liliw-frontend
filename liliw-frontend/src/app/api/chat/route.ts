import { NextRequest, NextResponse } from 'next/server';

// Liliw-specific knowledge base - Only answers about Liliw tourism
const liliwKnowledgeBase = {
  greetings: {
    keywords: ['hello', 'hi', 'hey', 'magandang', 'araw', 'gabi', 'umaga'],
    response: 'Magandang araw! Welcome to Liliw! 🏝️ I\'m Lilio, your local guide. What would you like to know about our beautiful town?',
  },
  heritage: {
    keywords: ['heritage', 'tsinela', 'craft', 'history', 'cultural', 'tradition'],
    response: '🏛️ **Tsinelas Craft Heritage District** is our pride! It\'s a heritage area where skilled artisans craft traditional Filipino slippers (tsinelas). Perfect for visitors who want to experience authentic craftsmanship. Located in Footwear District, Liliw. Open 9 AM - 5 PM daily.',
  },
  church: {
    keywords: ['church', 'baptist', 'religious', 'spiritual', 'faith', 'prayer'],
    response: '⛪ **St. John the Baptist Church** is a historic Roman Catholic church in Liliw. It\'s an architectural gem and important pilgrimage site. Great for photography and experiencing local spiritual culture. A must-visit for heritage lovers!',
  },
  attractions: {
    keywords: ['attraction', 'place', 'visit', 'see', 'where', 'what to do', 'thing', 'spot', 'destination'],
    response: '🎯 **Popular Attractions in Liliw:**\n\n1. 🏛️ Tsinelas Craft Heritage District\n   - Watch artisans create handmade slippers\n   - Buy authentic Filipino footwear\n   \n2. ⛪ St. John the Baptist Church\n   - Historic architecture\n   - Beautiful interior design\n   \n3. 🌾 Local Markets\n   - Fresh produce & handicrafts\n   - Authentic Filipino experience\n   \n4. 🏞️ Liliw Town Center\n   - Cultural events & festivals\n   - Local dining & shopping\n\nWhich one interests you most?',
  },
  tours: {
    keywords: ['tour', 'guide', 'booking', 'book', 'itinerary', 'package', 'trip', 'travel'],
    response: '🎒 **Book a Tour with Us!**\n\nWe offer various tour packages:\n• Heritage Site Tours (2-3 hours)\n• Artisan Workshop Visits\n• Cultural Experience Tours\n• Full Day Liliw Exploration\n\nVisit our itineraries page to see all options and prices. Tours are led by local guides who know Liliw inside out!',
  },
  events: {
    keywords: ['event', 'news', 'happening', 'festival', 'celebration', 'celebration', 'fiesta', 'event', 'party'],
    response: '🎉 **Events & Celebrations in Liliw:**\n\nWe celebrate our local culture throughout the year:\n• Fiesta celebrations\n• Heritage festivals\n• Craft fairs\n• Cultural performances\n\nCheck our News & Events page for current happenings and schedules!',
  },
  restaurants: {
    keywords: ['restaurant', 'food', 'eat', 'dining', 'meal', 'lunch', 'dinner', 'cuisine', 'dish'],
    response: '🍽️ **Local Dining in Liliw:**\n\nEnjoy authentic Filipino cuisine at local eateries:\n• Traditional Filipino restaurants\n• Local specialty restaurants\n• Street food vendors\n• Cafes with local flavor\n\nVisitors love our local specialties and affordable meals. Ask around town for recommendations!',
  },
  accommodation: {
    keywords: ['hotel', 'stay', 'accommodation', 'room', 'resort', 'lodge', 'homestay', 'place to sleep', 'lodging'],
    response: '🏨 **Where to Stay in Liliw:**\n\nLiliw offers various accommodation options:\n• Budget-friendly hotels\n• Comfortable guesthouses\n• Local homestays\n• Family-run accommodations\n\nMost are within walking distance of major attractions. Check our website or contact us for current availability!',
  },
  hours: {
    keywords: ['hour', 'open', 'close', 'time', 'operating', 'schedule', 'when', 'availability'],
    response: '⏰ **Liliw Attraction Hours:**\n\n**General Hours:**\n• Most attractions: 9 AM - 5 PM\n• Weekends: 8 AM - 6 PM\n• Some shops: 6 AM - 8 PM\n\n**Closed:** Some attractions closed on Mondays\n\nBest time to visit: Early morning (less crowded) or late afternoon (beautiful light).',
  },
  contact: {
    keywords: ['contact', 'phone', 'email', 'reach', 'call', 'number', 'address', 'location'],
    response: '📞 **Contact Liliw Tourism:**\n\n📧 Email: info@liliwtourism.com\n📱 Phone: +63 (0)2 XXXX XXXX\n📍 Address: Liliw, Laguna, Philippines\n\nYou can also find us on:\n• Facebook: Liliw Tourism\n• Instagram: @liliewtravel\n• Website: liliwtourism.com\n\nHappy to help!',
  },
  location: {
    keywords: ['location', 'province', 'where', 'address', 'situated', 'distance', 'near', 'laguna'],
    response: '📍 **Liliw Location:**\n\nLiliw is a charming town in **Laguna Province**, Philippines.\n\n**Easy Access:**\n• 60 km southeast of Manila\n• 1.5 hours by car from Manila City\n• Near major highways\n• Close to Laguna Bay\n\nPerfect for day trips or weekend getaways from the metro!',
  },
  transport: {
    keywords: ['transport', 'travel', 'bus', 'car', 'taxi', 'ride', 'how to get', 'directions', 'drive'],
    response: '🚗 **Getting to Liliw:**\n\n**By Car:**\n• From Manila: Take South Luzon Expressway\n• ~1.5 hours drive\n• Parking available in town center\n\n**By Bus:**\n• Bus lines from Manila\n• Comfortable air-conditioned buses\n• Affordable fares\n\n**Local Transport:**\n• Tricycles for getting around town\n• Walking friendly town center\n• Bike rentals available',
  },
  artisans: {
    keywords: ['artisan', 'maker', 'craft', 'handmade', 'slipper', 'tsinela', 'worker', 'local'],
    response: '👩‍🏭 **Local Artisans of Liliw:**\n\nLiliw is famous for master artisans who:\n• Create handmade slippers (tsinelas)\n• Use traditional techniques passed down for generations\n• Work with quality materials\n• Customize orders\n\nVisit the Craft Heritage District to meet the artisans, see their workshops, and support local craftsmanship!',
  },
  shopping: {
    keywords: ['shop', 'shopping', 'buy', 'purchase', 'market', 'store', 'souvenir', 'gift'],
    response: '🛍️ **Shopping in Liliw:**\n\n**Must-Buy Items:**\n• 👟 Handmade tsinelas (slippers) - Our specialty!\n• 🎨 Local handicrafts\n• 🏺 Pottery & ceramics\n• 🎁 Souvenir items\n• 🍜 Local food products\n\nBest places: Heritage District shops, local markets, artisan workshops. Great prices and authentic quality!',
  },
  weather: {
    keywords: ['weather', 'climate', 'rain', 'season', 'temperature', 'best time'],
    response: '🌤️ **Liliw Weather:**\n\n**Best Time to Visit:**\n• November - March (Dry season)\n• Cool, pleasant weather\n• Clear skies\n• Perfect for sightseeing\n\n**Monsoon Season:**\n• June - September (Rainy)\n• Still visitable, fewer tourists\n• Bring umbrella/raincoat\n\n**Average Temperature:** 25-32°C year-round',
  },
};

interface ChatRequest {
  message: string;
}

function findLiliwResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Check each category for keyword matches
  for (const [key, data] of Object.entries(liliwKnowledgeBase)) {
    for (const keyword of data.keywords) {
      if (lowerMessage.includes(keyword)) {
        return data.response;
      }
    }
  }

  // If no Liliw-related keyword found, politely redirect
  return `🏝️ I appreciate your question, but I'm **Lilio**, **Liliw's official tour guide** - I only have knowledge about Liliw tourism and attractions!\n\nI can help with:\n✅ Heritage sites & attractions\n✅ Tours & bookings\n✅ Local dining & shopping\n✅ Events & celebrations\n✅ Travel tips for Liliw\n✅ Artisan workshops\n✅ Accommodation\n✅ How to get here\n\nPlease ask me something about visiting Liliw! 😊`;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      );
    }

    // Get Liliw-focused response from knowledge base
    const reply = findLiliwResponse(message);

    // Simulate slight delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 600));

    return NextResponse.json({
      success: true,
      reply,
      timestamp: new Date().toISOString(),
      source: 'Lilio - Liliw Tour Guide',
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

// GET handler for testing
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Lilio Chat API is running',
    guide: 'Lilio - Official Liliw Tour Guide',
    scope: 'Liliw tourism and attractions only',
    knowledge_areas: [
      'Heritage sites',
      'Tourist attractions',
      'Tours & bookings',
      'Local artisans',
      'Dining & shopping',
      'Events & celebrations',
      'Accommodation',
      'Transportation',
      'Travel tips'
    ],
    endpoints: {
      POST: 'Submit a chat message with { message: string }',
      GET: 'Get API status (this endpoint)',
    },
  });
}
