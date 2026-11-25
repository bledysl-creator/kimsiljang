import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** 키가 없으면 null → 앱은 '로컬 모드'(이 기기 브라우저에만 저장)로 동작해요. */
export const supabase: SupabaseClient | null = url && anon ? createClient(url, anon) : null;
export const isSupabaseReady = !!supabase;
