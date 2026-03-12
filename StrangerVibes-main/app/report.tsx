// Powered by OnSpace.AI
import React, { useMemo, useRef, useState } from 'react';
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
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { PERSONALITY_THEMES, ACHIEVEMENTS, SPACING, FONT, RADIUS } from '@/constants/theme';
import { generateDailyReport, getEmotionLabel, getEmotionColor } from '@/services/reportService';

// Fixed card width for the long image
const CARD_WIDTH = 360;

export default function ReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, getCurrentAchievement } = useAuth();
  const { currentTheme, currentPersonality } = useTheme();
  const viewShotRef = useRef<ViewShot>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareTarget, setShareTarget] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const report = useMemo(() => {
    const usage = user?.personalityUsage[currentPersonality] || 1;
    return generateDailyReport(currentPersonality, usage);
  }, [currentPersonality, user]);

  const achievement = getCurrentAchievement();
  const emotionColor = getEmotionColor(report.emotionIndex);
  const emotionLabel = getEmotionLabel(report.emotionIndex);
  const unlockedAchievements = user?.achievements || [];

  const trendIcon =
    report.emotionTrend === 'rising' ? 'trending-up' :
    report.emotionTrend === 'falling' ? 'trending-down' : 'trending-flat';
  const trendColor =
    report.emotionTrend === 'rising' ? '#2ECC71' :
    report.emotionTrend === 'falling' ? '#E74C3C' : '#F1C40F';

  const openShareModal = (platform: string) => {
    setShareTarget(platform);
    setShareModalVisible(true);
  };

  const handleCaptureAndShare = async () => {
    if (!viewShotRef.current) return;
    setCapturing(true);
    try {
      const uri = await (viewShotRef.current as any).capture();
      setShareModalVisible(false);
      await new Promise((r) => setTimeout(r, 300));
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: '分享今日性格报告',
          UTI: 'public.png',
        });
      }
    } catch (e) {
      console.log('Capture error', e);
    } finally {
      setCapturing(false);
    }
  };

  const platformLabel: Record<string, string> = {
    wechat: '微信',
    xiaohongshu: '小红书',
    douyin: '抖音',
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.xs }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back-ios" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>今日报告</Text>
        <View style={styles.headerDate}>
          <Text style={styles.headerDateText}>{report.date}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <Image
            source={require('@/assets/images/report-bg.png')}
            style={styles.heroBg}
            contentFit="cover"
            transition={200}
          />
          <LinearGradient
            colors={['transparent', 'rgba(8,8,8,0.9)', '#080808']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>今日性格</Text>
            <View style={styles.heroPersonality}>
              <Text style={styles.heroEmoji}>{PERSONALITY_THEMES[currentPersonality].emoji}</Text>
              <Text style={[styles.heroName, { color: currentTheme.primary }]}>
                {PERSONALITY_THEMES[currentPersonality].name}
              </Text>
            </View>
            <Text style={styles.heroTagline}>{PERSONALITY_THEMES[currentPersonality].tagline}</Text>
          </View>
        </View>

        {/* Achievement badge */}
        {achievement ? (
          <View style={[styles.achievementBanner, { borderColor: achievement.color + '55' }]}>
            <LinearGradient
              colors={[achievement.color + '22', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>成就解锁</Text>
              <Text style={[styles.achievementLabel, { color: achievement.color }]}>{achievement.label}</Text>
              <Text style={styles.achievementSub}>连续选择同一性格 5 次以上</Text>
            </View>
            <MaterialIcons name="emoji-events" size={28} color={achievement.color} />
          </View>
        ) : null}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <LinearGradient colors={['#1A1A1A', '#111']} style={styles.statCard}>
            <MaterialIcons name="people" size={20} color={currentTheme.primary} />
            <Text style={[styles.statValue, { color: currentTheme.primary }]}>{report.matchedCount}</Text>
            <Text style={styles.statLabel}>匹配人数</Text>
          </LinearGradient>
          <LinearGradient colors={['#1A1A1A', '#111']} style={styles.statCard}>
            <MaterialIcons name="whatshot" size={20} color="#E74C3C" />
            <Text style={[styles.statValue, { color: '#E74C3C' }]}>{report.argumentsTriggered}</Text>
            <Text style={styles.statLabel}>引发争论</Text>
          </LinearGradient>
          <LinearGradient colors={['#1A1A1A', '#111']} style={styles.statCard}>
            <MaterialIcons name="timer" size={20} color="#8B78FF" />
            <Text style={[styles.statValue, { color: '#8B78FF' }]}>{report.totalChatMinutes}</Text>
            <Text style={styles.statLabel}>聊天分钟</Text>
          </LinearGradient>
        </View>

        {/* Emotion index */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>情绪波动指数</Text>
            <View style={styles.trendBadge}>
              <MaterialIcons name={trendIcon} size={16} color={trendColor} />
              <Text style={[styles.trendText, { color: trendColor }]}>
                {report.emotionTrend === 'rising' ? '上升' : report.emotionTrend === 'falling' ? '下降' : '平稳'}
              </Text>
            </View>
          </View>
          <View style={styles.emotionRow}>
            <Text style={[styles.emotionScore, { color: emotionColor }]}>{report.emotionIndex}</Text>
            <Text style={styles.emotionMax}>/100</Text>
          </View>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={[emotionColor + 'AA', emotionColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${report.emotionIndex}%` }]}
            />
          </View>
          <Text style={[styles.emotionLabel, { color: emotionColor }]}>{emotionLabel}</Text>
          <View style={styles.moodTag}>
            <Text style={styles.moodTagText}>今日情绪基调：{report.topMood}</Text>
          </View>
        </View>

        {/* Quote of the day */}
        <LinearGradient colors={[currentTheme.cardBg, '#111']} style={styles.quoteCard}>
          <View style={styles.quoteHeader}>
            <MaterialIcons name="format-quote" size={20} color={currentTheme.accent} />
            <Text style={[styles.quoteTitle, { color: currentTheme.accent }]}>今日金句</Text>
          </View>
          <Text style={styles.quoteText}>"{report.quoteOfDay}"</Text>
          <Text style={styles.quoteSource}>— 由你今日的聊天内容提炼</Text>
        </LinearGradient>

        {/* Harshest line */}
        <View style={styles.harshCard}>
          <View style={styles.harshHeader}>
            <Text style={styles.harshIcon}>🔥</Text>
            <Text style={styles.harshTitle}>今日毒舌之言</Text>
            <Text style={styles.harshBadge}>系统生成</Text>
          </View>
          <Text style={styles.harshText}>"{report.harshestLine}"</Text>
          <Text style={styles.harshSub}>基于今日聊天风格自动生成</Text>
        </View>

        {/* All Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>成就系统</Text>
          <Text style={styles.sectionSub}>同一性格连续使用 5 次以上，解锁专属标签</Text>
          <View style={styles.achievementGrid}>
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = unlockedAchievements.includes(ach.id);
              return (
                <View
                  key={ach.id}
                  style={[
                    styles.achievementItem,
                    unlocked && { borderColor: ach.color + '66', backgroundColor: ach.color + '11' },
                  ]}
                >
                  <Text style={[styles.achIcon, { opacity: unlocked ? 1 : 0.3 }]}>{ach.icon}</Text>
                  <Text style={[styles.achLabel, { color: unlocked ? ach.color : '#444' }]}>{ach.label}</Text>
                  {unlocked ? (
                    <MaterialIcons name="check-circle" size={12} color={ach.color} />
                  ) : (
                    <MaterialIcons name="lock" size={12} color="#333" />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Share bottom bar */}
      <View style={[styles.shareBar, { paddingBottom: insets.bottom + SPACING.sm }]}>
        <Text style={styles.shareLabel}>以长图分享报告至</Text>
        <View style={styles.shareButtons}>
          {[
            { platform: 'wechat', label: '微信', icon: '💬', color: '#07C160' },
            { platform: 'xiaohongshu', label: '小红书', icon: '📕', color: '#FF2442' },
            { platform: 'douyin', label: '抖音', icon: '🎵', color: '#888' },
          ].map((s) => (
            <Pressable
              key={s.platform}
              style={({ pressed }) => [
                styles.shareBtn,
                { backgroundColor: s.color + '22', borderColor: s.color + '44' },
                pressed && styles.pressed,
              ]}
              onPress={() => openShareModal(s.platform)}
            >
              <Text style={styles.shareBtnIcon}>{s.icon}</Text>
              <Text style={[styles.shareBtnLabel, { color: s.color }]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Share long-image preview modal */}
      <Modal visible={shareModalVisible} transparent animationType="slide">
        <View style={styles.shareModalOverlay}>
          <View style={[styles.shareModalSheet, { paddingBottom: insets.bottom + SPACING.md }]}>
            <View style={styles.shareModalHandle} />

            <View style={styles.shareModalTitleRow}>
              <MaterialIcons name="photo-size-select-large" size={18} color={currentTheme.primary} />
              <Text style={styles.shareModalTitle}>完整报告长图</Text>
            </View>
            <Text style={styles.shareModalSub}>
              将生成包含完整报告内容的长图，分享至{shareTarget ? platformLabel[shareTarget] : ''}
            </Text>

            {/* Scrollable preview of the full card */}
            <ScrollView
              style={styles.previewScroll}
              contentContainerStyle={styles.previewScrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* ViewShot wraps the FULL long ShareCard — positioned off-screen visually but captured */}
              <ViewShot
                ref={viewShotRef}
                options={{ format: 'png', quality: 1 }}
                collapsable={false}
              >
                <FullReportCard
                  report={report}
                  currentPersonality={currentPersonality}
                  currentTheme={currentTheme}
                  achievement={achievement}
                  emotionColor={emotionColor}
                  emotionLabel={emotionLabel}
                  unlockedAchievements={unlockedAchievements}
                  trendIcon={trendIcon}
                  trendColor={trendColor}
                />
              </ViewShot>
            </ScrollView>

            <Pressable
              style={({ pressed }) => [
                styles.captureBtn,
                pressed && styles.pressed,
                capturing && styles.captureBtnDisabled,
              ]}
              onPress={handleCaptureAndShare}
              disabled={capturing}
            >
              <LinearGradient
                colors={currentTheme.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.captureGradient}
              >
                {capturing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="file-download" size={18} color="#fff" />
                    <Text style={styles.captureBtnText}>保存并分享长图</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.cancelShareBtn} onPress={() => setShareModalVisible(false)}>
              <Text style={styles.cancelShareText}>取消</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Full Report Long Image Card ──────────────────────────────────────
interface FullReportCardProps {
  report: ReturnType<typeof generateDailyReport>;
  currentPersonality: string;
  currentTheme: (typeof PERSONALITY_THEMES)[keyof typeof PERSONALITY_THEMES];
  achievement: { label: string; icon: string; color: string } | null;
  emotionColor: string;
  emotionLabel: string;
  unlockedAchievements: string[];
  trendIcon: 'trending-up' | 'trending-down' | 'trending-flat';
  trendColor: string;
}

function FullReportCard({
  report,
  currentPersonality,
  currentTheme,
  achievement,
  emotionColor,
  emotionLabel,
  unlockedAchievements,
  trendIcon,
  trendColor,
}: FullReportCardProps) {
  const personality = PERSONALITY_THEMES[currentPersonality as keyof typeof PERSONALITY_THEMES];
  const barWidth = Math.round((report.emotionIndex / 100) * (CARD_WIDTH - 64));

  return (
    <View style={lc.root} collapsable={false}>
      {/* Dark gradient background */}
      <LinearGradient
        colors={[personality.surface, '#050505', '#000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative top accent bar */}
      <LinearGradient
        colors={personality.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={lc.topAccentBar}
      />

      {/* ── SECTION 1: App header ── */}
      <View style={lc.appHeader}>
        <View>
          <Text style={lc.appName}>StrangerVibes</Text>
          <Text style={lc.appSub}>今日性格报告</Text>
        </View>
        <View style={lc.dateBadge}>
          <Text style={lc.dateText}>{report.date}</Text>
        </View>
      </View>

      {/* ── SECTION 2: Personality hero ── */}
      <LinearGradient
        colors={[personality.primary + '28', personality.primary + '08', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={lc.personalityHero}
      >
        <View style={[lc.personalityEmojiCircle, { borderColor: personality.primary + '44' }]}>
          <Text style={lc.personalityEmoji}>{personality.emoji}</Text>
        </View>
        <View style={lc.personalityTexts}>
          <Text style={lc.personalityHeroLabel}>今日人格</Text>
          <Text style={[lc.personalityHeroName, { color: personality.primary }]}>{personality.name}</Text>
          <Text style={lc.personalityHeroTagline}>{personality.tagline}</Text>
        </View>
      </LinearGradient>

      {/* ── SECTION 3: Stats ── */}
      <View style={lc.sectionBlock}>
        <Text style={lc.blockLabel}>今日数据</Text>
        <View style={lc.statsGrid}>
          {[
            { label: '匹配人数', value: String(report.matchedCount), icon: '👥', color: personality.primary },
            { label: '引发争论', value: String(report.argumentsTriggered), icon: '🔥', color: '#E74C3C' },
            { label: '聊天时长', value: `${report.totalChatMinutes}min`, icon: '⏱', color: '#8B78FF' },
          ].map((s) => (
            <View key={s.label} style={[lc.statBox, { borderColor: s.color + '33' }]}>
              <Text style={lc.statBoxIcon}>{s.icon}</Text>
              <Text style={[lc.statBoxValue, { color: s.color }]}>{s.value}</Text>
              <Text style={lc.statBoxLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={lc.divider} />

      {/* ── SECTION 4: Emotion index ── */}
      <View style={lc.sectionBlock}>
        <View style={lc.blockLabelRow}>
          <Text style={lc.blockLabel}>情绪波动指数</Text>
          <View style={lc.trendPill}>
            <MaterialIcons name={trendIcon} size={13} color={trendColor} />
            <Text style={[lc.trendText, { color: trendColor }]}>
              {report.emotionTrend === 'rising' ? '上升' : report.emotionTrend === 'falling' ? '下降' : '平稳'}
            </Text>
          </View>
        </View>

        <View style={lc.emotionScoreRow}>
          <Text style={[lc.emotionBigScore, { color: emotionColor }]}>{report.emotionIndex}</Text>
          <View style={lc.emotionMeta}>
            <Text style={lc.emotionMax}>/100</Text>
            <Text style={[lc.emotionLabelBadge, { color: emotionColor }]}>{emotionLabel}</Text>
          </View>
        </View>

        <View style={lc.emotionBarBg}>
          <LinearGradient
            colors={[emotionColor + '66', emotionColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[lc.emotionBarFill, { width: barWidth }]}
          />
        </View>

        <View style={lc.moodChip}>
          <Text style={lc.moodChipText}>今日情绪基调：{report.topMood}</Text>
        </View>
      </View>

      <View style={lc.divider} />

      {/* ── SECTION 5: Quote of the day ── */}
      <View style={lc.sectionBlock}>
        <View style={lc.blockLabelRow}>
          <Text style={[lc.quoteDecor, { color: personality.accent }]}>"</Text>
          <Text style={lc.blockLabel}>今日金句</Text>
        </View>
        <View style={[lc.quoteBox, { borderLeftColor: personality.primary }]}>
          <Text style={lc.quoteBodyText}>{report.quoteOfDay}</Text>
          <Text style={lc.quoteFooter}>— 由今日聊天内容提炼</Text>
        </View>
      </View>

      <View style={lc.divider} />

      {/* ── SECTION 6: Harshest line ── */}
      <View style={lc.sectionBlock}>
        <View style={lc.blockLabelRow}>
          <Text style={lc.harshSectionEmoji}>🔥</Text>
          <Text style={lc.blockLabel}>今日毒舌之言</Text>
          <View style={lc.systemGenBadge}>
            <Text style={lc.systemGenText}>系统生成</Text>
          </View>
        </View>
        <View style={lc.harshBox}>
          <Text style={lc.harshBodyText}>"{report.harshestLine}"</Text>
          <Text style={lc.harshFooter}>基于今日聊天风格自动生成</Text>
        </View>
      </View>

      <View style={lc.divider} />

      {/* ── SECTION 7: Achievement (if any) ── */}
      {achievement ? (
        <>
          <View style={lc.sectionBlock}>
            <Text style={lc.blockLabel}>成就解锁</Text>
            <View style={[lc.achievementHighlight, { borderColor: achievement.color + '55' }]}>
              <LinearGradient
                colors={[achievement.color + '22', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={lc.achievementHighlightEmoji}>{achievement.icon}</Text>
              <View style={lc.achievementHighlightInfo}>
                <Text style={[lc.achievementHighlightLabel, { color: achievement.color }]}>{achievement.label}</Text>
                <Text style={lc.achievementHighlightSub}>连续使用同一性格 5 次以上解锁</Text>
              </View>
              <MaterialIcons name="emoji-events" size={24} color={achievement.color} />
            </View>
          </View>
          <View style={lc.divider} />
        </>
      ) : null}

      {/* ── SECTION 8: All achievements grid ── */}
      <View style={lc.sectionBlock}>
        <Text style={lc.blockLabel}>成就收集</Text>
        <View style={lc.achievementGrid}>
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = unlockedAchievements.includes(ach.id);
            return (
              <View
                key={ach.id}
                style={[
                  lc.achievementCell,
                  unlocked
                    ? { borderColor: ach.color + '55', backgroundColor: ach.color + '12' }
                    : { borderColor: '#1C1C1C', backgroundColor: '#0E0E0E' },
                ]}
              >
                <Text style={[lc.achCellIcon, { opacity: unlocked ? 1 : 0.25 }]}>{ach.icon}</Text>
                <Text style={[lc.achCellLabel, { color: unlocked ? ach.color : '#333' }]}>{ach.label}</Text>
                {unlocked ? (
                  <View style={[lc.achUnlockedDot, { backgroundColor: ach.color }]} />
                ) : (
                  <MaterialIcons name="lock" size={9} color="#2A2A2A" />
                )}
              </View>
            );
          })}
        </View>
        <Text style={lc.achievementProgress}>
          已解锁 {unlockedAchievements.length}/{ACHIEVEMENTS.length} 个成就
        </Text>
      </View>

      {/* ── FOOTER ── */}
      <View style={lc.footer}>
        <LinearGradient
          colors={personality.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={lc.footerLine}
        />
        <Text style={lc.footerTagline}>做真实的自己</Text>
        <Text style={lc.footerBrand}>StrangerVibes · 今日性格报告</Text>
      </View>
    </View>
  );
}

// ── Long card styles ─────────────────────────────────────────────────
const lc = StyleSheet.create({
  root: {
    width: CARD_WIDTH,
    backgroundColor: '#040404',
    overflow: 'hidden',
  },
  topAccentBar: {
    height: 5,
    width: '100%',
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 14,
  },
  appName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  appSub: {
    color: '#444',
    fontSize: 10,
    marginTop: 1,
  },
  dateBadge: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  dateText: {
    color: '#555',
    fontSize: 11,
    fontWeight: '600',
  },
  // Personality hero
  personalityHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  personalityEmojiCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personalityEmoji: {
    fontSize: 34,
  },
  personalityTexts: {
    flex: 1,
    gap: 4,
  },
  personalityHeroLabel: {
    color: '#555',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  personalityHeroName: {
    fontSize: 20,
    fontWeight: '900',
  },
  personalityHeroTagline: {
    color: '#777',
    fontSize: 12,
    lineHeight: 17,
  },
  // Section blocks
  sectionBlock: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  blockLabel: {
    color: '#666',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  blockLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#141414',
    marginHorizontal: 24,
    marginBottom: 20,
  },
  // Stats
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  statBoxIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  statBoxValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  statBoxLabel: {
    color: '#444',
    fontSize: 10,
    textAlign: 'center',
  },
  // Emotion
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#141414',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 'auto',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emotionScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 12,
  },
  emotionBigScore: {
    fontSize: 52,
    fontWeight: '900',
    lineHeight: 56,
  },
  emotionMeta: {
    gap: 4,
  },
  emotionMax: {
    color: '#444',
    fontSize: 16,
    fontWeight: '600',
  },
  emotionLabelBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  emotionBarBg: {
    height: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  emotionBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  moodChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#141414',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#222',
  },
  moodChipText: {
    color: '#666',
    fontSize: 11,
  },
  // Quote
  quoteDecor: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 24,
  },
  quoteBox: {
    borderLeftWidth: 3,
    paddingLeft: 14,
    gap: 8,
  },
  quoteBodyText: {
    color: '#ddd',
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  quoteFooter: {
    color: '#444',
    fontSize: 11,
  },
  // Harsh
  harshSectionEmoji: {
    fontSize: 16,
  },
  systemGenBadge: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  systemGenText: {
    color: '#555',
    fontSize: 10,
  },
  harshBox: {
    backgroundColor: '#100505',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A1010',
    gap: 8,
  },
  harshBodyText: {
    color: '#cc8888',
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  harshFooter: {
    color: '#444',
    fontSize: 11,
  },
  // Achievement highlight
  achievementHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    overflow: 'hidden',
  },
  achievementHighlightEmoji: {
    fontSize: 28,
  },
  achievementHighlightInfo: {
    flex: 1,
    gap: 3,
  },
  achievementHighlightLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  achievementHighlightSub: {
    color: '#555',
    fontSize: 11,
  },
  // Achievement grid
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  achievementCell: {
    width: (CARD_WIDTH - 48 - 24) / 4,
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderWidth: 1,
  },
  achCellIcon: {
    fontSize: 20,
  },
  achCellLabel: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
  },
  achUnlockedDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  achievementProgress: {
    color: '#444',
    fontSize: 11,
    textAlign: 'right',
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#111',
  },
  footerLine: {
    height: 2,
    width: 48,
    borderRadius: 1,
  },
  footerTagline: {
    color: '#3A3A3A',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  footerBrand: {
    color: '#2A2A2A',
    fontSize: 10,
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080808' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: '#0D0D0D',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: '#fff', fontSize: FONT.lg, fontWeight: '700' },
  headerDate: {
    backgroundColor: '#1A1A1A',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  headerDateText: { color: '#888', fontSize: 12 },
  container: { paddingHorizontal: SPACING.lg },
  heroCard: {
    height: 200,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  heroBg: { ...StyleSheet.absoluteFillObject },
  heroContent: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.lg,
    right: SPACING.lg,
  },
  heroLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  heroPersonality: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 4 },
  heroEmoji: { fontSize: 28 },
  heroName: { fontSize: FONT.xl, fontWeight: '800' },
  heroTagline: { color: '#aaa', fontSize: FONT.sm },
  achievementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  achievementEmoji: { fontSize: 28 },
  achievementInfo: { flex: 1 },
  achievementTitle: { color: '#888', fontSize: 11, marginBottom: 2 },
  achievementLabel: { fontSize: FONT.md, fontWeight: '800' },
  achievementSub: { color: '#555', fontSize: 11, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  statValue: { fontSize: FONT.xl, fontWeight: '800' },
  statLabel: { color: '#555', fontSize: 11 },
  section: {
    backgroundColor: '#111',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    marginBottom: SPACING.md,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  sectionTitle: { color: '#fff', fontSize: FONT.md, fontWeight: '700' },
  sectionSub: { color: '#555', fontSize: FONT.sm, marginBottom: SPACING.md },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendText: { fontSize: 12, fontWeight: '600' },
  emotionRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3, marginBottom: SPACING.sm },
  emotionScore: { fontSize: FONT.hero, fontWeight: '900' },
  emotionMax: { color: '#555', fontSize: FONT.md },
  progressBar: {
    height: 8,
    backgroundColor: '#1E1E1E',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: { height: '100%', borderRadius: 4 },
  emotionLabel: { fontSize: FONT.sm, fontWeight: '600', marginBottom: SPACING.xs },
  moodTag: {
    backgroundColor: '#1E1E1E',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  moodTagText: { color: '#888', fontSize: 12 },
  quoteCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  quoteHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  quoteTitle: { fontSize: FONT.sm, fontWeight: '700' },
  quoteText: { color: '#eee', fontSize: FONT.md, lineHeight: 26, fontStyle: 'italic' },
  quoteSource: { color: '#444', fontSize: 11 },
  harshCard: {
    backgroundColor: '#180808',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#3A1010',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  harshHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  harshIcon: { fontSize: 18 },
  harshTitle: { flex: 1, color: '#E74C3C', fontSize: FONT.sm, fontWeight: '700' },
  harshBadge: {
    color: '#555',
    fontSize: 10,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  harshText: { color: '#ccc', fontSize: FONT.md, lineHeight: 24, fontStyle: 'italic' },
  harshSub: { color: '#444', fontSize: 11 },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  achievementItem: {
    width: '30%',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A1A1A',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#222',
  },
  achIcon: { fontSize: 22 },
  achLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  shareBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(8,8,8,0.97)',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  shareLabel: { color: '#555', fontSize: 12, textAlign: 'center' },
  shareButtons: { flexDirection: 'row', gap: SPACING.sm },
  shareBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm,
  },
  shareBtnIcon: { fontSize: 22 },
  shareBtnLabel: { fontSize: 12, fontWeight: '600' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'flex-end',
  },
  shareModalSheet: {
    backgroundColor: '#0D0D0D',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderTopWidth: 1,
    borderColor: '#1A1A1A',
    alignItems: 'center',
    gap: SPACING.md,
    maxHeight: '88%',
  },
  shareModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    marginBottom: SPACING.xs,
  },
  shareModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  shareModalTitle: { color: '#fff', fontSize: FONT.lg, fontWeight: '700' },
  shareModalSub: { color: '#555', fontSize: FONT.sm, marginTop: -SPACING.xs, textAlign: 'center' },
  previewScroll: {
    width: '100%',
    maxHeight: 360,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  previewScrollContent: {
    alignItems: 'center',
  },
  captureBtn: {
    width: '100%',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  captureBtnDisabled: { opacity: 0.6 },
  captureGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    minHeight: 52,
  },
  captureBtnText: { color: '#fff', fontSize: FONT.md, fontWeight: '700' },
  cancelShareBtn: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.xl },
  cancelShareText: { color: '#555', fontSize: FONT.sm },
});
