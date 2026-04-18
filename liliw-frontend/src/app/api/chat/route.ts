import { NextRequest, NextResponse } from 'next/server';

// Simple AI responses for visitor support
const knowledgeBase = {
  attractions: {
    keywords: ['attraction', 'place', 'visit', 'see', 'where'],
    response:
      'We have amazing attractions! Visit /attractions to explore heritage sites, tourist spots, and cultural landmarks. Popular places include Tsinelas Craft Heritage and St. John the Baptist Church.',
  },
  tours: {
    keywords: ['tour', 'guide', 'booking', 'book', 'itinerary', 'package'],
    response:
      'Check out our tours and itineraries at /itineraries! We offer guided tours, heritage walks, and cultural experiences. You can book directly through our booking form.',
  },
  events: {
    keywords: ['event', 'news', 'happening', 'festival', 'celebration'],
    response:
      'Visit /news to see upcoming events and happenings in Liliw. We regularly update our calendar with cultural events and local celebrations.',
  },
  faq: {
    keywords: ['question', 'help', 'how', 'when', 'what', 'why', 'where'],
    response:
      'I can help! Have a look at our FAQ section at /faq for common questions. If you need more help, feel free to ask me anything about Liliw tourism.',
  },
  hours: {
    keywords: ['hours', 'open', 'close', 'time', 'operating'],
    response:
      'Most attractions are open 9 AM - 5 PM daily. Some heritage sites have specific hours. Check the individual attraction pages for exact times.',
  },
  contact: {
    keywords: ['contact', 'phone', 'email', 'reach', 'call'],
    response:
      'You can reach us through the contact form on our website. Check the footer for our phone number and email address. We respond within 24 hours!',
  },
};

interface ChatRequest {
  message: string;
}

function findResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Check each category for keyword matches
  for (const [key, data] of Object.entries(knowledgeBase)) {
    for (const keyword of data.keywords) {
      if (lowerMessage.includes(keyword)) {
        return data.response;
      }
    }
  }

  // Default response if no keywords match
  return `That's a great question! I'm here to help with information about Liliw tourism. You can also check our website for attractions (/attractions), tours (/itineraries), events (/news), or FAQs (/faq). What else would you like to know?`;
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

    // Get response from knowledge base
    const reply = findResponse(message);

    // Simulate slight delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      reply,
      timestamp: new Date().toISOString(),
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
    message: 'Chat API is running',
    endpoints: {
      POST: 'Submit a chat message with { message: string }',
    },
  });
}
