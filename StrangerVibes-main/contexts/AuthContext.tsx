// Powered by OnSpace.AI
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient } from '@/template';
import {
  PersonalityType,
  FREE_PERSONALITIES,
  PREMIUM_PERSONALITIES,
  PERSONALITY_THEMES,
  ACHIEVEMENTS,
} from '@/constants/theme';
import {
  checkTodaySession,
  selectPersonality as selectPersonalityAPI,
  PersonalityStat,
} from '@/services/sessionService';
import { signOut } from '@/services/authService';
import { signOut as backendSignOut, getStoredUser } from '@/services/backendAuthService';
import { setAuthInvalidListener } from '@/services/authInvalid';
import { USE_BACKEND_API } from '@/constants/api';

export interface User {
  id: string;
  phone?: string;
  email?: string;
  nickname: string;
  avatar: string;
  loginMethod: 'phone';
  // Part A — synced from backend personality_stats
  personalityUsage: Record<PersonalityType, number>;
  personalityRatings: Record<PersonalityType, number>;
  // Current session
  currentPersonality?: PersonalityType;
  // Local-only premium unlock
  unlockedPremium: PersonalityType[];
  // Achievement tracking
  consecutiveStreak: { personality: PersonalityType; count: number };
  achievements: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  isAuthenticated: boolean;
  login: (method: 'phone', phone: string, userId: string) => Promise<void>;
  logout: () => Promise<void>;
  setPersonality: (type: PersonalityType) => Promise<void>;
  unlockPremium: (type: PersonalityType) => Promise<void>;
  isPremiumUnlocked: (type: PersonalityType) => boolean;
  getCurrentAchievement: () => { label: string; icon: string; color: string } | null;
  refreshStats: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Helpers ──────────────────────────────────────────────────────────

function buildUsageFromStats(stats: PersonalityStat[]): Record<PersonalityType, number> {
  const all = [...FREE_PERSONALITIES, ...PREMIUM_PERSONALITIES] as PersonalityType[];
  const result: Record<string, number> = {};
  all.forEach((p) => { result[p] = 0; });
  stats.forEach((s) => { result[s.personality_type] = s.usage_count; });
  return result as Record<PersonalityType, number>;
}

function buildRatingsFromStats(stats: PersonalityStat[]): Record<PersonalityType, number> {
  const all = [...FREE_PERSONALITIES, ...PREMIUM_PERSONALITIES] as PersonalityType[];
  const result: Record<string, number> = {};
  // Default: 0 means no rating yet (shown as "暂无评分")
  all.forEach((p) => { result[p] = 0; });
  stats.forEach((s) => {
    if (s.rating_count > 0) {
      result[s.personality_type] = parseFloat((s.total_rating / s.rating_count).toFixed(1));
    }
  });
  return result as Record<PersonalityType, number>;
}

function buildDefaultUsage(): Record<PersonalityType, number> {
  const all = [...FREE_PERSONALITIES, ...PREMIUM_PERSONALITIES] as PersonalityType[];
  const result: Record<string, number> = {};
  all.forEach((p) => { result[p] = 0; });
  return result as Record<PersonalityType, number>;
}

function buildDefaultRatings(): Record<PersonalityType, number> {
  const all = [...FREE_PERSONALITIES, ...PREMIUM_PERSONALITIES] as PersonalityType[];
  const result: Record<string, number> = {};
  all.forEach((p) => { result[p] = 0; });
  return result as Record<PersonalityType, number>;
}

// ── Provider ─────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    setAuthInvalidListener(() => setUser(null));
    return () => setAuthInvalidListener(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        if (USE_BACKEND_API) {
          const backendUser = await getStoredUser();
          if (backendUser) {
            await loadUserFromSession(backendUser.id);
          }
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await loadUserFromSession(session.user.id, session.user.email);
          }
        }
      } catch (e) {
        console.error('Auth init error:', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();

    if (!USE_BACKEND_API) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserFromSession(session.user.id, session.user.email);
        } else if (event === 'SIGNED_OUT') {
          if (mounted) setUser(null);
        }
      });
      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }
    return () => { mounted = false; };
  }, []);

  const loadUserFromSession = async (userId: string, email?: string | null) => {
    try {
      const cached = await AsyncStorage.getItem(`sv_user_${userId}`);
      let localUser: User | null = cached ? JSON.parse(cached) : null;

      if (USE_BACKEND_API) {
        const backendUser = await getStoredUser();
        if (!backendUser || backendUser.id !== userId) return;
        if (!localUser) {
          localUser = {
            id: backendUser.id,
            nickname: backendUser.nickname || '神秘旅人',
            avatar: backendUser.avatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
            loginMethod: 'phone',
            personalityUsage: buildDefaultUsage(),
            personalityRatings: buildDefaultRatings(),
            unlockedPremium: [],
            consecutiveStreak: { personality: 'joyful', count: 0 },
            achievements: [],
          };
        }
      } else if (!localUser) {
        localUser = {
          id: userId,
          email: email ?? undefined,
          nickname: email ? `用户${email.slice(0, 4)}` : '神秘旅人',
          avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
          loginMethod: 'phone',
          personalityUsage: buildDefaultUsage(),
          personalityRatings: buildDefaultRatings(),
          unlockedPremium: [],
          consecutiveStreak: { personality: 'joyful', count: 0 },
          achievements: [],
        };
      }

      setUser(localUser);

      // Sync backend stats
      const sessionInfo = await checkTodaySession();
      if (sessionInfo) {
        const updatedUser: User = {
          ...localUser,
          currentPersonality: sessionInfo.todayPersonality as PersonalityType | undefined,
          personalityUsage: buildUsageFromStats(sessionInfo.stats),
          personalityRatings: buildRatingsFromStats(sessionInfo.stats),
        };
        setUser(updatedUser);
        await AsyncStorage.setItem(`sv_user_${userId}`, JSON.stringify(updatedUser));
      }
    } catch (e) {
      console.error('loadUserFromSession error:', e);
    }
  };

  const refreshStats = useCallback(async () => {
    if (!user) return;
    const sessionInfo = await checkTodaySession();
    if (sessionInfo) {
      const updated: User = {
        ...user,
        personalityUsage: buildUsageFromStats(sessionInfo.stats),
        personalityRatings: buildRatingsFromStats(sessionInfo.stats),
        currentPersonality: (sessionInfo.todayPersonality as PersonalityType | undefined) ?? user.currentPersonality,
      };
      setUser(updated);
      await AsyncStorage.setItem(`sv_user_${user.id}`, JSON.stringify(updated));
    }
  }, [user]);

  const login = useCallback(async (method: 'phone', phone: string, userId: string) => {
    const cached = await AsyncStorage.getItem(`sv_user_${userId}`);
    let baseUser: User;

    if (cached) {
      baseUser = JSON.parse(cached);
    } else if (USE_BACKEND_API) {
      const backendUser = await getStoredUser();
      baseUser = {
        id: userId,
        phone,
        nickname: backendUser?.nickname || `用户${phone.slice(-4)}`,
        avatar: backendUser?.avatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
        loginMethod: 'phone',
        personalityUsage: buildDefaultUsage(),
        personalityRatings: buildDefaultRatings(),
        unlockedPremium: [],
        consecutiveStreak: { personality: 'joyful', count: 0 },
        achievements: [],
      };
    } else {
      baseUser = {
        id: userId,
        phone,
        nickname: `用户${phone.slice(-4)}`,
        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
        loginMethod: 'phone',
        personalityUsage: buildDefaultUsage(),
        personalityRatings: buildDefaultRatings(),
        unlockedPremium: [],
        consecutiveStreak: { personality: 'joyful', count: 0 },
        achievements: [],
      };
    }
    setUser(baseUser);
    await AsyncStorage.setItem(`sv_user_${userId}`, JSON.stringify(baseUser));

    // Fetch backend stats
    const sessionInfo = await checkTodaySession();
    if (sessionInfo) {
      const updated: User = {
        ...baseUser,
        currentPersonality: sessionInfo.todayPersonality as PersonalityType | undefined,
        personalityUsage: buildUsageFromStats(sessionInfo.stats),
        personalityRatings: buildRatingsFromStats(sessionInfo.stats),
      };
      setUser(updated);
      await AsyncStorage.setItem(`sv_user_${userId}`, JSON.stringify(updated));
    }
  }, []);

  const logout = useCallback(async () => {
    if (USE_BACKEND_API) await backendSignOut();
    else await signOut();
    if (user?.id) {
      await AsyncStorage.removeItem(`sv_user_${user.id}`);
    }
    await AsyncStorage.multiRemove(['sv_personality']);
    setUser(null);
  }, [user]);

  const setPersonality = useCallback(async (type: PersonalityType) => {
    if (!user) return;

    const prevStreak = user.consecutiveStreak;
    const newStreak =
      prevStreak.personality === type
        ? { personality: type, count: prevStreak.count + 1 }
        : { personality: type, count: 1 };

    const newAchievements = [...user.achievements];
    if (newStreak.count >= 5) {
      const achievement = ACHIEVEMENTS.find((a) => a.personality === type);
      if (achievement && !newAchievements.includes(achievement.id)) {
        newAchievements.push(achievement.id);
      }
    }

    const updated: User = {
      ...user,
      currentPersonality: type,
      consecutiveStreak: newStreak,
      achievements: newAchievements,
    };
    setUser(updated);
    await AsyncStorage.setItem(`sv_user_${user.id}`, JSON.stringify(updated));
    await AsyncStorage.setItem('sv_personality', type);

    // Sync to backend → increments usage_count via admin client
    const result = await selectPersonalityAPI(type);
    if (result?.stats && result.stats.length > 0) {
      // Server returned fresh stats — use them
      const synced: User = {
        ...updated,
        personalityUsage: buildUsageFromStats(result.stats),
        personalityRatings: buildRatingsFromStats(result.stats),
      };
      setUser(synced);
      await AsyncStorage.setItem(`sv_user_${user.id}`, JSON.stringify(synced));
    } else if (!result?.alreadySelected) {
      // Optimistic update: backend incremented but stats read failed, bump locally
      const optimisticUsage = { ...updated.personalityUsage };
      optimisticUsage[type] = (optimisticUsage[type] || 0) + 1;
      const optimistic: User = { ...updated, personalityUsage: optimisticUsage };
      setUser(optimistic);
      await AsyncStorage.setItem(`sv_user_${user.id}`, JSON.stringify(optimistic));
    }
  }, [user]);

  const unlockPremium = useCallback(async (type: PersonalityType) => {
    if (!user || user.unlockedPremium.includes(type)) return;
    const updated: User = {
      ...user,
      unlockedPremium: [...user.unlockedPremium, type],
    };
    setUser(updated);
    await AsyncStorage.setItem(`sv_user_${user.id}`, JSON.stringify(updated));
  }, [user]);

  const isPremiumUnlocked = useCallback((type: PersonalityType): boolean => {
    if (!user) return false;
    const theme = PERSONALITY_THEMES[type];
    if (!theme?.isPremium) return true;
    return user.unlockedPremium.includes(type);
  }, [user]);

  const getCurrentAchievement = useCallback(() => {
    if (!user || user.achievements.length === 0) return null;
    const latestId = user.achievements[user.achievements.length - 1];
    const found = ACHIEVEMENTS.find((a) => a.id === latestId);
    if (!found) return null;
    return { label: found.label, icon: found.icon, color: found.color };
  }, [user]);

  const isAuthenticated = !!user;
  const isLoggedIn = !!user?.currentPersonality;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn,
        isAuthenticated,
        login,
        logout,
        setPersonality,
        unlockPremium,
        isPremiumUnlocked,
        getCurrentAchievement,
        refreshStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
