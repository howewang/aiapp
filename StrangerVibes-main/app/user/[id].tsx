// Powered by OnSpace.AI
// User profile page — shown when tapping a matched user's avatar in chat
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSupabaseClient } from '@/template';
import { useTheme } from '@/hooks/useTheme';
import { StarRating } from '@/components';
import { PERSONALITY_THEMES, SPACING, FONT, RADIUS } from '@/constants/theme';

interface UserStat {
  personality_type: string;
  usage_count: number;
  total_rating: number;
  rating_count: number;
}

interface ProfileData {
  id: string;
  nickname: string;
  avatar: string;
  bio: string;
  personality: string;
  personalityDisplay: string;
  stats: UserStat[];
}

export default function UserProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, nickname, avatar, personality } = useLocalSearchParams<{
    id: string;
    nickname: string;
    avatar: string;
    personality: string;
  }>();
  const { currentTheme } = useTheme();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: stats } = await supabase
        .from('personality_stats')
        .select('personality_type, usage_count, total_rating, rating_count')
        .eq('user_id', id);

      setProfile({
        id: id ?? '',
        nickname: nickname ?? '神秘旅人',
        avatar: avatar ?? `https://i.pravatar.cc/150?u=${id}`,
        bio: '这个人很神秘，什么都没留下',
        personality: 'joyful',
        personalityDisplay: personality ?? '未知性格',
        stats: stats ?? [],
      });
    } catch (e) {
      console.error('loadProfile error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.errorText}>无法加载用户信息</Text>
      </View>
    );
  }

  const personalityTheme = PERSONALITY_THEMES[profile.personality as keyof typeof PERSONALITY_THEMES];
  const primaryStat = profile.stats.find((s) => s.personality_type === profile.personality);
  const avgRating = primaryStat && primaryStat.rating_count > 0
    ? primaryStat.total_rating / primaryStat.rating_count
    : 0;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.xs }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back-ios" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>用户资料</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Hero section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={personalityTheme ? personalityTheme.gradient : ['#1A1A1A', '#111']}
            style={styles.heroBg}
          />
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: profile.avatar }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
            <View style={[styles.onlineDot, { backgroundColor: personalityTheme?.primary ?? currentTheme.primary }]} />
          </View>
          <Text style={styles.nickname}>{profile.nickname}</Text>
          <View style={[styles.personalityBadge, { backgroundColor: (personalityTheme?.primary ?? currentTheme.primary) + '33', borderColor: (personalityTheme?.primary ?? currentTheme.primary) + '66' }]}>
            <Text style={styles.personalityEmoji}>{personalityTheme?.emoji ?? '✨'}</Text>
            <Text style={[styles.personalityText, { color: personalityTheme?.primary ?? currentTheme.primary }]}>
              {profile.personalityDisplay}
            </Text>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.bioCard}>
          <Text style={styles.bioLabel}>个人简介</Text>
          <Text style={styles.bioText}>{profile.bio}</Text>
        </View>

        {/* Rating summary */}
        <View style={styles.ratingCard}>
          <View style={styles.ratingLeft}>
            <Text style={[styles.ratingScore, { color: personalityTheme?.primary ?? currentTheme.primary }]}>
              {avgRating > 0 ? avgRating.toFixed(1) : '--'}
            </Text>
            <Text style={styles.ratingLabel}>综合评分</Text>
          </View>
          <View style={styles.ratingDivider} />
          <View style={styles.ratingRight}>
            {avgRating > 0 ? (
              <>
                <StarRating rating={avgRating} size={16} />
                <Text style={styles.ratingCount}>
                  {primaryStat?.rating_count ?? 0} 人评价
                </Text>
              </>
            ) : (
              <Text style={styles.noRatingText}>暂无评分</Text>
            )}
            <Text style={styles.usageCount}>
              使用 {primaryStat?.usage_count ?? 0} 次
            </Text>
          </View>
        </View>

        {/* Personality stats */}
        {profile.stats.length > 0 && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>性格使用记录</Text>
            {profile.stats.map((stat) => {
              const theme = PERSONALITY_THEMES[stat.personality_type as keyof typeof PERSONALITY_THEMES];
              const statRating = stat.rating_count > 0 ? stat.total_rating / stat.rating_count : 0;
              return (
                <View key={stat.personality_type} style={styles.statRow}>
                  <View style={[styles.statEmoji, { backgroundColor: (theme?.primary ?? '#888') + '22' }]}>
                    <Text>{theme?.emoji ?? '·'}</Text>
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statName}>{theme?.name ?? stat.personality_type}</Text>
                    <Text style={styles.statSub}>使用 {stat.usage_count} 次</Text>
                  </View>
                  <View style={styles.statRight}>
                    {statRating > 0 ? (
                      <>
                        <StarRating rating={statRating} size={11} />
                        <Text style={[styles.statRating, { color: theme?.primary ?? '#888' }]}>
                          {statRating.toFixed(1)}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.noRatingSmall}>暂无评分</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [styles.chatBtn, pressed && styles.pressed]}
          onPress={() => router.back()}
        >
          <LinearGradient
            colors={personalityTheme ? personalityTheme.gradient : currentTheme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.chatBtnGradient}
          >
            <MaterialIcons name="chat" size={18} color="#fff" />
            <Text style={styles.chatBtnText}>继续聊天</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080808' },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#555', fontSize: FONT.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: '#0D0D0D',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: FONT.md, fontWeight: '700' },
  container: { paddingHorizontal: SPACING.lg, gap: SPACING.md },
  heroSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginTop: SPACING.md,
  },
  heroBg: { ...StyleSheet.absoluteFillObject, opacity: 0.25 },
  avatarWrapper: { position: 'relative', marginBottom: SPACING.md },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)' },
  onlineDot: {
    position: 'absolute', bottom: 4, right: 4,
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: '#080808',
  },
  nickname: { color: '#fff', fontSize: FONT.xl, fontWeight: '800', marginBottom: SPACING.sm },
  personalityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 6,
  },
  personalityEmoji: { fontSize: 16 },
  personalityText: { fontSize: FONT.sm, fontWeight: '700' },
  bioCard: {
    backgroundColor: '#111', borderRadius: RADIUS.xl,
    padding: SPACING.lg, borderWidth: 1, borderColor: '#1E1E1E',
  },
  bioLabel: { color: '#555', fontSize: 11, fontWeight: '600', marginBottom: SPACING.xs, letterSpacing: 0.5 },
  bioText: { color: '#ccc', fontSize: FONT.md, lineHeight: 24 },
  ratingCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: RADIUS.xl,
    padding: SPACING.lg, borderWidth: 1, borderColor: '#1E1E1E',
    gap: SPACING.lg,
  },
  ratingLeft: { alignItems: 'center', minWidth: 60 },
  ratingScore: { fontSize: 36, fontWeight: '800' },
  ratingLabel: { color: '#555', fontSize: 11, marginTop: 2 },
  ratingDivider: { width: 1, height: 48, backgroundColor: '#1E1E1E' },
  ratingRight: { flex: 1, gap: 4 },
  ratingCount: { color: '#555', fontSize: 12 },
  noRatingText: { color: '#444', fontSize: FONT.sm },
  usageCount: { color: '#555', fontSize: 12 },
  statsSection: { gap: SPACING.sm },
  sectionTitle: { color: '#555', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  statRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: '#111', borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: '#1A1A1A',
  },
  statEmoji: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statInfo: { flex: 1 },
  statName: { color: '#eee', fontSize: FONT.sm, fontWeight: '600' },
  statSub: { color: '#555', fontSize: 11 },
  statRight: { alignItems: 'flex-end', gap: 2 },
  statRating: { fontSize: 11, fontWeight: '700' },
  noRatingSmall: { color: '#444', fontSize: 11 },
  chatBtn: { borderRadius: RADIUS.full, overflow: 'hidden', marginTop: SPACING.sm },
  chatBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.md, minHeight: 52,
  },
  chatBtnText: { color: '#fff', fontSize: FONT.md, fontWeight: '700' },
  pressed: { opacity: 0.85 },
});
