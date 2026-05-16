import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { sendNewApplicationNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Upload documents to Supabase Storage
    const files = formData.getAll('documents') as File[];
    const docUrls: { name: string; url: string }[] = [];
    const uploadErrors: string[] = [];

    for (const file of files) {
      if (!file || file.size === 0) continue;
      try {
        const buffer   = Buffer.from(await file.arrayBuffer());
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path     = `${Date.now()}-${safeName}`;

        const { data: uploaded, error: uploadErr } = await supabaseServer.storage
          .from('lbo-documents')
          .upload(path, buffer, { contentType: file.type, upsert: false });

        if (uploadErr) {
          uploadErrors.push(`${file.name}: ${uploadErr.message}`);
        } else if (uploaded) {
          const { data: urlData } = supabaseServer.storage.from('lbo-documents').getPublicUrl(path);
          if (urlData?.publicUrl) docUrls.push({ name: file.name, url: urlData.publicUrl });
        }
      } catch (fileErr: any) {
        uploadErrors.push(`${file.name}: ${fileErr.message}`);
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
      console.error('[LBO Apply] insert error:', insertError);
      return NextResponse.json({
        error: `Database error: ${insertError.message}`,
        hint: insertError.hint || null,
        uploadErrors: uploadErrors.length ? uploadErrors : undefined,
      }, { status: 500 });
    }

    // Send admin notification (fire-and-forget)
    sendNewApplicationNotification({
      business_name:   formData.get('business_name')   as string,
      owner_name:      formData.get('owner_name')       as string,
      email:           formData.get('email')            as string,
      phone:           formData.get('phone')            as string,
      address:         formData.get('address')          as string,
      business_type:   formData.get('business_type')    as string | undefined,
      permit_number:   formData.get('permit_number')    as string | undefined,
      attraction_name: formData.get('attraction_name')  as string | undefined,
    }).catch(err => console.error('[Email] new application:', err));

    return NextResponse.json({ success: true, uploadErrors: uploadErrors.length ? uploadErrors : undefined });
  } catch (e: any) {
    console.error('[LBO Apply] unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 });
  }
}
