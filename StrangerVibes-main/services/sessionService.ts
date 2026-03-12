// Powered by OnSpace.AI
// Session Service: Supabase edge functions OR Node backend API
import { USE_BACKEND_API } from '@/constants/api';
import * as backendApi from './backendApi';
import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';

const supabase = getSupabaseClient();

// ── Get current session token ────────────────────────────────────────

async function getAuthHeader(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;
  return `Bearer ${session.access_token}`;
}

// ── Helpers ─────────────────────────────────────────────────────────

async function invokeFn<T>(
  name: string,
  options: { method?: string; body?: object } = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const authHeader = await getAuthHeader();
    if (!authHeader) return { data: null, error: 'Not authenticated' };

    const supabaseUrl = (supabase as any).supabaseUrl as string;
    const supabaseKey = (supabase as any).supabaseKey as string;

    const method = options.method ?? 'POST';
    const url = `${supabaseUrl}/functions/v1/${name}`;

    const headers: Record<string, string> = {
      'Authorization': authHeader,
      'apikey': supabaseKey,
      'Content-Type': 'application/json',
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };
    if (options.body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);
    const text = await response.text();

    if (!response.ok) {
      console.error(`invokeFn ${name} error [${response.status}]:`, text);
      return { data: null, error: text || `HTTP ${response.status}` };
    }

    const data = JSON.parse(text) as T;
    return { data, error: null };
  } catch (e) {
    console.error(`invokeFn ${name} exception:`, e);
    return { data: null, error: String(e) };
  }
}

// ── Types ────────────────────────────────────────────────────────────

export interface PersonalityStat {
  personality_type: string;
  usage_count: number;
  total_rating: number;
  rating_count: number;
  last_used_at: string;
}

export interface PersonalityRatingAggregate {
  personality_type: string;
  avg_rating: number;
  total_ratings: number;
  total_usage: number;
}

export interface DailyMatchRecord {
  id: string;
  chat_session_id?: number | null;
  matched_user_id: string;
  user_personality: string;
  matched_personality: string;
  matched_nickname: string;
  matched_avatar: string;
  last_message: string;
  last_message_at: string;
  created_at: string;
  session_date: string;
}

// ── Public personality rating aggregates (all users) ─────────────────

export async function getPersonalityRatingAggregates(): Promise<PersonalityRatingAggregate[]> {
  try {
    const { data, error } = await supabase.rpc('get_personality_rating_aggregates');
    if (error) {
      console.error('getPersonalityRatingAggregates error:', error);
      return [];
    }
    return (data ?? []) as PersonalityRatingAggregate[];
  } catch (e) {
    console.error('getPersonalityRatingAggregates exception:', e);
    return [];
  }
}

// ── Session: check today's personality selection ─────────────────────

export async function checkTodaySession(): Promise<{
  hasSelectedToday: boolean;
  todayPersonality: string | null;
  stats: PersonalityStat[];
  sessionDate: string;
} | null> {
  if (USE_BACKEND_API) return backendApi.checkTodaySession();
  return checkTodaySessionSupabase();
}

async function checkTodaySessionSupabase(): Promise<{
  hasSelectedToday: boolean;
  todayPersonality: string | null;
  stats: PersonalityStat[];
  sessionDate: string;
} | null> {
  const { data, error } = await invokeFn<{
    hasSelectedToday: boolean;
    todayPersonality: string | null;
    stats: PersonalityStat[];
    sessionDate: string;
  }>('select-personality', { method: 'GET' });
  return data;
}

// ── Personality: confirm selection for today ─────────────────────────

export async function selectPersonality(personality_type: string): Promise<{
  success: boolean;
  alreadySelected: boolean;
  stats: PersonalityStat[];
} | null> {
  if (USE_BACKEND_API) return backendApi.selectPersonality(personality_type);
  const { data } = await invokeFn<{
    success: boolean;
    alreadySelected: boolean;
    stats: PersonalityStat[];
  }>('select-personality', { method: 'POST', body: { personality_type } });
  return data ?? null;
}

// ── Matches: get today's chat list ───────────────────────────────────

export async function getTodayMatches(): Promise<DailyMatchRecord[]> {
  if (USE_BACKEND_API) return backendApi.getTodayMatches();
  const { data, error } = await invokeFn<{ matches: DailyMatchRecord[] }>(
    'get-daily-matches',
    { method: 'GET' }
  );
  if (error) {
    console.error('getTodayMatches error:', error);
    return [];
  }
  return data?.matches ?? [];
}

// ── Matches: record a new match ──────────────────────────────────────

export interface RecordMatchParams {
  matched_user_id: string;
  user_personality: string;
  matched_personality: string;
  matched_nickname: string;
  matched_avatar: string;
  last_message?: string;
}

export async function recordMatch(params: RecordMatchParams): Promise<{
  success: boolean;
  matchId: string | null;
  isNew: boolean;
}> {
  if (USE_BACKEND_API) return backendApi.recordMatch(params);
  console.log('recordMatch: calling edge function with params:', JSON.stringify(params));
  const { data, error } = await invokeFn<{ success: boolean; matchId: string; isNew: boolean }>(
    'record-match',
    { method: 'POST', body: params }
  );
  if (error) {
    console.error('recordMatch invokeFn error:', error);
    return { success: false, matchId: null, isNew: false };
  }
  console.log('recordMatch: response:', JSON.stringify(data));
  return { success: data?.success ?? false, matchId: data?.matchId ?? null, isNew: data?.isNew ?? false };
}

// ── Matches: update last message ─────────────────────────────────────

export async function updateMatchLastMessage(
  matched_user_id: string,
  user_personality: string,
  matched_personality: string,
  matched_nickname: string,
  matched_avatar: string,
  last_message: string
): Promise<void> {
  if (USE_BACKEND_API) {
    await backendApi.recordMatch({
      matched_user_id, user_personality, matched_personality, matched_nickname, matched_avatar, last_message,
    });
    return;
  }
  await invokeFn('record-match', {
    method: 'POST',
    body: {
      matched_user_id,
      user_personality,
      matched_personality,
      matched_nickname,
      matched_avatar,
      last_message,
    },
  });
}

// ── Rating: rate another user's personality ───────────────────────────

export async function ratePersonality(
  target_user_id: string,
  personality_type: string,
  rating: number
): Promise<boolean> {
  if (USE_BACKEND_API) return backendApi.ratePersonality(target_user_id, personality_type, rating);
  const { data, error } = await invokeFn<{ success: boolean }>('rate-personality', {
    method: 'POST',
    body: { target_user_id, personality_type, rating },
  });
  if (error) {
    console.error('ratePersonality error:', error);
    return false;
  }
  return data?.success ?? false;
}

// ── Report user ───────────────────────────────────────────────────────

export async function reportUser(
  target_user_id: string,
  session_id?: number | null,
  reason?: string
): Promise<boolean> {
  if (USE_BACKEND_API) return backendApi.reportUser(target_user_id, session_id, reason);
  return false;
}
