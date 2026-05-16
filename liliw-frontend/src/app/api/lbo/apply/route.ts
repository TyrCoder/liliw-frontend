import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Upload documents to Supabase Storage
    const files = formData.getAll('documents') as File[];
    const docUrls: { name: string; url: string }[] = [];

    for (const file of files) {
      if (!file || file.size === 0) continue;
      const buffer   = Buffer.from(await file.arrayBuffer());
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path     = `${Date.now()}-${safeName}`;

      const { data: uploaded, error } = await supabaseServer.storage
        .from('lbo-documents')
        .upload(path, buffer, { contentType: file.type, upsert: false });

      if (!error && uploaded) {
        const { data: urlData } = supabaseServer.storage.from('lbo-documents').getPublicUrl(path);
        if (urlData?.publicUrl) docUrls.push({ name: file.name, url: urlData.publicUrl });
      }
    }

    // Insert application row
    const { error: insertError } = await supabaseServer
      .from('lbo_applications')
      .insert({
        business_name:   formData.get('business_name')   as string,
        owner_name:      formData.get('owner_name')       as string,
        email:           formData.get('email')            as string,
        phone:           formData.get('phone')            as string,
        address:         formData.get('address')          as string,
        business_type:   formData.get('business_type')    as string | null,
        permit_number:   formData.get('permit_number')    as string | null,
        attraction_name: formData.get('attraction_name')  as string | null,
        status:          'pending',
        documents:       docUrls,
      });

    if (insertError) {
      return NextResponse.json({ error: 'Failed to submit application', detail: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 });
  }
}
