# Liliw Tourism — Security Recommendations

---

## Summary of Findings

| # | Issue | Severity |
|---|-------|----------|
| 1 | Strapi API token exposed in browser via `NEXT_PUBLIC_` prefix | Critical |
| 2 | No authentication checks on write API endpoints | Critical |
| 3 | No rate limiting on login / register routes (brute force risk) | High |
| 4 | No rate limiting across any API routes (spam / abuse risk) | High |
| 5 | No HTTP security headers (CSP, X-Frame-Options, etc.) | Medium |
| 6 | Admin access checked in UI only, not enforced in API layer | Medium |
| 7 | JWT token stored in `localStorage` (XSS vulnerable) | Medium |
| 8 | Unsanitized URL parameter in reviews proxy route | Medium |
| 9 | Sensitive GET endpoints (signups, submissions) have no auth | Medium |

---

## 1. Exposed Strapi API Token — CRITICAL

### Problem
`NEXT_PUBLIC_STRAPI_API_TOKEN` is prefixed with `NEXT_PUBLIC_`, which means Next.js
bundles it into the client-side JavaScript. Anyone can read it in browser DevTools
and make direct API calls to Strapi as if they were the server.

**Affected files (15+):** `src/lib/strapi.ts`, all `src/app/api/strapi/*.ts` routes,
`save-hotspots`, `save-virtual-tour-photos`, `ratings`, `bookings`, etc.

### Fix
1. Rename the env var in Vercel and locally: `NEXT_PUBLIC_STRAPI_API_TOKEN` → `STRAPI_API_TOKEN`
2. Update `src/lib/strapi.ts` to use `process.env.STRAPI_API_TOKEN` (no `NEXT_PUBLIC_`)
3. Only call this from server-side API routes — never from `'use client'` components
4. Rotate the Strapi API token immediately in the Strapi admin panel after renaming

```bash
# .env.local — rename this
STRAPI_API_TOKEN=your_token_here   # ← no NEXT_PUBLIC_ prefix
```

---

## 2. No Authentication on Write Endpoints — CRITICAL

### Problem
The following API routes accept `POST` requests and modify data with no auth check.
Anyone who discovers these routes can create, modify, or delete content.

| Route | Risk |
|---|---|
| `/api/save-hotspots` | Anyone can add/remove hotspots on any attraction |
| `/api/save-virtual-tour-photos` | Anyone can delete virtual tour photos |
| `/api/algolia/index` | Anyone can trigger a full Algolia re-index |
| `/api/analytics/track` | Anyone can poison analytics data |
| `/api/event-signup` GET | Anyone can enumerate all event signups |

### Fix
Add a JWT auth check at the top of each sensitive route:

```typescript
// Helper — add to src/lib/auth.ts
import { NextRequest } from 'next/server';

export function getTokenFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  return auth?.startsWith('Bearer ') ? auth.slice(7) : null;
}

export async function requireAuth(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return false;
  // Verify against Strapi
  const res = await fetch(`${process.env.STRAPI_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}
```

```typescript
// In each protected route
export async function POST(req: NextRequest) {
  const authed = await requireAuth(req);
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ... rest of handler
}
```

For admin-only routes (`save-hotspots`, `save-virtual-tour-photos`, `algolia/index`),
additionally check that the user's email is in `ADMIN_EMAILS`.

---

## 3. No Rate Limiting on Auth Routes — HIGH

### Problem
`/api/auth/login` and `/api/auth/register` have no rate limiting.
An attacker can make thousands of login attempts per second (brute force).

### Fix
Install `@upstash/ratelimit` (works on Vercel Edge / serverless) with a free
Upstash Redis account, or use a simple in-memory limiter for low traffic:

```typescript
// src/lib/ratelimit.ts — simple in-memory limiter (no external dependency)
const attempts = new Map<string, { count: number; reset: number }>();

