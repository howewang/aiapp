// Powered by OnSpace.AI
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { getTodayMatches, DailyMatchRecord } from '@/services/sessionService';
import { PERSONALITY_THEMES } from '@/constants/theme';
import { SPACING, FONT, RADIUS } from '@/constants/theme';

function formatTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}小时前`;
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

export default function ChatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const { user } = useAuth();

  const [matches, setMatches] = useState<DailyMatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = useCallback(async () => {
    try {
      const data = await getTodayMatches();
      setMatches(data);
    } catch (e) {
      console.error('loadMatches error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadMatches();
    else setLoading(false);
  }, [user]);

  // Refresh every time this tab gains focus (e.g. after a match completes)
  useFocusEffect(
    useCallback(() => {
      if (user) loadMatches();
    }, [user, loadMatches])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  const renderItem = ({ item }: { item: DailyMatchRecord }) => {
    const avatarUri = item.matched_avatar || `https://i.pravatar.cc/150?u=${item.matched_user_id}`;
    return (
      <Pressable
        style={({ pressed }) => [styles.chatItem, pressed && styles.pressed]}
        onPress={() => {
          const pKey = item.matched_personality;
          const pTheme = PERSONALITY_THEMES[pKey as keyof typeof PERSONALITY_THEMES];
          const pDisplay = pTheme?.name ?? pKey;
          const params = new URLSearchParams({
            nickname: item.matched_nickname,
            avatar: avatarUri,
            personality: pDisplay,
            personalityKey: pKey,
          });
          if (item.chat_session_id != null) params.set('sessionId', String(item.chat_session_id));
          router.push(`/chat/${item.matched_user_id}?${params.toString()}`);
        }}
      >
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
          {/* Online dot — today's matches are always "online" */}
          <View style={[styles.onlineDot, { backgroundColor: currentTheme.primary }]} />
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatRow}>
            <Text style={styles.nickname}>{item.matched_nickname}</Text>
            <Text style={styles.chatTime}>{formatTime(item.last_message_at)}</Text>
          </View>
          <View style={styles.chatRow}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.last_message || '开始聊天吧…'}
            </Text>
          </View>
          <View style={styles.personalityTag}>
            <Text style={[styles.personalityText, { color: currentTheme.accent }]}>
              {PERSONALITY_THEMES[item.matched_personality as keyof typeof PERSONALITY_THEMES]?.name ?? item.matched_personality}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <View>
          <Text style={styles.headerTitle}>今日消息</Text>
          <Text style={styles.headerSub}>每天凌晨3点刷新 · 哈哈只保留今日记录</Text>
        </View>
        <Pressable style={styles.headerIcon} onPress={() => loadMatches()}>
          <MaterialIcons name="refresh" size={22} color="#888" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={currentTheme.primary} />
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>今天还没有匹配</Text>
          <Text style={styles.emptySub}>去首页开始随机匹配，认识新的陌生人吧</Text>
          <Pressable
            style={[styles.goMatchBtn, { backgroundColor: currentTheme.primary + '22', borderColor: currentTheme.primary + '55' }]}
            onPress={() => router.push('/(tabs)')}
          >
            <MaterialIcons name="shuffle" size={16} color={currentTheme.primary} />
            <Text style={[styles.goMatchText, { color: currentTheme.primary }]}>去匹配</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={currentTheme.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <MaterialIcons name="people" size={14} color="#555" />
              <Text style={styles.listHeaderText}>今日匹配了 {matches.length} 位陌生人</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080808' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerTitle: { color: '#fff', fontSize: FONT.xl, fontWeight: '800' },
  headerSub: { color: '#3A3A3A', fontSize: 11, marginTop: 2 },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.sm },
  emptyTitle: { color: '#eee', fontSize: FONT.lg, fontWeight: '700', textAlign: 'center' },
  emptySub: { color: '#555', fontSize: FONT.sm, textAlign: 'center', lineHeight: 22 },
  goMatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
  },
  goMatchText: { fontSize: FONT.sm, fontWeight: '700' },
  list: { paddingVertical: SPACING.sm },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  listHeaderText: { color: '#555', fontSize: 12 },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    gap: SPACING.md,
  },
  pressed: { backgroundColor: '#111' },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#080808',
  },
  chatInfo: { flex: 1 },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  nickname: { color: '#eee', fontSize: FONT.md, fontWeight: '600' },
  chatTime: { color: '#444', fontSize: 11 },
  lastMessage: { flex: 1, color: '#666', fontSize: FONT.sm, marginRight: SPACING.sm },
  personalityTag: { marginTop: 2 },
  personalityText: { fontSize: 11, fontWeight: '500' },
  separator: {
    height: 1,
    backgroundColor: '#111',
    marginLeft: 52 + SPACING.lg + SPACING.md,
  },
});
