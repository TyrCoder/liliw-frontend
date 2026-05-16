'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, Building2, Upload, X, CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react';

const FIELDS = [
  { id: 'business_name',   label: 'Business Name',           type: 'text',     required: true,  placeholder: 'e.g. Arabela Resort' },
  { id: 'owner_name',      label: 'Owner / Representative',  type: 'text',     required: true,  placeholder: 'Full name' },
  { id: 'email',           label: 'Email Address',           type: 'email',    required: true,  placeholder: 'your@email.com' },
  { id: 'phone',           label: 'Contact Number',          type: 'tel',      required: true,  placeholder: '+63 9XX XXX XXXX' },
  { id: 'address',         label: 'Business Address',        type: 'textarea', required: true,  placeholder: 'Complete address in Liliw, Laguna' },
  { id: 'attraction_name', label: 'Attraction / Listing Name', type: 'text',   required: true,  placeholder: 'Name as it appears on the site' },
  { id: 'business_type',   label: 'Business Type',           type: 'text',     required: false, placeholder: 'e.g. Restaurant, Resort, Craft Shop' },
  { id: 'permit_number',   label: "Mayor's Permit / DTI No.", type: 'text',    required: false, placeholder: 'Business permit number' },
];

export default function LBOApplyPage() {
  const [form, setForm]         = useState<Record<string, string>>({});
  const [files, setFiles]       = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus]     = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (id: string, val: string) => setForm(f => ({ ...f, [id]: val }));

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = Array.from(incoming).filter(f => !files.find(e => e.name === f.name));
    setFiles(prev => [...prev, ...next]);
  };

  const removeFile = (name: string) => setFiles(prev => prev.filter(f => f.name !== name));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus('idle');

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    files.forEach(f => fd.append('documents', f));

    try {
      const res = await fetch('/api/lbo/apply', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
      } else {
        setErrorMsg(data.error || 'Submission failed. Please try again.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please check your connection.');
      setStatus('error');
    }
    setSubmitting(false);
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--warm-white)' }}>
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#E8F5E9' }}>
            <CheckCircle className="w-10 h-10" style={{ color: '#2E7D32' }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h1>
          <p className="text-gray-500 mb-2">Thank you for applying as a Local Business Owner on the Liliw Tourism website.</p>
          <p className="text-sm text-gray-400 mb-8">Our team will review your application and contact you at the email you provided. This usually takes 3–5 business days.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition hover:opacity-90"
            style={{ backgroundColor: '#1565C0' }}>
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--warm-white)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0B3D91 0%, #1565C0 100%)' }} className="py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Link href="/" className="inline-flex items-center text-sm font-semibold mb-6 opacity-80 hover:opacity-100 transition" style={{ color: '#00BFB3' }}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Liliw Tourism
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Local Business Owner Application</h1>
              <p className="text-blue-200 text-sm mt-1">Apply to manage your attraction listing on the Liliw Tourism website</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="max-w-2xl mx-auto px-4 mt-6">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
          <FileText className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-semibold mb-0.5">What happens after you apply?</p>
            <p className="text-blue-600">Our CHATO team will review your application and verify your documents. Once approved, you'll receive an account to access your LBO dashboard where you can submit change requests and monthly visitor records.</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Business Info section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-gray-900 text-base">Business Information</h2>

          {FIELDS.map(f => (
            <div key={f.id}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  required={f.required}
                  placeholder={f.placeholder}
                  value={form[f.id] || ''}
                  onChange={e => set(f.id, e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              ) : (
                <input
                  type={f.type}
                  required={f.required}
                  placeholder={f.placeholder}
                  value={form[f.id] || ''}
                  onChange={e => set(f.id, e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              )}
            </div>
          ))}
        </div>

        {/* Documents section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 text-base mb-1">Supporting Documents</h2>
          <p className="text-xs text-gray-400 mb-4">Upload your Mayor's Permit, DTI/SEC registration, valid ID, or any relevant documents (PDF, JPG, PNG)</p>

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition">
            <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-500">Click to upload or drag & drop</p>
            <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG up to 10MB each</p>
            <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={e => addFiles(e.target.files)} />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map(f => (
                <div key={f.name} className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-sm text-gray-700 flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                  <button type="button" onClick={() => removeFile(f.name)} className="text-gray-400 hover:text-red-500 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {status === 'error' && (
          <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={submitting}
          className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #0B3D91, #1565C0)', boxShadow: '0 4px 16px rgba(21,101,192,0.3)' }}>
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit Application'}
        </button>

        <p className="text-center text-xs text-gray-400 pb-8">
          Already have an account?{' '}
          <button type="button" className="font-semibold underline" style={{ color: '#1565C0' }}>
            Log in here
          </button>
        </p>
      </form>
    </div>
  );
}
