import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface SubmissionData {
  name: string;
  email: string;
  phone: string;
  message: string;
  type: 'feedback' | 'volunteer' | 'partnership';
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message, type } = body;

    // Validation
    if (!name || !email || !phone || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create submission payload for Strapi
    const submissionData = {
      data: {
        name,
        email,
        phone,
        message,
        type: type || 'feedback',
        status: 'new',
        timestamp: new Date().toISOString(),
      },
    };

    // Send to Strapi
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
    const strapiToken = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;

    if (!strapiUrl) {
      throw new Error('NEXT_PUBLIC_STRAPI_URL environment variable is not set');
    }

    const strapiResponse = await fetch(`${strapiUrl}/api/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${strapiToken}`,
      },
      body: JSON.stringify(submissionData),
    });

    if (!strapiResponse.ok) {
      console.error('Strapi error:', await strapiResponse.text());
      // Still return success to user even if Strapi fails, for better UX
      // Log will help debug
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Thank you for your submission! We will be in touch shortly.' 
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    );
  }
}
