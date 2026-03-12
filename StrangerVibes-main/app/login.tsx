// Powered by OnSpace.AI
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';
import { ThemedInput, GradientButton } from '@/components';
import { sendOTP, verifyOTP } from '@/services/authService';
import { register, login as backendLogin } from '@/services/backendAuthService';
import { USE_BACKEND_API } from '@/constants/api';
import { SPACING, RADIUS, FONT } from '@/constants/theme';

type LoginStep = 'phone' | 'otp' | 'password';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { showAlert } = useAlert();

  const [step, setStep] = useState<LoginStep>(USE_BACKEND_API ? 'password' : 'phone');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    setPhoneError('');
    if (!phone || phone.length !== 11) {
      setPhoneError('请输入11位手机号');
      return;
    }
    setLoading(true);
    const result = await sendOTP(phone);
    setLoading(false);
    if (result.success) {
      setStep('otp');
      startCountdown();
    } else {
      setPhoneError(result.message);
    }
  };

  const handlePasswordLogin = async () => {
    setPhoneError('');
    setPasswordError('');
    if (!phone || phone.length !== 11) {
      setPhoneError('请输入11位手机号');
      return;
    }
    if (!password || password.length < 6) {
      setPasswordError('密码至少6位');
      return;
    }
    setLoading(true);
    let result = await backendLogin(phone, password);
    if (!result.success) {
      const regResult = await register(phone, password, `用户${phone.slice(-4)}`);
      if (regResult.success) {
        result = regResult;
      } else if (regResult.message?.includes('已注册')) {
        result = { ...result, message: '手机号或密码错误' };
      } else {
        result = regResult;
      }
    }
    setLoading(false);
    if (result.success && result.user && result.token) {
      await login('phone', phone, result.user.id);
      router.replace('/personality');
    } else {
      setPasswordError(result.message || '登录失败');
    }
  };

  const handleVerifyOTP = async () => {
    setOtpError('');
    if (otp.length !== 6) {
      setOtpError('请输入6位验证码');
      return;
    }
    setLoading(true);
    const result = await verifyOTP(phone, otp);
    setLoading(false);
    if (result.success && result.userId) {
      await login('phone', phone, result.userId);
      router.replace('/personality');
    } else {
      setOtpError(result.message || '验证失败，请重试');
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    const result = await sendOTP(phone);
    setLoading(false);
    if (result.success) {
      startCountdown();
      showAlert('发送成功', '验证码已重新发送');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + SPACING.lg, paddingBottom: insets.bottom + SPACING.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroSection}>
          <Image
            source={require('@/assets/images/personality-hero.png')}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['transparent', '#080808']}
            style={styles.heroFade}
          />
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.appName}>StrangerVibes</Text>
          <Text style={styles.subtitle}>选择你的今日性格，遇见有趣的灵魂</Text>
        </View>

        {/* Login area */}
        <View style={styles.loginBox}>
          {step === 'password' && USE_BACKEND_API && (
            <>
              <Text style={styles.stepTitle}>手机号 + 密码</Text>
              <Text style={styles.stepDesc}>首次使用自动注册，密码至少6位</Text>
              <ThemedInput
                label="手机号"
                placeholder="请输入11位手机号"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={11}
                accentColor="#00B4D8"
                error={phoneError}
              />
              <ThemedInput
                label="密码"
                placeholder="请输入密码（至少6位）"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                accentColor="#00B4D8"
                error={passwordError}
              />
              <GradientButton
                label="登录 / 注册"
                onPress={handlePasswordLogin}
                gradient={['#0077B6', '#00B4D8']}
                loading={loading}
              />
            </>
          )}

          {step === 'phone' && !USE_BACKEND_API && (
            <>
              <Text style={styles.stepTitle}>手机号登录</Text>
              <Text style={styles.stepDesc}>首次登录自动注册账号，数据永久保存至服务器</Text>
              <ThemedInput
                label="手机号"
                placeholder="请输入11位手机号"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={11}
                accentColor="#00B4D8"
                error={phoneError}
              />
              <GradientButton
                label="获取验证码"
                onPress={handleSendOTP}
                gradient={['#0077B6', '#00B4D8']}
                loading={loading}
              />
              <Text style={styles.mockNote}>验证码任意6位数字均可 · 数据存储于服务器</Text>
            </>
          )}

          {step === 'otp' && (
            <>
              <Pressable style={styles.backBtn} onPress={() => setStep('phone')}>
                <MaterialIcons name="arrow-back" size={20} color="#aaa" />
                <Text style={styles.backText}>返回</Text>
              </Pressable>
              <Text style={styles.stepTitle}>输入验证码</Text>
              <Text style={styles.otpHint}>验证码已发送至 {phone}</Text>
              <ThemedInput
                label="验证码"
                placeholder="请输入6位验证码"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                accentColor="#00B4D8"
                error={otpError}
                rightElement={
                  <Pressable onPress={handleResend} disabled={countdown > 0 || loading}>
                    <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
                      {countdown > 0 ? `${countdown}s` : '重发'}
                    </Text>
                  </Pressable>
                }
              />
              <GradientButton
                label="登录 / 注册"
                onPress={handleVerifyOTP}
                gradient={['#0077B6', '#00B4D8']}
                loading={loading}
              />
            </>
          )}
        </View>

        <Text style={styles.terms}>登录即同意《用户协议》和《隐私政策》</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#080808' },
  container: {
    paddingHorizontal: SPACING.lg,
  },
  heroSection: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    alignSelf: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  titleSection: {
    marginBottom: SPACING.xl,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FONT.md,
    color: '#666',
    marginTop: SPACING.xs,
    lineHeight: 24,
  },
  loginBox: {
    backgroundColor: '#111',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  stepTitle: {
    color: '#fff',
    fontSize: FONT.xl,
    fontWeight: '700',
    marginBottom: 2,
  },
  stepDesc: {
    color: '#555',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  mockNote: {
    color: '#444',
    fontSize: 11,
    textAlign: 'center',
    marginTop: SPACING.xs,
    letterSpacing: 0.3,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.xs,
  },
  backText: {
    color: '#aaa',
    fontSize: FONT.sm,
  },
  otpHint: {
    color: '#666',
    fontSize: FONT.sm,
    marginBottom: SPACING.xs,
  },
  resendText: {
    color: '#00B4D8',
    fontSize: FONT.sm,
    fontWeight: '600',
  },
  resendDisabled: {
    color: '#444',
  },
  terms: {
    color: '#444',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
  },
});
