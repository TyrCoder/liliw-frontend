import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

export async function GET(request: NextRequest) {
  // The bearer token wins over the session cookie.
  //
  // The cookie used to be the fast path and was trusted first, which is wrong
  // whenever the two disagree: sign in as an admin, then sign in as a business
  // in the same browser, and the cookie still carried the previous email. This
  // route then looked that address up, found no approved application, and told
  // an approved owner their account had none — while the page printed their
  // real address in the message, because it reads that from the client.
  // The token is issued to the account making this request, so it is the
  // authority; the cookie stays as the fallback for cookie-only callers.
  let email: string | null = null;

  const userToken = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim();
  if (userToken) {
    try {
      const { data: { user } } = await supabaseServer.auth.getUser(userToken);
      email = user?.email ?? null;
    } catch {
      // Fall through to the cookie rather than failing outright — a Supabase
      // blip should not lock an owner out of their own dashboard.
    }
  }

  if (!email) {
    const cookie = request.cookies.get(SESSION_COOKIE)?.value;
    email = (cookie ? verifySession(cookie) : null)?.email ?? null;
  }

  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Look up approved LBO application in Supabase
  const { data, error } = await supabaseServer
    .from('lbo_applications')
    .select('*')
    .eq('email', email)
    .eq('status', 'approved')
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ isLbo: false }, { status: 403 });
  }

  return NextResponse.json({
    isLbo: true,
    application: {
      id:                     data.id,
      business_name:          data.business_name,
      owner_name:             data.owner_name,
      email:                  data.email,
      phone:                  data.phone,
      address:                data.address,
      attraction_name:        data.attraction_name,
      business_type:          data.business_type,
      category:               data.category ?? null,
      latitude:               data.latitude ?? null,
      longitude:              data.longitude ?? null,
      strapi_attraction_id:   data.strapi_attraction_id ?? null,
      strapi_attraction_type: data.strapi_attraction_type ?? null,
    },
    user: { email },
  });
}
