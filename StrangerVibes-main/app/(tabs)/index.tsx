// Powered by OnSpace.AI
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useMatching } from '@/hooks/useMatching';
import { StarRating } from '@/components';
import { PERSONALITY_THEMES, ACHIEVEMENTS, SPACING, FONT, RADIUS } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, getCurrentAchievement } = useAuth();
  const { currentTheme, currentPersonality } = useTheme();
  const { status, matchedUser, sessionId, startMatching, cancelMatching, resetMatch } = useMatching();
  const usage = user?.personalityUsage[currentPersonality] || 0;
  const rating = user?.personalityRatings[currentPersonality] || 0;
  const achievement = getCurrentAchievement();

  const handleMatchComplete = () => {
    if (matchedUser) {
      const params = new URLSearchParams({
        nickname: matchedUser.nickname,
        avatar: matchedUser.avatar,
        personality: matchedUser.personality,
        personalityKey: matchedUser.personalityKey,
      });
      if (sessionId != null) params.set('sessionId', String(sessionId));
      resetMatch();
      router.push(`/chat/${matchedUser.id}?${params.toString()}`);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: currentTheme.surface }]}>
      <LinearGradient
        colors={[currentTheme.surface, '#080808', '#080808']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + SPACING.md, paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>今日的你</Text>
            <View style={styles.personalityBadge}>
              <Text style={styles.personalityEmoji}>{currentTheme.emoji}</Text>
              <Text style={[styles.personalityName, { color: currentTheme.primary }]}>
                {currentTheme.name}
              </Text>
            </View>
          </View>
          <Pressable
            style={[styles.switchBtn, { borderColor: currentTheme.primary + '44' }]}
            onPress={() => router.push('/personality')}
          >
            <MaterialIcons name="swap-horiz" size={18} color={currentTheme.primary} />
            <Text style={[styles.switchText, { color: currentTheme.primary }]}>切换</Text>
          </Pressable>
        </View>

        {/* Achievement Banner */}
        {achievement ? (
          <Pressable
            style={[styles.achievementBanner, { borderColor: achievement.color + '55' }]}
            onPress={() => router.push('/report')}
          >
            <LinearGradient
              colors={[achievement.color + '33', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementNewLabel}>成就解锁！</Text>
              <Text style={[styles.achievementLabel, { color: achievement.color }]}>{achievement.label}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={achievement.color} />
          </Pressable>
        ) : null}

        {/* Stats Card */}
        <LinearGradient
          colors={[currentTheme.cardBg, '#111']}
          style={styles.statsCard}
        >
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: currentTheme.accent }]}>{usage}</Text>
            <Text style={styles.statLabel}>今日使用次数</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FFD700' }]}>{rating.toFixed(1)}</Text>
            <View style={styles.starsRow}>
              <StarRating rating={rating} size={14} />
            </View>
            <Text style={styles.statLabel}>综合评分</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: currentTheme.accent }]}>
              {Math.floor(usage * 7.3)}
            </Text>
            <Text style={styles.statLabel}>匹配人数</Text>
          </View>
        </LinearGradient>

        {/* Daily Report Entry */}
        <Pressable
          style={({ pressed }) => [styles.reportEntry, pressed && styles.pressed]}
          onPress={() => router.push('/report')}
        >
          <LinearGradient
            colors={[currentTheme.cardBg, '#111']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.reportIcon, { backgroundColor: currentTheme.primary + '22' }]}>
            <MaterialIcons name="bar-chart" size={20} color={currentTheme.primary} />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>查看今日性格报告</Text>
            <Text style={styles.reportSub}>匹配统计 · 情绪指数 · 今日金句</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#444" />
        </Pressable>

        {/* Tagline */}
        <Text style={[styles.tagline, { color: currentTheme.textSecondary }]}>
          {currentTheme.tagline}
        </Text>

        {/* Matching section */}
        <View style={styles.matchSection}>
          <Text style={styles.sectionTitle}>随机匹配</Text>
          <Text style={styles.sectionSub}>遇见今天的陌生人</Text>

          <Image
            source={require('@/assets/images/matching-bg.png')}
            style={styles.matchingImage}
            contentFit="cover"
            transition={200}
          />

          <Pressable
            style={({ pressed }) => [
              styles.matchButton,
              { backgroundColor: currentTheme.primary },
              pressed && styles.pressed,
            ]}
            onPress={startMatching}
            disabled={status === 'searching'}
          >
            <LinearGradient
              colors={currentTheme.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.matchGradient}
            >
              <MaterialIcons name="shuffle" size={22} color="#fff" />
              <Text style={styles.matchButtonText}>开始匹配</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Recent activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今日动态</Text>
          {[
            { text: `以「${currentTheme.name}」身份聊天了 ${Math.floor(usage * 0.4 + 1)} 次`, icon: 'chat' as const, time: '2小时前' },
            { text: '收到了一个 ⭐ 评价', icon: 'star' as const, time: '3小时前' },
            { text: '匹配了一位「冷静派」用户', icon: 'people' as const, time: '5小时前' },
          ].map((item, i) => (
            <View key={i} style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: currentTheme.primary + '22' }]}>
                <MaterialIcons name={item.icon} size={16} color={currentTheme.primary} />
              </View>
              <Text style={styles.activityText}>{item.text}</Text>
              <Text style={styles.activityTime}>{item.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Matching Modal */}
      <Modal visible={status !== 'idle'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {status === 'searching' && (
              <>
                <ActivityIndicator size="large" color={currentTheme.primary} />
                <Text style={styles.modalTitle}>正在匹配中...</Text>
                <Text style={styles.modalSub}>寻找志同道合的陌生人</Text>
                <Pressable
                  style={[styles.modalCancelBtn, { borderColor: '#333' }]}
                  onPress={cancelMatching}
                >
                  <Text style={styles.modalCancelText}>取消</Text>
                </Pressable>
              </>
            )}
            {status === 'matched' && matchedUser && (
              <>
                <View style={[styles.matchSuccessBadge, { backgroundColor: currentTheme.primary + '22' }]}>
                  <MaterialIcons name="check-circle" size={32} color={currentTheme.primary} />
                </View>
                <Text style={styles.modalTitle}>匹配成功！</Text>
                <Image
                  source={{ uri: matchedUser.avatar }}
                  style={styles.matchedAvatar}
                  contentFit="cover"
                  transition={200}
                />
                <Text style={styles.matchedName}>{matchedUser.nickname}</Text>
                <View style={styles.matchedPersonalityBadge}>
                  <Text style={[styles.matchedPersonalityText, { color: currentTheme.accent }]}>
                    {matchedUser.personality}
                  </Text>
                </View>
                <View style={styles.matchedRating}>
                  <StarRating rating={matchedUser.rating} size={14} />
                  <Text style={styles.matchedRatingText}>{matchedUser.rating}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.startChatBtn,
                    pressed && styles.pressed,
                  ]}
                  onPress={handleMatchComplete}
                >
                  <LinearGradient
                    colors={currentTheme.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.startChatGradient}
                  >
                    <Text style={styles.startChatText}>开始聊天</Text>
                  </LinearGradient>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { paddingHorizontal: SPACING.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  greeting: { color: '#666', fontSize: FONT.sm, marginBottom: 4 },
  personalityBadge: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  personalityEmoji: { fontSize: 22 },
  personalityName: { fontSize: FONT.xl, fontWeight: '800' },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  switchText: { fontSize: FONT.sm, fontWeight: '600' },
  statsCard: {
    flexDirection: 'row',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: FONT.xxl, fontWeight: '800' },
  statLabel: { color: '#555', fontSize: 11, textAlign: 'center' },
  starsRow: { marginVertical: 2 },
  statDivider: { width: 1, backgroundColor: '#1E1E1E', marginHorizontal: SPACING.sm },
  achievementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  achievementIcon: { fontSize: 24 },
  achievementInfo: { flex: 1 },
  achievementNewLabel: { color: '#888', fontSize: 11 },
  achievementLabel: { fontSize: FONT.md, fontWeight: '700' },
  reportEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  reportIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  reportInfo: { flex: 1 },
  reportTitle: { color: '#eee', fontSize: FONT.md, fontWeight: '600' },
  reportSub: { color: '#555', fontSize: FONT.sm, marginTop: 2 },
  tagline: { fontSize: FONT.sm, marginBottom: SPACING.xl, textAlign: 'center' },
  matchSection: {
    backgroundColor: '#111',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  sectionTitle: { color: '#fff', fontSize: FONT.lg, fontWeight: '700', marginBottom: 4 },
  sectionSub: { color: '#555', fontSize: FONT.sm, marginBottom: SPACING.md },
  matchingImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: SPACING.lg,
  },
  matchButton: {
    width: '100%',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  matchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    minHeight: 52,
  },
  matchButtonText: { color: '#fff', fontSize: FONT.md, fontWeight: '700' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  section: {
    backgroundColor: '#111',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    marginBottom: SPACING.lg,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: { flex: 1, color: '#ccc', fontSize: FONT.sm, lineHeight: 18 },
  activityTime: { color: '#444', fontSize: 11 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
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
    borderColor: '#222',
    gap: SPACING.sm,
  },
  modalTitle: { color: '#fff', fontSize: FONT.xl, fontWeight: '700', marginTop: SPACING.sm },
  modalSub: { color: '#555', fontSize: FONT.sm },
  modalCancelBtn: {
    marginTop: SPACING.md,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
  },
  modalCancelText: { color: '#888', fontSize: FONT.md },
  matchSuccessBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  matchedAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginTop: SPACING.sm,
  },
  matchedName: { color: '#fff', fontSize: FONT.lg, fontWeight: '700' },
  matchedPersonalityBadge: {
    backgroundColor: '#1E1E1E',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  matchedPersonalityText: { fontSize: FONT.sm, fontWeight: '600' },
  matchedRating: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  matchedRatingText: { color: '#FFD700', fontSize: FONT.sm, fontWeight: '600' },
  startChatBtn: {
    width: '100%',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginTop: SPACING.md,
  },
  startChatGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    minHeight: 52,
  },
  startChatText: { color: '#fff', fontSize: FONT.md, fontWeight: '700' },
});
