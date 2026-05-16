import { NextRequest, NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');

export async function GET(request: NextRequest) {
  const steps: Record<string, any> = {};

  // Step 1: Can we reach Strapi at all?
  try {
    const ping = await fetch(`${STRAPI}/api/users-permissions/roles`, {
      headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_API_TOKEN}` },
    });
    steps.strapi_reachable = { ok: ping.ok, status: ping.status };
  } catch (e: any) {
    steps.strapi_reachable = { ok: false, error: e.message };
  }

  // Step 2: Can we authenticate to the admin panel using env credentials?
  try {
    const adminAuth = await fetch(`${STRAPI}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:    process.env.STRAPI_ADMIN_EMAIL,
        password: process.env.STRAPI_ADMIN_PASSWORD,
      }),
    });
    const adminData = await adminAuth.json();
    steps.admin_auth = {
      ok: adminAuth.ok,
      status: adminAuth.status,
      has_token: !!adminData?.data?.token,
      user_email: adminData?.data?.user?.email,
    };
  } catch (e: any) {
    steps.admin_auth = { ok: false, error: e.message };
  }

  // Step 3: Is public registration enabled?
  try {
    const regTest = await fetch(`${STRAPI}/api/auth/local/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: '__debug_test__',
        email: `debug-test-${Date.now()}@test.invalid`,
        password: 'TestPassword123!',
      }),
    });
    const regData = await regTest.json().catch(() => ({}));
    steps.registration_enabled = {
      status: regTest.status,
      // 400 = validation error (enabled), 403 = disabled, 200 = success (we'll ignore the account)
      enabled: regTest.status !== 403,
      hint: regTest.status === 403 ? 'Public registration is DISABLED in Strapi' : 'Public registration is enabled',
    };
  } catch (e: any) {
    steps.registration_enabled = { ok: false, error: e.message };
  }

  return NextResponse.json({
    strapi_url: STRAPI,
    admin_email_configured: !!process.env.STRAPI_ADMIN_EMAIL,
    admin_password_configured: !!process.env.STRAPI_ADMIN_PASSWORD,
    steps,
  });
}
