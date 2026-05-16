import { NextRequest, NextResponse } from 'next/server';

const STRAPI = (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
const TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Upload documents to Strapi media library first
    const fileIds: number[] = [];
    const files = formData.getAll('documents') as File[];

    for (const file of files) {
      if (!file || file.size === 0) continue;
      const fd = new FormData();
      fd.append('files', file, file.name);
      const uploadRes = await fetch(`${STRAPI}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}` },
        body: fd,
      });
      if (uploadRes.ok) {
        const uploaded = await uploadRes.json();
        if (uploaded[0]?.id) fileIds.push(uploaded[0].id);
      }
    }

    // Create the application entry
    const body: any = {
      data: {
        business_name:  formData.get('business_name'),
        owner_name:     formData.get('owner_name'),
        email:          formData.get('email'),
        phone:          formData.get('phone'),
        address:        formData.get('address'),
        business_type:  formData.get('business_type'),
        permit_number:  formData.get('permit_number'),
        attraction_name:formData.get('attraction_name'),
        status:         'pending',
      },
    };

    if (fileIds.length > 0) {
      body.data.documents = fileIds;
    }

    const res = await fetch(`${STRAPI}/api/lbo-applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: 'Failed to submit application', detail: err }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 });
  }
}