export function checkRateLimit(ip: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.reset) {
    attempts.set(ip, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
```

```typescript
// In login/register route
const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
if (!checkRateLimit(ip, 5, 60_000)) {
  return NextResponse.json({ error: 'Too many attempts. Try again in 1 minute.' }, { status: 429 });
}
```

---

## 4. No HTTP Security Headers — MEDIUM

### Problem
`next.config.ts` has no security headers defined. Without these, the app is
vulnerable to clickjacking, MIME sniffing, and cross-site scripting.

### Fix
Add to `next.config.ts`:

```typescript
const securityHeaders = [
  { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",   // unsafe-eval needed by Three.js
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com",
      "connect-src 'self' https://api.cloudinary.com https://*.supabase.co https://render.com",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};
```

---

## 5. Admin Check in UI Layer Only — MEDIUM

### Problem
Admin-only pages (editor mode, hotspot saving) check `isAdmin` from `AuthContext`
on the frontend. This can be bypassed by any user who sets the right localStorage value.
The API routes themselves do not verify admin status.

### Fix
- `isAdmin` in the UI is fine for showing/hiding buttons
- The API routes (`save-hotspots`, `save-virtual-tour-photos`) must independently
  verify the user is an admin before processing the request
- Pass the JWT token from the client in the `Authorization` header
- On the server, verify the token with Strapi and check the user's email against
  the `ADMIN_EMAILS` env var before allowing the write

---

## 6. JWT Stored in localStorage — MEDIUM

### Problem
The JWT token is stored in `localStorage` (`liliw-jwt`). If any third-party script
or XSS vulnerability runs on the page, it can steal the token.

### Preferred Fix
Store the token in an `httpOnly` cookie instead. The browser cannot read `httpOnly`
cookies via JavaScript, making token theft much harder.

```typescript
// In /api/auth/login route — set cookie instead of returning token in body
response.cookies.set('liliw-token', jwt, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
});
```

> Note: This requires refactoring `AuthContext` to read the user from the cookie
> session rather than localStorage. Consider this a medium-term improvement.

---

## 7. Unsanitized URL Parameter — MEDIUM

### Problem
In `src/app/api/strapi/reviews/route.ts`, the `itemId` query parameter is
interpolated directly into a URL string without sanitization:

```typescript
// UNSAFE
const url = `${STRAPI}/api/reviews?filters[item_id][$eq]=${itemId}&populate=*`;
```

A malicious `itemId` like `1][$in][0]=1&filters[item_id][$in][1` could manipulate
the Strapi filter query.

### Fix
```typescript
// SAFE — encode the parameter
const url = itemId
  ? `${STRAPI}/api/reviews?filters[item_id][$eq]=${encodeURIComponent(itemId)}&populate=*`
  : `${STRAPI}/api/reviews?populate=*&pagination[limit]=500&sort=createdAt:desc`;
```

Apply `encodeURIComponent()` to any user-supplied value that goes into a URL.

---

## 8. Sensitive GET Endpoints Without Auth — MEDIUM

### Problem
`/api/event-signup` GET and `/api/admin/submissions` GET return lists of user
data (names, emails, signups) without any authentication. Anyone who knows the
URL can enumerate your users.

### Fix
Require a valid admin JWT on all `GET` endpoints that return user PII:

```typescript
export async function GET(req: NextRequest) {
  const authed = await requireAdminAuth(req); // check token + admin email
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ... return data
}
```

---

## Priority Order for Implementation

| Priority | Action |
|---|---|
| **Do first** | Rename `NEXT_PUBLIC_STRAPI_API_TOKEN` → `STRAPI_API_TOKEN` and rotate the token |
| **Do first** | Add auth checks to `save-hotspots` and `save-virtual-tour-photos` |
| **Do soon** | Add rate limiting to login and register routes |
| **Do soon** | Add security headers to `next.config.ts` |
| **Do soon** | Sanitize URL parameters with `encodeURIComponent()` |
| **Later** | Protect sensitive GET endpoints (signups, submissions) |
| **Later** | Move JWT from localStorage to httpOnly cookie |
| **Later** | Add auth checks to remaining write endpoints (ratings, bookings) |
