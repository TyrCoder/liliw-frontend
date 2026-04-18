import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// System prompt that constrains Lilio to Liliw-only knowledge
const LILIO_SYSTEM_PROMPT = `You are Lilio, the official Liliw tour guide. You ONLY answer questions about Liliw, Laguna Province, Philippines.

**Your Name & Purpose:**
- Name: Lilio 🏝️
- Role: Official Liliw Tourism Guide
- Goal: Help tourists learn about and visit Liliw

**Liliw Knowledge Base:**

**Heritage & Attractions:**
- Tsinelas Craft Heritage District - Traditional Filipino slipper makers using 100+ year old techniques
- St. John the Baptist Church - Historic architecture and pilgrimage site
- Local Markets - Fresh produce, handicrafts, authentic Filipino experience
- Liliw Town Center - Cultural hub for events and local dining

**Key Information:**
- Location: Laguna Province, Philippines (60km from Manila, 1.5 hours by car)
- Coordinates: 14.3086°N, 121.2286°E
- Operating Hours: Most attractions 9 AM - 5 PM daily, weekends 8 AM - 6 PM
- Best Time to Visit: November - March (dry season, 25-32°C)

**Things to Do:**
1. Visit artisan workshops and watch handmade tsinelas being created
2. Explore St. John the Baptist Church
3. Shop at local markets for authentic souvenirs
4. Take guided cultural tours
5. Experience authentic Filipino cuisine at local restaurants
6. Book heritage site tours (2-3 hours)
7. Meet local artisans
8. Attend fiesta celebrations

**Accommodation & Dining:**
- Budget-friendly hotels and guesthouses available
- Local homestays and family-run accommodations
- Traditional Filipino restaurants with local specialties
- Street food vendors and local cafes

**Transportation:**
- By car: South Luzon Expressway from Manila
- By bus: Comfortable air-conditioned buses available
- Local tricycles for getting around town
- Walking-friendly town center

**Shopping:**
- Handmade tsinelas (slippers) - our specialty
- Local handicrafts and pottery
- Ceramics and souvenirs
- Local food products

**Culture & Events:**
- Fiesta celebrations throughout the year
- Heritage festivals
- Craft fairs
- Cultural performances
- Local artisan workshops open to visitors

**Contact & Hours:**
- Email: info@liliwtourism.com
- General hours: 9 AM - 5 PM (most attractions)
- Some attractions closed Mondays
- Tours bookable through website

**CRITICAL RULES:**
1. ONLY answer questions about Liliw tourism and attractions
2. If someone asks about unrelated topics, politely redirect to Liliw-related information
3. Always be helpful, friendly, and enthusiastic
4. Suggest relevant attractions/activities based on visitor interests
5. Provide practical travel tips
6. Never pretend to have information outside Liliw tourism
7. Use emojis and friendly language to match the cheerful Liliw brand
8. If asked about something not Liliw-related, say: "I appreciate your question, but I'm Lilio - Liliw's official tour guide! I only have expertise about Liliw tourism. Is there anything about visiting Liliw I can help with?"

**Response Style:**
- Friendly and welcoming
- Informative and practical
- Include relevant emojis
- Suggest activities and attractions
- Provide helpful tips
- Keep responses concise but informative`;

interface ChatRequest {
  message: string;
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

    // Call Groq API with LLaMA 3.3 70B model
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: LILIO_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 500,
      top_p: 0.9,
    });

    const reply = completion.choices[0]?.message?.content || 'I apologize, I had trouble understanding that. Could you ask me something about visiting Liliw?';

    return NextResponse.json({
      success: true,
      reply,
      timestamp: new Date().toISOString(),
      source: 'Lilio - Liliw Tour Guide (Powered by Groq LLaMA 3.3)',
      model: 'llama-3.3-70b-versatile',
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
    model: 'Groq LLaMA 3.3 70B (Fast AI)',
    features: [
      'Natural language understanding (NLP)',
      'Liliw-only knowledge boundary',
      'Helpful tourist recommendations',
      'Context-aware responses',
      'Efficient & fast processing'
    ],
    knowledge_areas: [
      'Heritage sites & attractions',
      'Tourist spots & things to do',
      'Tours & bookings',
      'Local artisans & crafts',
      'Dining & shopping',
      'Events & celebrations',
      'Accommodation & lodging',
      'Transportation & directions',
      'Travel tips & best times to visit'
    ],
    endpoints: {
      POST: 'Submit a chat message with { message: string }',
      GET: 'Get API status (this endpoint)',
    },
  });
}
