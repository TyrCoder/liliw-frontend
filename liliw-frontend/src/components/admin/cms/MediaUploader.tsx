'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

export interface MediaItem {
  url: string;
  public_id: string;
  alt_text: string;
}

interface Props {
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  maxFiles?: number;
}

async function uploadToCloudinary(file: File): Promise<MediaItem> {
  const timestamp = Math.floor(Date.now() / 1000);
  const signRes = await fetch('/api/cms/upload/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timestamp, folder: 'liliw-cms' }),
  });
  if (!signRes.ok) throw new Error('Failed to get upload signature');
  const { signature, api_key, cloud_name, folder } = await signRes.json();

  const form = new FormData();
  form.append('file', file);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('api_key', api_key);
  form.append('folder', folder);

  const upRes = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
    method: 'POST',
    body: form,
  });
  if (!upRes.ok) throw new Error('Upload failed');
  const data = await upRes.json();
  return { url: data.secure_url, public_id: data.public_id, alt_text: '' };
}

export default function MediaUploader({ value, onChange, maxFiles = 10 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = maxFiles - value.length;
    if (remaining <= 0) return;
    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    setError(null);
    try {
      const results = await Promise.all(toUpload.map(uploadToCloudinary));
      onChange([...value, ...results]);
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    }
    setUploading(false);
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      {/* Photo grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((item, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
              <img src={item.url} alt={item.alt_text || ''} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {value.length < maxFiles && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-500 hover:border-blue-300 hover:text-blue-600 transition disabled:opacity-60 w-full justify-center">
            {uploading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
              : <><Upload className="w-4 h-4" /> Add Photos ({value.length}/{maxFiles})</>}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
