'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Gift, Loader2, X, CheckCircle, Clock, Copy, Globe, Building2 } from 'lucide-react';
import BadgeSVG from '@/components/BadgeSVG';
import { useAuth } from '@/context/AuthContext';

const HL = 'var(--font-heading), Outfit, sans-serif';
const DL = 'var(--font-display), "Cormorant Garamond", Georgia, serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

interface Reward {
  id: string; name: string; description: string; icon: string; badge_color: string;
  points_cost: number; stock: number | null; claim_type: 'irl' | 'online'; image_url?: string | null; alreadyClaimed?: boolean;
}
interface Redemption {
  id: string; reward_name: string; points_spent: number; redemption_code: string; claim_type: 'irl' | 'online'; image_url?: string | null;
  status: 'pending' | 'redeemed' | 'cancelled'; created_at: string; redeemed_at: string | null;
}

export default function RewardsPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const [rewards, setRewards]           = useState<Reward[]>([]);
  const [totalPoints, setTotalPoints]   = useState(0);
  const [redemptions, setRedemptions]   = useState<Redemption[]>([]);
  const [loadingData, setLoadingData]   = useState(true);
  const [redeemingId, setRedeemingId]   = useState<string | null>(null);
  const [error, setError]               = useState('');
  const [receipt, setReceipt]           = useState<Redemption | null>(null);
  const [copied, setCopied]             = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [user, loading, router]);

  const loadData = () => {
    if (!token) return;
    setLoadingData(true);
    Promise.all([
      fetch('/api/rewards', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/rewards/my-redemptions', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([rewardsRes, redemptionsRes]) => {
      setRewards(rewardsRes.data || []);
      setTotalPoints(rewardsRes.totalPoints || 0);
      setRedemptions(redemptionsRes.data || []);
    }).catch(() => {}).finally(() => setLoadingData(false));
  };

  useEffect(() => { loadData(); }, [token]);

  const handleRedeem = async (reward: Reward) => {
    setError('');
    setRedeemingId(reward.id);
    try {
      const res = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rewardId: reward.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to redeem'); return; }
      setReceipt(data.data);
      loadData();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setRedeemingId(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1565C0' }} /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="inline-flex items-center text-sm font-semibold mb-6 group" style={{ color: '#1565C0' }}>
          <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" /> Back
        </button>

        <div className="rounded-3xl p-6 sm:p-8 text-white mb-8 flex items-center justify-between flex-wrap gap-4"
          style={{ background: 'linear-gradient(135deg,#0B3D91,#1565C0)' }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1" style={{ fontFamily: HL }}>Your Balance</p>
            <p className="text-4xl font-black" style={{ color: '#F5C518', fontFamily: DL }}>{totalPoints} <span className="text-lg font-bold opacity-70">pts</span></p>
          </div>
          <div className="flex items-center gap-2 text-white/70 text-sm" style={{ fontFamily: BL }}>
            <Gift className="w-5 h-5" /> Redeem points for rewards from the Liliw Tourism Office
          </div>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">{error}</div>
        )}

        {loadingData ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#1565C0' }} /></div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#1A1A2E', fontFamily: HL }}>Available Rewards</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
              {rewards.map(r => {
                const canAfford = totalPoints >= r.points_cost;
                const outOfStock = r.claim_type !== 'online' && r.stock !== null && r.stock <= 0;
                const locked = r.claim_type === 'online' && r.alreadyClaimed;
                return (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col items-center text-center">
                    <span className={`mb-2 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      r.claim_type === 'online' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {r.claim_type === 'online' ? <><Globe className="w-2.5 h-2.5" /> ONLINE BADGE</> : <><Building2 className="w-2.5 h-2.5" /> IN-PERSON PICKUP</>}
                    </span>
                    {r.image_url ? (
                      <img src={r.image_url} alt={r.name} className="w-18 h-18 rounded-2xl object-cover border border-gray-200"
                        style={{ opacity: canAfford && !outOfStock && !locked ? 1 : 0.5 }} />
                    ) : (
                      <BadgeSVG icon={r.icon} color={r.badge_color} earned={canAfford && !outOfStock && !locked} size={72} />
                    )}
                    <p className="font-bold text-gray-900 mt-3" style={{ fontFamily: HL }}>{r.name}</p>
                    <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: BL }}>{r.description}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {r.claim_type === 'online' ? 'Unlimited · 1 per person' : r.stock !== null ? `${r.stock} left` : ''}
                    </p>
                    <button
                      onClick={() => handleRedeem(r)}
                      disabled={!canAfford || outOfStock || locked || redeemingId === r.id}
                      className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#1565C0', fontFamily: HL }}>
                      {redeemingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {locked ? 'Already Claimed' : outOfStock ? 'Out of Stock' : `${r.claim_type === 'online' ? 'Claim' : 'Redeem'} — ${r.points_cost} pts`}
                    </button>
                  </div>
                );
              })}
              {rewards.length === 0 && (
                <div className="col-span-3 text-center py-12 text-gray-400">
                  <Gift className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No rewards available yet</p>
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold mb-4" style={{ color: '#1A1A2E', fontFamily: HL }}>My Redemptions</h2>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {redemptions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="font-semibold">No redemptions yet</p>
                </div>
              ) : redemptions.map(rd => (
                <div key={rd.id} className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-50 last:border-0">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate" style={{ fontFamily: HL }}>{rd.reward_name}</p>
                    <p className="text-xs text-gray-400">
                      {rd.points_spent} pts · {new Date(rd.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                      rd.status === 'redeemed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {rd.status === 'redeemed' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {rd.status === 'redeemed' ? 'Redeemed' : 'Pending'}
                    </span>
                    <button onClick={() => setReceipt(rd)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition">
                      {rd.claim_type === 'online' ? 'View' : 'View Code'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Receipt modal */}
      <AnimatePresence>
        {receipt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6">
            <div className="absolute inset-0 bg-black/65 backdrop-blur-md" onClick={() => setReceipt(null)} />
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="p-6 text-center" style={{ background: 'linear-gradient(135deg,#0B3D91,#1565C0)' }}>
                <button onClick={() => setReceipt(null)} className="absolute top-4 right-4 text-white/50 hover:text-white transition"><X className="w-4 h-4" /></button>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#F5C518' }}>Liliw Tourism Office</p>
                <h3 className="text-xl font-black text-white" style={{ fontFamily: DL }}>{receipt.reward_name}</h3>
                <p className="text-white/60 text-xs mt-1">
                  {receipt.claim_type === 'online' ? 'Claimed instantly — no pickup needed' : 'Show this code at the Tourism Office to claim'}
                </p>
              </div>
              {receipt.claim_type === 'online' ? (
                <div className="p-8 flex flex-col items-center text-center">
                  {receipt.image_url ? (
                    <img src={receipt.image_url} alt={receipt.reward_name} className="w-20 h-20 rounded-2xl object-cover border border-gray-200 mb-4" />
                  ) : (
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg,#DBEAFE,#EFF6FF)' }}>
                      <CheckCircle className="w-8 h-8" style={{ color: '#1565C0' }} />
                    </div>
                  )}
                  <p className="font-bold text-gray-900" style={{ fontFamily: HL }}>Badge Claimed!</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {receipt.redeemed_at ? new Date(receipt.redeemed_at).toLocaleString('en-PH') : ''}
                  </p>
                </div>
              ) : (
                <div className="p-6 flex flex-col items-center">
                  {receipt.image_url && (
                    <img src={receipt.image_url} alt={receipt.reward_name} className="w-20 h-20 rounded-2xl object-cover border border-gray-200 mb-4" />
                  )}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(receipt.redemption_code)}`}
                    alt="Redemption QR code" className="w-44 h-44 mb-4" />
                  <button onClick={() => copyCode(receipt.redemption_code)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed font-black text-lg tracking-[0.15em]"
                    style={{ borderColor: '#F5C518', color: '#0B3D91', fontFamily: HL }}>
                    {receipt.redemption_code} <Copy className="w-4 h-4 opacity-50" />
                  </button>
                  {copied && <p className="text-xs text-green-600 font-semibold mt-2">Copied!</p>}
                  <div className={`mt-5 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    receipt.status === 'redeemed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {receipt.status === 'redeemed' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {receipt.status === 'redeemed' ? `Redeemed on ${receipt.redeemed_at ? new Date(receipt.redeemed_at).toLocaleDateString('en-PH') : ''}` : 'Not yet redeemed — one-time use'}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
