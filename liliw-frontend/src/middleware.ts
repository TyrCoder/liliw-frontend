import { NextRequest, NextResponse } from 'next/server';

const ADMIN_ROLES  = ['admin'];
const STAFF_ROLES  = ['admin', 'chatoofficer', 'chatoeditor'];

function getSessionRole(req: NextRequest): string | null {
  return req.cookies.get('liliw-session')?.value ?? null;
}

function hasAuthHeader(req: NextRequest): boolean {
  const auth = req.headers.get('Authorization');
  return !!(auth && auth.startsWith('Bearer ') && auth.length > 10);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Protect /api/admin/* routes ──
  // These must always carry a Bearer token — block requests without one.
  if (pathname.startsWith('/api/admin/')) {
    if (!hasAuthHeader(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ── Protect /admin page ──
  if (pathname.startsWith('/admin')) {
    const role = getSessionRole(req);
    if (!role || !STAFF_ROLES.includes(role)) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // ── Protect /lbo page ──
  if (pathname.startsWith('/lbo')) {
    const role = getSessionRole(req);
    if (!role) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/lbo/:path*', '/api/admin/:path*'],
};
