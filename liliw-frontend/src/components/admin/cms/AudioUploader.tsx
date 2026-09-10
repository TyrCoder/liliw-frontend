'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2, Music } from 'lucide-react';

/**
 * One narration recording, uploaded from the CMS.
 *
 * Cloudinary handles audio through its video pipeline, so the endpoint is
 * /video/upload rather than /image/upload — the same account, the same signed
 * request, the same folder as every other upload. The signature comes from the
 * server, which checks the role first: Editors and Admins upload, Officers do
 * not, exactly as with photographs.
 *
 * What is stored on the story is the URL. The file itself never touches this
 * application or its database.
 */

const MAX_MB = 12;

async function uploadAudio(file: File): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);

  const signRes = await fetch('/api/cms/upload/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timestamp, folder: 'liliw-cms' }),
  });
  if (!signRes.ok) throw new Error('Could not start the upload. Please sign in again.');
  const { signature, api_key, cloud_name, folder } = await signRes.json();

  const form = new FormData();
  form.append('file', file);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('api_key', api_key);
  form.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`, {
    method: 'POST', body: form,
  });
  if (!res.ok) throw new Error('Cloudinary refused the file.');
  const data = await res.json();
  return data.secure_url as string;
}

export default function AudioUploader({
  value, onChange, label,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const handle = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    // Checked here rather than left to Cloudinary, so the person who picked
    // the wrong file is told which file and why, not shown a failed upload.
    if (!/^audio\//.test(file.type) && !/\.(mp3|m4a|wav|ogg)$/i.test(file.name)) {
      setError('That is not an audio file. Upload an MP3.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`That file is ${(file.size / 1048576).toFixed(1)}MB. The limit is ${MAX_MB}MB.`);
      return;
    }

    setError(null);
    setBusy(true);
    try {
      onChange(await uploadAudio(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
          <Music className="w-4 h-4 shrink-0" style={{ color: '#0B3D91' }} />
          {/* Playable in place: the only way to be sure the right recording
              was uploaded is to hear it before saving. */}
          <audio src={value} controls preload="none" className="h-8 flex-1 min-w-0" />
          <button type="button" onClick={() => onChange('')}
            title="Remove this recording"
            className="shrink-0 w-7 h-7 rounded-lg grid place-items-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => input.current?.click()} disabled={busy}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-3 py-4 text-sm font-semibold text-gray-500 hover:border-blue-300 hover:text-blue-700 transition disabled:opacity-60">
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                : <><Upload className="w-4 h-4" /> Upload {label ?? 'audio'}</>}
        </button>
      )}

      <input ref={input} type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg" hidden
        onChange={e => handle(e.target.files)} />

      {error && <p className="text-xs font-semibold text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}
