// lib/db.ts
// In-memory Maps are replaced by Supabase (see lib/supabase.ts).
// This file is kept as an empty stub so existing imports don't break
// during the transition. All auth routes now talk directly to Supabase.

export const registeredEmails = new Set<string>()
export const farmerDatabase = new Map<string, never>()
