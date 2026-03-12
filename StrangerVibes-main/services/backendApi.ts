// Backend API client - calls Node.js chat-server
import { API_BASE_URL } from '@/constants/api';
import { getToken, signOut } from './backendAuthService';
import { notifyAuthInvalid } from './authInvalid';

export interface PersonalityStat {
  personality_type: string;
  usage_count: number;
  total_rating: number;
  rating_count: number;
  last_used_at: string | null;
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

interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

async function fetchApi<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<ApiResponse<T>> {
  const token = options.token ?? (await getToken());
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (e) {
    return { code: -1, msg: '网络错误', data: null as unknown as T };
  }
  let json: ApiResponse<T>;
  try {
    const text = await res.text();
    json = text ? JSON.parse(text) : { code: res.ok ? 0 : res.status, msg: '', data: null as unknown as T };
  } catch {
    return { code: -1, msg: '响应解析失败', data: null as unknown as T };
  }
  if (res.status === 401) {
    await signOut();
    notifyAuthInvalid();
  }
  return json;
}

export async function checkTodaySession(): Promise<{
  hasSelectedToday: boolean;
  todayPersonality: string | null;
  stats: PersonalityStat[];
  sessionDate: string;
} | null> {
  const body = await fetchApi<{
    hasSelectedToday: boolean;
    todayPersonality: string | null;
    stats: PersonalityStat[];
    sessionDate: string;
  }>('/personality/session', { method: 'GET' });
  if (body.code !== 0) return null;
  return body.data;
}

export async function selectPersonality(personality_type: string): Promise<{
  success: boolean;
  alreadySelected: boolean;
  stats: PersonalityStat[];
} | null> {
  const body = await fetchApi<{ success: boolean; alreadySelected: boolean; stats: PersonalityStat[] }>(
    '/personality/use',
    { method: 'POST', body: JSON.stringify({ personality_type }) }
  );
  if (body.code !== 0) return null;
  return body.data;
}

export async function getTodayMatches(): Promise<DailyMatchRecord[]> {
  const body = await fetchApi<{ matches: DailyMatchRecord[] }>('/match/today', { method: 'GET' });
  if (body.code !== 0) return [];
  return body.data?.matches ?? [];
}

export async function recordMatch(params: {
  matched_user_id: string;
  user_personality: string;
  matched_personality: string;
  matched_nickname: string;
  matched_avatar: string;
  last_message?: string;
}): Promise<{ success: boolean; matchId: string | null; isNew: boolean }> {
  const body = await fetchApi<{ success: boolean; matchId: string; isNew: boolean }>(
    '/match/record',
    { method: 'POST', body: JSON.stringify(params) }
  );
  if (body.code !== 0) return { success: false, matchId: null, isNew: false };
  return {
    success: body.data!.success,
    matchId: body.data!.matchId ?? null,
    isNew: body.data!.isNew,
  };
}

export async function matchStart(): Promise<{
  status: 'queued' | 'matched';
  sessionId?: number;
  matchedUser?: { id: string; nickname: string; avatar: string; personality: string; personalityKey: string; rating: number };
}> {
  const body = await fetchApi<{
    status: string;
    sessionId?: number;
    matchedUser?: { id: string; nickname: string; avatar: string; personality: string; personalityKey: string; rating: number };
  }>('/match/start', { method: 'POST', body: JSON.stringify({}) });
  if (body.code !== 0) return { status: 'queued' };
  const d = body.data!;
  return {
    status: (d.status as 'queued' | 'matched') || 'queued',
    sessionId: d.sessionId,
    matchedUser: d.matchedUser,
  };
}

export async function matchCancel(): Promise<void> {
  await fetchApi('/match/cancel', { method: 'POST', body: JSON.stringify({}) });
}

export async function ratePersonality(
  target_user_id: string,
  personality_type: string,
  rating: number
): Promise<boolean> {
  const body = await fetchApi<{ success: boolean }>('/personality/rate', {
    method: 'POST',
    body: JSON.stringify({ target_user_id, personality_type, rating }),
  });
  return body.code === 0 && (body.data?.success ?? false);
}

export async function getChatHistory(sessionId: string): Promise<Array<{ id: string; role: 'me' | 'them'; text: string; time: string; status: string }>> {
  const body = await fetchApi<Array<{ id: string; role: 'me' | 'them'; text: string; time: string; status: string }>>(
    `/chat/history?sessionId=${encodeURIComponent(sessionId)}`,
    { method: 'GET' }
  );
  if (body.code !== 0) return [];
  return Array.isArray(body.data) ? body.data : [];
}

export async function reportUser(
  target_user_id: string,
  session_id?: number | null,
  reason?: string
): Promise<boolean> {
  const body = await fetchApi<{ success: boolean }>('/report', {
    method: 'POST',
    body: JSON.stringify({ target_user_id, session_id: session_id ?? undefined, reason }),
  });
  return body.code === 0 && (body.data?.success ?? false);
}
