'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Search, Check, Loader2, Images, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export interface CloudinaryAsset {
  public_id: string;
  url: string;
  name: string;
  width?: number;
  height?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (items: CloudinaryAsset[]) => void;
  folder?: string;
  multiple?: boolean;
  maxSelect?: number;
  signEndpoint?: string;
}

export default function CloudinaryPicker({
  open,
  onClose,
  onSelect,
  folder = 'liliw-cms',
  multiple = true,
  maxSelect,
  signEndpoint = '/api/cms/upload/sign',
}: Props) {
  const { token } = useAuth();
  const [assets, setAssets]           = useState<CloudinaryAsset[]>([]);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [loading, setLoading]         = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [uploadCount, setUploadCount] = useState('');
  const [search, setSearch]           = useState('');
  const [nextCursor, setNextCursor]   = useState<string | null>(null);
  const [isDragging, setIsDragging]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const authHeaders = (): HeadersInit =>
    token ? { Authorization: `Bearer ${token}` } : {};

  const loadAssets = async (reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ folder });
      if (!reset && nextCursor) params.set('next_cursor', nextCursor);
      const res  = await fetch(`/api/cloudinary-list?${params}`, { headers: authHeaders() });
      const data = await res.json();
      setAssets(prev => reset ? (data.resources ?? []) : [...prev, ...(data.resources ?? [])]);
      setNextCursor(data.next_cursor ?? null);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (!open) { setSelected(new Set()); setSearch(''); return; }
    setAssets([]);
    setNextCursor(null);
    loadAssets(true);
  }, [open, folder]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const uploadFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (!arr.length) return;
    setUploading(true);
    const newAssets: CloudinaryAsset[] = [];

    for (let i = 0; i < arr.length; i++) {
      setUploadCount(`${i + 1} / ${arr.length}`);
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const signRes = await fetch(signEndpoint, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body:    JSON.stringify({ timestamp, folder }),
        });
        if (!signRes.ok) continue;
        const { signature, api_key, cloud_name, folder: sf } = await signRes.json();

        const form = new FormData();
        form.append('file',      arr[i]);
        form.append('timestamp', String(timestamp));
        form.append('signature', signature);
        form.append('api_key',   api_key);
        form.append('folder',    sf ?? folder);

        const upRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
          { method: 'POST', body: form },
        );
        if (!upRes.ok) continue;
        const result = await upRes.json();
        newAssets.push({
          public_id: result.public_id,
          url:       result.secure_url,
          name:      arr[i].name.replace(/\.[^.]+$/, ''),
          width:     result.width,
          height:    result.height,
        });
      } catch {}
    }

    setUploading(false);
    setUploadCount('');
    if (newAssets.length) {
      setAssets(prev => [...newAssets, ...prev]);
      setSelected(prev => {
        const next = new Set(prev);
        newAssets.forEach(a => next.add(a.public_id));
        return next;
      });
    }
  };

  const toggleSelect = (asset: CloudinaryAsset) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(asset.public_id)) {
        next.delete(asset.public_id);
      } else {
        if (!multiple) { next.clear(); next.add(asset.public_id); return next; }
        if (maxSelect && next.size >= maxSelect) return prev;
        next.add(asset.public_id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const picked = assets.filter(a => selected.has(a.public_id));
    onSelect(picked);
    onClose();
  };

  const filtered = search.trim()
    ? assets.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.public_id.toLowerCase().includes(search.toLowerCase()),
      )
    : assets;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(10,20,50,0.7)', backdropFilter: 'blur(5px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden"
            style={{ maxHeight: '88vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
              <Images className="w-5 h-5 shrink-0" style={{ color: '#1565C0' }} />
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-900 text-sm leading-tight">Media Library</h2>
                <p className="text-xs text-gray-400 truncate">{folder}</p>
              </div>
              <button
                onClick={() => loadAssets(true)}
                disabled={loading}
                title="Refresh"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition disabled:opacity-40"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Upload dropzone */}
            <div className="px-6 pt-4 shrink-0">
              <div
                onDrop={e => { e.preventDefault(); setIsDragging(false); uploadFiles(e.dataTransfer.files); }}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                className="rounded-xl border-2 border-dashed transition-all"
                style={{
                  borderColor:     isDragging ? '#1565C0' : '#E5E7EB',
                  backgroundColor: isDragging ? '#EFF6FF' : '#F9FAFB',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files && uploadFiles(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 text-sm font-semibold transition disabled:opacity-60"
                  style={{ color: isDragging ? '#1565C0' : '#6B7280' }}
                >
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin text-blue-500" /> Uploading {uploadCount}…</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Click to upload or drag &amp; drop</>
                  )}
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-6 py-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                />
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-6 pb-2 min-h-0">
              {loading && assets.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#1565C0' }} />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Images className="w-10 h-10 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400 font-medium">
                    {search ? 'No assets match your search' : 'No assets yet — upload some above'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {filtered.map(asset => {
                      const isSel = selected.has(asset.public_id);
                      return (
                        <button
                          key={asset.public_id}
                          type="button"
                          title={asset.name}
                          onClick={() => toggleSelect(asset)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            isSel
                              ? 'border-blue-500 shadow-md'
                              : 'border-transparent hover:border-gray-300'
                          }`}
                          style={{ transform: isSel ? 'scale(0.94)' : undefined }}
                        >
                          <img
                            src={asset.url}
                            alt={asset.name}
                            className="w-full h-full object-cover bg-gray-100"
                            loading="lazy"
                          />
                          {isSel && (
                            <div className="absolute inset-0 flex items-center justify-center"
                              style={{ backgroundColor: 'rgba(21,101,192,0.25)' }}>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: '#1565C0' }}>
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {nextCursor && (
                    <button
                      type="button"
                      onClick={() => loadAssets(false)}
                      disabled={loading}
                      className="w-full mt-4 py-2 text-sm font-semibold transition disabled:opacity-50"
                      style={{ color: '#1565C0' }}
                    >
                      {loading
                        ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        : 'Load more'}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-4 shrink-0">
              <p className="text-sm text-gray-500">
                {selected.size > 0
                  ? <><strong className="text-gray-900">{selected.size}</strong> selected</>
                  : 'Click images to select'}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={selected.size === 0}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#1565C0' }}
                >
                  Add {selected.size > 0 ? selected.size : ''} {selected.size === 1 ? 'photo' : 'photos'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
