import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * In-memory analytics storage (for demo purposes)
 * In production, this would be stored in a database like PostgreSQL
 */
const analyticsStore = {
  events: [] as any[],
  sessions: new Map<string, { startTime: number; endTime?: number; pageViews: number }>(),
};

// Cleanup old data every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  analyticsStore.events = analyticsStore.events.filter((e) => e.timestamp > oneHourAgo);
}, 3600000);

/**
 * POST /api/analytics/track
 * Receive and store analytics events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events, sessionId, sessionDuration, userAgent, timestamp } = body;

    // Validate input
    if (!events || !Array.isArray(events) || !sessionId) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Track session
    if (!analyticsStore.sessions.has(sessionId)) {
      analyticsStore.sessions.set(sessionId, {
        startTime: timestamp,
        pageViews: 0,
      });
    }

    // Store all events
    events.forEach((event: any) => {
      analyticsStore.events.push({
        ...event,
        sessionId,
        userAgent,
      });

      // Count page views
      if (event.eventName === 'page_view') {
        const session = analyticsStore.sessions.get(sessionId);
        if (session) {
          session.pageViews++;
        }
      }
    });

    // Update session end time
    const session = analyticsStore.sessions.get(sessionId);
    if (session) {
      session.endTime = timestamp + sessionDuration;
    }

    logger.info(`Analytics: Tracked ${events.length} events from session ${sessionId}`);

    return NextResponse.json({ success: true, stored: events.length });
  } catch (error) {
    logger.error('Analytics POST error:', error);
    return NextResponse.json({ error: 'Failed to track analytics' }, { status: 500 });
  }
}

/**
 * GET /api/analytics/track
 * Retrieve analytics summary
 */
export async function GET(request: NextRequest) {
  try {
    const oneHourAgo = Date.now() - 3600000;

    // Filter recent events (last hour)
    const recentEvents = analyticsStore.events.filter((e) => e.timestamp > oneHourAgo);

    // Calculate metrics
    const uniqueSessions = new Set(recentEvents.map((e) => e.sessionId)).size;
    const pageViewEvents = recentEvents.filter((e) => e.eventName === 'page_view');
    const pageViews = pageViewEvents.length;

    // Top pages
    const pageViewMap: Record<string, number> = {};
    pageViewEvents.forEach((e) => {
      const path = e.eventData.path || '/';
      pageViewMap[path] = (pageViewMap[path] || 0) + 1;
    });

    const topPages = Object.entries(pageViewMap)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Calculate bounce rate (sessions with only 1 page view)
    const bounceCount = Array.from(analyticsStore.sessions.values()).filter(
      (session) => session.pageViews <= 1
    ).length;
    const bounceRate = uniqueSessions > 0 ? Math.round((bounceCount / uniqueSessions) * 100) : 0;

    // Calculate average session time
    let totalSessionTime = 0;
    let sessionCount = 0;
    analyticsStore.sessions.forEach((session) => {
      if (session.endTime) {
        totalSessionTime += session.endTime - session.startTime;
        sessionCount++;
      }
    });
    const avgSessionSeconds = sessionCount > 0 ? Math.round(totalSessionTime / sessionCount / 1000) : 0;
    const avgSessionTime = `${Math.floor(avgSessionSeconds / 60)}m ${avgSessionSeconds % 60}s`;

    // Traffic sources (from referrer)
    const referrerMap: Record<string, number> = {};
    pageViewEvents.forEach((e) => {
      const referrer = e.eventData.referrer || 'Direct';
      let source = 'Direct';

      if (referrer.includes('google')) source = 'Google';
      else if (referrer.includes('facebook')) source = 'Facebook';
      else if (referrer.includes('instagram')) source = 'Instagram';
      else if (referrer.includes('twitter')) source = 'Twitter';

      referrerMap[source] = (referrerMap[source] || 0) + 1;
    });

    const referrers = Object.entries(referrerMap)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate total events
    const totalEvents = recentEvents.length;

    // Device types (from user agent)
    const deviceMap: Record<string, number> = {};
    recentEvents.forEach((e) => {
      const ua = e.userAgent || '';
      let device = 'Desktop';

      if (/mobile|android|iphone|ipad|windows phone/i.test(ua)) device = 'Mobile';
      if (/ipad|android(?!.*mobile)/i.test(ua)) device = 'Tablet';

      deviceMap[device] = (deviceMap[device] || 0) + 1;
    });

    const deviceTypes = Object.entries(deviceMap)
      .map(([type, count]) => ({
        type,
        percentage: totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // Return analytics summary
    return NextResponse.json({
      pageViews,
      uniqueVisitors: uniqueSessions,
      avgSessionTime,
      bounceRate: `${bounceRate}%`,
      topPages,
      referrers,
      deviceTypes,
      totalEvents,
      timeRange: 'Last 1 hour',
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Analytics GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
