// Powered by OnSpace.AI
// Auth Service: uses Supabase email-based auth
// Phone number → email (phone@sv.internal) for real backend sessions

import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();

function phoneToEmail(phone: string): string {
  return `${phone}@sv.internal`;
}

function phoneToPassword(phone: string): string {
  // Deterministic password derived from phone — never stored client-side
  return `SVibe_${phone}_2024!`;
}

// ── Send OTP (mock delay, real auth happens on verify) ────────────────
export async function sendOTP(phone: string): Promise<{ success: boolean; message: string }> {
  if (!phone || phone.length < 11) {
    return { success: false, message: '请输入有效的手机号' };
  }
  // Simulate SMS delay
  await delay(1000);
  return { success: true, message: '验证码已发送（任意6位数字均可）' };
}

// ── Verify OTP + create/sign in Supabase user ─────────────────────────
export async function verifyOTP(
  phone: string,
  code: string
): Promise<{ success: boolean; message: string; userId?: string }> {
  if (code.length !== 6) {
    return { success: false, message: '请输入6位验证码' };
  }
  // Any 6-digit code accepted (mock validation)
  const email = phoneToEmail(phone);
  const password = phoneToPassword(phone);

  // Try sign in first (returning user)
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInData?.session) {
    return { success: true, message: '登录成功', userId: signInData.user?.id };
  }

  // If sign-in fails (user doesn't exist yet), register
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { phone, nickname: `用户${phone.slice(-4)}` },
    },
  });

  if (signUpError) {
    console.error('SignUp error:', signUpError);
    return { success: false, message: signUpError.message };
  }

  if (signUpData?.user) {
    // Wait a moment for user_profiles trigger to run
    await delay(500);
    return { success: true, message: '注册成功', userId: signUpData.user.id };
  }

  return { success: false, message: '登录失败，请重试' };
}

// ── Sign out ─────────────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ── Get current session ──────────────────────────────────────────────
export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ── Mock WeChat (kept for UI compatibility) ───────────────────────────
export async function wechatLogin(): Promise<{ success: boolean; message: string }> {
  await delay(1000);
  return { success: false, message: '微信登录暂未开放' };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
