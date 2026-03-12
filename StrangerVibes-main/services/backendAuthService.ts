// Backend API auth: phone + password
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/api';

const TOKEN_KEY = 'sv_backend_token';
const USER_KEY = 'sv_backend_user';

export interface BackendUser {
  id: string;
  uuid: string;
  phone: string;
  nickname: string;
  avatar: string;
  gender?: string;
  coin?: number;
  created_at?: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: BackendUser;
  token?: string;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<{ code: number; msg: string; data: T }> {
  const { token, ...init } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    return { code: -1, msg: '网络错误', data: null as unknown as T };
  }
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : { code: res.status, msg: '', data: null as unknown as T };
  } catch {
    return { code: -1, msg: '响应解析失败', data: null as unknown as T };
  }
}

export async function register(
  phone: string,
  password: string,
  nickname?: string,
  avatar?: string
): Promise<AuthResult> {
  const body = await apiFetch<{ user: BackendUser; token: string }>('/user/register', {
    method: 'POST',
    body: JSON.stringify({ phone, password, nickname, avatar }),
  });
  if (body.code !== 0) {
    return { success: false, message: body.msg || '注册失败' };
  }
  const data = body.data;
  if (!data || !data.user || !data.token) {
    return { success: false, message: body.msg || '注册失败，未返回token' };
  }
  const { user, token } = data;
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  return { success: true, message: '注册成功', user, token };
}

export async function login(phone: string, password: string): Promise<AuthResult> {
  const body = await apiFetch<{ user: BackendUser; token: string }>('/user/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  });
  if (body.code !== 0) {
    return { success: false, message: body.msg || '登录失败' };
  }
  const data = body.data;
  if (!data || !data.user || !data.token) {
    return { success: false, message: body.msg || '登录失败，未返回token' };
  }
  const { user, token } = data;
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  return { success: true, message: '登录成功', user, token };
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredUser(): Promise<BackendUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function signOut(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
