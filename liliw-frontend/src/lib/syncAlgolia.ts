// Algolia sync is handled by /api/algolia/index (POST) which reads from Supabase CMS tables.
// This file is kept for import compatibility but the logic has moved to the API route.
export async function syncAlgolia(): Promise<number> {
  throw new Error('Use POST /api/algolia/index to sync Algolia from Supabase');
}
