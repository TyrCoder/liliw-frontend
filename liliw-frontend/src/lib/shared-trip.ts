import { supabaseServer } from './supabase-server';

export interface SharedTripStop { time: string; place: string; activity: string; duration: string; tip: string; }
export interface SharedTripDay  { day: number; theme: string; stops: SharedTripStop[]; }
export interface SharedTripPlan { title: string; summary: string; days: SharedTripDay[]; tips: string[]; estimatedCostPerDay: string; }
export interface SharedTrip {
  id: string;
  title: string;
  plan: SharedTripPlan;
  duration: string;
  budget: string;
  savedAt: string;
}

/**
 * Fetches a saved trip for public display. Returns null unless the trip exists
 * and its owner has opted into sharing (is_public = true) — the single gate
 * that both the JSON API and the page's server-rendered metadata rely on, so a
 * private or unknown trip can never leak through either path. user_id is never
 * selected, so the owner stays anonymous.
 */
export async function getSharedTrip(id: string): Promise<SharedTrip | null> {
  if (!id) return null;
  const { data, error } = await supabaseServer
    .from('saved_itineraries')
    .select('id, title, plan, duration, budget, saved_at')
    .eq('id', id)
    .eq('is_public', true)
    .maybeSingle();

  if (error) {
    console.error('[shared-trip]', error.code, error.message);
    return null;
  }
  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    plan: data.plan,
    duration: data.duration,
    budget: data.budget,
    savedAt: data.saved_at,
  };
}
