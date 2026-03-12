// Powered by OnSpace.AI
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useAlert } from '@/template';
import { PersonalityCard, GradientButton } from '@/components';
import {
  PERSONALITY_THEMES,
  PersonalityTheme,
  PersonalityType,
  FREE_PERSONALITIES,
  PREMIUM_PERSONALITIES,
  SPACING,
  FONT,
  RADIUS,
} from '@/constants/theme';


const FREE_LIST = FREE_PERSONALITIES.map((k) => PERSONALITY_THEMES[k]);
const PREMIUM_LIST = PREMIUM_PERSONALITIES.map((k) => PERSONALITY_THEMES[k]);

// Keys ordered for interpolation
const ANIM_KEYS: PersonalityType[] = FREE_PERSONALITIES;
const SURFACE_COLORS = ANIM_KEYS.map((k) => PERSONALITY_THEMES[k].surface);

export default function PersonalityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setPersonality, unlockPremium, isPremiumUnlocked } = useAuth();
  const { setTheme } = useTheme();
  const { showAlert } = useAlert();
  const [selected, setSelected] = useState<PersonalityType | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [pendingUnlock, setPendingUnlock] = useState<PersonalityTheme | null>(null);

  // Ratings and usage come from user's own personality_stats (synced via AuthContext)
  // No need to load global aggregates here

  const themeProgress = useSharedValue(-1);
  const btnActive = useSharedValue(0);

  useEffect(() => {
    if (selected === null || !FREE_PERSONALITIES.includes(selected as any)) {
      themeProgress.value = withTiming(-1, { duration: 400, easing: Easing.out(Easing.cubic) });
      btnActive.value = withTiming(0, { duration: 300 });
    } else {
      const idx = ANIM_KEYS.indexOf(selected);
      themeProgress.value = withTiming(idx, { duration: 450, easing: Easing.out(Easing.cubic) });
      btnActive.value = withTiming(1, { duration: 350 });
    }
  }, [selected]);

  const bgStyle = useAnimatedStyle(() => {
    const progress = themeProgress.value;
    if (progress < 0) return { backgroundColor: '#080808' };
    const floorIdx = Math.max(0, Math.min(ANIM_KEYS.length - 1, Math.floor(progress)));
    const ceilIdx = Math.min(ANIM_KEYS.length - 1, floorIdx + 1);
    const frac = progress - floorIdx;
    return {
      backgroundColor: interpolateColor(frac, [0, 1], [SURFACE_COLORS[floorIdx], SURFACE_COLORS[ceilIdx]]),
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    const progress = themeProgress.value;
    if (progress < 0) return { backgroundColor: 'transparent' };
    const floorIdx = Math.max(0, Math.min(ANIM_KEYS.length - 1, Math.floor(progress)));
    const ceilIdx = Math.min(ANIM_KEYS.length - 1, floorIdx + 1);
    const frac = progress - floorIdx;
    return {
      backgroundColor: interpolateColor(frac, [0, 1], [
        PERSONALITY_THEMES[ANIM_KEYS[floorIdx]].primary + '22',
        PERSONALITY_THEMES[ANIM_KEYS[ceilIdx]].primary + '22',
      ]),
    };
  });

  const bottomBarStyle = useAnimatedStyle(() => {
    const progress = themeProgress.value;
    if (progress < 0) return { borderTopColor: '#1A1A1A' };
    const floorIdx = Math.max(0, Math.min(ANIM_KEYS.length - 1, Math.floor(progress)));
    const ceilIdx = Math.min(ANIM_KEYS.length - 1, floorIdx + 1);
    const frac = progress - floorIdx;
    return {
      borderTopColor: interpolateColor(frac, [0, 1], [
        PERSONALITY_THEMES[ANIM_KEYS[floorIdx]].primary + '55',
        PERSONALITY_THEMES[ANIM_KEYS[ceilIdx]].primary + '55',
      ]),
    };
  });

  const handleSelect = (type: PersonalityType) => setSelected(type);

  const handleUnlock = (theme: PersonalityTheme) => {
    setPendingUnlock(theme);
    setShowPassModal(true);
  };

  const handleConfirmUnlock = async () => {
    if (!pendingUnlock) return;
    setShowPassModal(false);
    await unlockPremium(pendingUnlock.id);
    showAlert('解锁成功 🎉', `「${pendingUnlock.name}」已加入你的性格库`, [
      { text: '太棒了', style: 'default' },
    ]);
    setPendingUnlock(null);
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setLoading(true);
    setTheme(selected);
    await setPersonality(selected);
    setLoading(false);
    router.replace('/(tabs)');
  };

  const activeTheme = selected ? PERSONALITY_THEMES[selected] : null;
  const btnGradient: [string, string] = activeTheme ? activeTheme.gradient : ['#2A2A2A', '#1A1A1A'];

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]} />
      <Animated.View style={[styles.overlayTint, overlayStyle]} />
      <LinearGradient
        colors={['transparent', '#080808']}
        style={styles.bottomFade}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + SPACING.lg, paddingBottom: insets.bottom + SPACING.xxl + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>
          {user?.nickname ? `嗨，${user.nickname} 👋` : '欢迎回来 👋'}
        </Text>
        <Text style={styles.title}>今天，你想成为谁？</Text>
        <Text style={styles.subtitle}>选择你的今日性格，这将影响整个应用的风格</Text>

        {/* Stats note */}
        {(!user?.personalityUsage || Object.values(user.personalityUsage).every(v => v === 0)) ? (
          <View style={styles.ratingsLoadingRow}>
            <Text style={styles.ratingsLoadingText}>首次选择后数据将同步至服务器</Text>
          </View>
        ) : null}

        {/* Free personalities */}
        <View style={styles.grid}>
          {FREE_LIST.map((p) => (
            <AnimatedPersonalityCard
              key={p.id}
              theme={p}
              usageCount={user?.personalityUsage[p.id] || 0}
              rating={user?.personalityRatings[p.id] ?? 0}
              isSelected={selected === p.id}
              isLocked={false}
              onPress={() => handleSelect(p.id)}
              onUnlock={() => {}}
            />
          ))}
        </View>

        {/* Premium section header */}
        <View style={styles.premiumHeader}>
          <LinearGradient
            colors={['#FFD700', '#FF8C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.premiumBadge}
          >
            <MaterialIcons name="workspace-premium" size={14} color="#fff" />
            <Text style={styles.premiumBadgeText}>性格通行证</Text>
          </LinearGradient>
          <Text style={styles.premiumTitle}>解锁更多面的自己</Text>
          <Text style={styles.premiumSub}>购买通行证，解锁以下稀有性格类型</Text>
        </View>

        {/* Premium personalities */}
        <View style={styles.grid}>
          {PREMIUM_LIST.map((p) => {
            const unlocked = isPremiumUnlocked(p.id);
            return (
              <AnimatedPersonalityCard
                key={p.id}
                theme={p}
                usageCount={user?.personalityUsage[p.id] || 0}
                rating={user?.personalityRatings[p.id] ?? 0}
                isSelected={selected === p.id}
                isLocked={!unlocked}
                onPress={() => handleSelect(p.id)}
                onUnlock={() => handleUnlock(p)}
              />
            );
          })}
        </View>
      </ScrollView>

      {/* Fixed bottom button */}
      <Animated.View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + SPACING.md },
          bottomBarStyle,
        ]}
      >
        <GradientButton
          label={selected ? `以「${PERSONALITY_THEMES[selected].name}」进入` : '请选择一种性格'}
          onPress={handleConfirm}
          gradient={btnGradient}
          disabled={!selected}
          loading={loading}
          style={styles.confirmBtn}
        />
      </Animated.View>

      {/* Personality Pass Modal */}
      <Modal visible={showPassModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient
              colors={pendingUnlock ? pendingUnlock.gradient : ['#FFD700', '#FF8C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalIconBg}
            >
              <Text style={styles.modalEmoji}>{pendingUnlock?.emoji || '🔮'}</Text>
            </LinearGradient>
            <Text style={styles.modalTitle}>解锁「{pendingUnlock?.name}」</Text>
            <Text style={styles.modalSub}>{pendingUnlock?.tagline}</Text>

            <View style={styles.passFeatureList}>
              {['解锁该性格的匹配权限', '专属性格标签 & 聊天风格', '纳入日报成就追踪'].map((f, i) => (
                <View key={i} style={styles.passFeatureItem}>
                  <MaterialIcons name="check-circle" size={16} color="#FFD700" />
                  <Text style={styles.passFeatureText}>{f}</Text>
                </View>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [styles.passConfirmBtn, pressed && styles.pressed]}
              onPress={handleConfirmUnlock}
            >
              <LinearGradient
                colors={['#FFD700', '#FF8C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.passConfirmGradient}
              >
                <MaterialIcons name="workspace-premium" size={18} color="#fff" />
                <Text style={styles.passConfirmText}>立即解锁（模拟）</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={styles.passCancelBtn}
              onPress={() => { setShowPassModal(false); setPendingUnlock(null); }}
            >
              <Text style={styles.passCancelText}>暂时不了</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── AnimatedPersonalityCard ─────────────────────────────────────────
interface AnimatedCardProps {
  theme: PersonalityTheme;
  usageCount: number;
  rating: number;
  isSelected: boolean;
  isLocked: boolean;
  onPress: () => void;
  onUnlock: () => void;
}

function AnimatedPersonalityCard({ theme, usageCount, rating, isSelected, isLocked, onPress, onUnlock }: AnimatedCardProps) {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0);

  useEffect(() => {
    if (isSelected) {
      scale.value = withSpring(1.04, { damping: 12, stiffness: 200, mass: 0.8 });
      shadowOpacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = withSpring(1, { damping: 15, stiffness: 180 });
      shadowOpacity.value = withTiming(0, { duration: 250 });
    }
  }, [isSelected]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: shadowOpacity.value * 0.55,
    shadowRadius: 14,
    elevation: Math.round(shadowOpacity.value * 10),
  }));

  return (
    <Animated.View style={[styles.cardWrapper, animStyle, glowStyle]}>
      <PersonalityCard
        theme={theme}
        usageCount={usageCount}
        rating={rating}
        isSelected={isSelected}
        isLocked={isLocked}
        onPress={onPress}
        onUnlock={onUnlock}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080808' },
  overlayTint: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
    height: 300,
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    pointerEvents: 'none',
  },
  container: { paddingHorizontal: SPACING.lg },
  greeting: { color: '#888', fontSize: FONT.md, marginBottom: SPACING.xs },
  title: { color: '#fff', fontSize: FONT.xxl, fontWeight: '800', letterSpacing: -0.5, marginBottom: SPACING.xs },
  subtitle: { color: '#555', fontSize: FONT.sm, lineHeight: 20, marginBottom: SPACING.md },
  ratingsLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  ratingsLoadingText: { color: '#444', fontSize: 11 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '47%',
    marginBottom: SPACING.md,
  },
  premiumHeader: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  premiumBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  premiumTitle: { color: '#fff', fontSize: FONT.lg, fontWeight: '700' },
  premiumSub: { color: '#555', fontSize: FONT.sm, textAlign: 'center' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: 'rgba(8,8,8,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  confirmBtn: { width: '100%' },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#111',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: SPACING.sm,
  },
  modalIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  modalEmoji: { fontSize: 36 },
  modalTitle: { color: '#fff', fontSize: FONT.xl, fontWeight: '800' },
  modalSub: { color: '#666', fontSize: FONT.sm, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.sm },
  passFeatureList: { width: '100%', gap: SPACING.sm, marginBottom: SPACING.md },
  passFeatureItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  passFeatureText: { color: '#ccc', fontSize: FONT.sm },
  passConfirmBtn: { width: '100%', borderRadius: RADIUS.full, overflow: 'hidden' },
  passConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    minHeight: 52,
  },
  passConfirmText: { color: '#fff', fontSize: FONT.md, fontWeight: '700' },
  passCancelBtn: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.xl },
  passCancelText: { color: '#555', fontSize: FONT.sm },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
