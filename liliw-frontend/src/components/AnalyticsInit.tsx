'use client';

import { useEffect } from 'react';
import analyticsTracker from '@/lib/analytics-tracker';

/**
 * Analytics Initializer Component
 * Initializes real-time analytics tracking across the app (Desktop-only)
 */
export default function AnalyticsInit() {
  useEffect(() => {
    // Initialize analytics tracking globally (only on client, desktop only)
    if (!analyticsTracker) return;

    // Check if device is desktop by looking at user agent
    const ua = navigator.userAgent.toLowerCase();
    const isDesktop = !/mobile|android|iphone|ipad|windows phone|tablet/i.test(ua);

    if (!isDesktop) {
      console.log('📱 Mobile/Tablet detected - Analytics tracking disabled');
      return;
    }

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && analyticsTracker) {
        analyticsTracker.flushEvents();
      }
    });

    // Track all click events
    document.addEventListener('click', (e) => {
      if (!analyticsTracker) return;
      
      const target = e.target as HTMLElement;
      const elementId = target.id || 'unknown';
      const elementName = target.textContent?.substring(0, 50) || 'unknown';
      
      // Only track meaningful clicks
      if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('button')) {
        analyticsTracker.trackClick(elementId, elementName);
      }
    });

    // Track form submissions
    document.addEventListener('submit', (e) => {
      if (!analyticsTracker) return;
      
      const form = e.target as HTMLFormElement;
      const formName = form.id || form.name || 'unknown-form';
      const fieldsCount = form.querySelectorAll('input, select, textarea').length;
      analyticsTracker.trackFormSubmit(formName, fieldsCount);
    });
  }, []);

  return null;
}
