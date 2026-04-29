/**
 * Real-time Analytics Tracker
 * Tracks user interactions and page views for real analytics
 * Desktop-only tracking (blocks mobile and tablets)
 */

/**
 * Detect device type
 */
function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof navigator === 'undefined') return 'desktop';

  const ua = navigator.userAgent.toLowerCase();

  // Check for mobile first (most specific)
  if (/mobile|android|iphone|windows phone/i.test(ua)) {
    return 'mobile';
  }

  // Check for tablet
  if (/ipad|android(?!.*mobile)|tablet/i.test(ua)) {
    return 'tablet';
  }

  return 'desktop';
}

/**
 * Check if tracking is enabled (desktop only)
 */
function isTrackingEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return getDeviceType() === 'desktop';
}

interface PageViewEvent {
  path: string;
  title: string;
  referrer: string;
  timestamp: number;
}

interface UserEvent {
  eventName: string;
  eventData: Record<string, any>;
  timestamp: number;
  sessionId: string;
}

class AnalyticsTracker {
  private sessionId: string;
  private sessionStartTime: number;
  private events: UserEvent[] = [];
  private pageViews: PageViewEvent[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = isTrackingEnabled();
    this.sessionId = this.getOrCreateSessionId();
    this.sessionStartTime = Date.now();
    
    if (this.isEnabled) {
      this.initPageViewTracking();
      console.log('✅ Desktop analytics tracking initialized');
    } else {
      console.log('⚠️ Analytics tracking disabled - Mobile/Tablet detected');
    }
  }

  /**
   * Get or create a unique session ID
   */
  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return 'ssr';
    
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Initialize automatic page view tracking
   */
  private initPageViewTracking(): void {
    if (typeof window === 'undefined' || !this.isEnabled) return;

    const trackPageView = () => {
      this.trackPageView({
        path: window.location.pathname,
        title: document.title,
        referrer: document.referrer,
      });
    };

    // Track initial page view
    trackPageView();

    // Track page changes (for SPA navigation)
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          trackPageView();
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['navigation'] });
    } catch (e) {
      // Fallback for browsers that don't support PerformanceObserver
    }
  }

  /**
   * Track a page view
   */
  trackPageView(data: Partial<PageViewEvent>): void {
    if (!this.isEnabled) return;

    const pageView: PageViewEvent = {
      path: data.path || '/',
      title: data.title || 'Unknown',
      referrer: data.referrer || '',
      timestamp: Date.now(),
    };

    this.pageViews.push(pageView);
    this.sendEvent('page_view', {
      path: pageView.path,
      title: pageView.title,
      referrer: pageView.referrer,
    });
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName: string, eventData: Record<string, any> = {}): void {
    if (!this.isEnabled) return;
    this.sendEvent(eventName, eventData);
  }

  /**
   * Track button click
   */
  trackClick(elementId: string, elementName: string): void {
    if (!this.isEnabled) return;
    this.sendEvent('click', {
      elementId,
      elementName,
    });
  }

  /**
   * Track search query
   */
  trackSearch(query: string, resultsCount: number): void {
    if (!this.isEnabled) return;
    this.sendEvent('search', {
      query,
      resultsCount,
    });
  }

  /**
   * Track attraction view
   */
  trackAttractionView(attractionId: string, attractionName: string, category: string): void {
    if (!this.isEnabled) return;
    this.sendEvent('attraction_view', {
      attractionId,
      attractionName,
      category,
    });
  }

  /**
   * Track chat interaction
   */
  trackChatMessage(messageLength: number, hasUserInput: boolean): void {
    if (!this.isEnabled) return;
    this.sendEvent('chat_message', {
      messageLength,
      hasUserInput,
    });
  }

  /**
   * Track form submission
   */
  trackFormSubmit(formName: string, fieldsCount: number): void {
    if (!this.isEnabled) return;
    this.sendEvent('form_submit', {
      formName,
      fieldsCount,
    });
  }

  /**
   * Send event to backend
   */
  private async sendEvent(eventName: string, eventData: Record<string, any>): Promise<void> {
    try {
      const event: UserEvent = {
        eventName,
        eventData,
        timestamp: Date.now(),
        sessionId: this.sessionId,
      };

      // Store in local array for batch sending
      this.events.push(event);

      // Send to backend (batch every 10 events or immediately)
      if (this.events.length >= 10) {
        await this.flushEvents();
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  /**
   * Flush pending events to backend
   */
  async flushEvents(): Promise<void> {
    if (!this.isEnabled || this.events.length === 0) return;

    try {
      const payload = {
        events: this.events,
        sessionId: this.sessionId,
        sessionDuration: Date.now() - this.sessionStartTime,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: Date.now(),
      };

      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      this.events = []; // Clear after successful send
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
    }
  }

  /**
   * Get current session metrics
   */
  getSessionMetrics() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    return {
      sessionId: this.sessionId,
      sessionDuration,
      pageViewsCount: this.pageViews.length,
      eventsCount: this.events.length,
      uniquePages: new Set(this.pageViews.map((pv) => pv.path)).size,
    };
  }

  /**
   * Get page view summary
   */
  getPageViewSummary() {
    const pageCounts: Record<string, number> = {};
    this.pageViews.forEach((pv) => {
      pageCounts[pv.path] = (pageCounts[pv.path] || 0) + 1;
    });
    return Object.entries(pageCounts)
      .map(([path, count]) => ({ path, views: count }))
      .sort((a, b) => b.views - a.views);
  }
}

// Create singleton instance
const analyticsTracker = typeof window !== 'undefined' ? new AnalyticsTracker() : null;

// Auto-flush on page unload
if (typeof window !== 'undefined' && analyticsTracker) {
  window.addEventListener('beforeunload', () => {
    analyticsTracker.flushEvents();
  });
}

export default analyticsTracker;
