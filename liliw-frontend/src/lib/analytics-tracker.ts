function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) return 'mobile';
  return 'desktop';
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = sessionStorage.getItem('liliw_sid');
  if (!id) {
    id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('liliw_sid', id);
  }
  return id;
}

export function trackPageView(path: string): void {
  if (typeof window === 'undefined') return;
  const sessionId = getOrCreateSessionId();
  const device    = getDeviceType();
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, sessionId, device }),
  }).catch(() => {});
}

// Singleton used by AnalyticsInit for auto page-view tracking
class AnalyticsTracker {
  private lastPath = '';

  init(): void {
    if (typeof window === 'undefined') return;
    this.send(window.location.pathname);

    // Track SPA navigations via popstate
    window.addEventListener('popstate', () => this.send(window.location.pathname));
  }

  private send(path: string): void {
    if (path === this.lastPath) return;
    this.lastPath = path;
    trackPageView(path);
  }

  // Legacy method stubs (kept so existing call sites don't error)
  trackEvent(_: string, __: Record<string, any> = {}): void {}
  trackClick(_: string, __: string): void {}
  trackSearch(_: string, __: number): void {}
  trackAttractionView(_: string, __: string, ___: string): void {}
  trackChatMessage(_: number, __: boolean): void {}
  trackFormSubmit(_: string, __: number): void {}
  flushEvents(): void {}
  getSessionMetrics() { return {}; }
}

const analyticsTracker = typeof window !== 'undefined' ? new AnalyticsTracker() : null;
export default analyticsTracker;
