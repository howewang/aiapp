// Powered by OnSpace.AI
// Chat settings page — WeChat-style, with personality rating
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAlert } from '@/template';
import { ratePersonality, reportUser } from '@/services/sessionService';
import { PERSONALITY_THEMES, SPACING, FONT, RADIUS } from '@/constants/theme';

export default function ChatSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, nickname, avatar, personality, personalityKey, sessionId: session_id } = useLocalSearchParams<{
    id: string;
    nickname: string;
    avatar: string;
    personality: string;
    personalityKey: string;
    sessionId?: string;
  }>();
  const { currentTheme } = useTheme();
  const { showAlert } = useAlert();

  const [muteNotif, setMuteNotif] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  const avatarUri = avatar ?? `https://i.pravatar.cc/150?u=${id}`;
  const displayNickname = nickname ?? '神秘旅人';
  const personalityDisplay = personality ?? '未知性格';
  const pKey = personalityKey ?? 'joyful';
  const personalityTheme = PERSONALITY_THEMES[pKey as keyof typeof PERSONALITY_THEMES];

  const handleSubmitRating = async () => {
    if (selectedRating === 0) {
      showAlert('请选择评分', '点击星星给对方的性格打分');
      return;
    }
    if (!id) return;
    setRatingLoading(true);
    const success = await ratePersonality(id, pKey, selectedRating);
    setRatingLoading(false);
    if (success) {
      setRatingSubmitted(true);
      showAlert('评分成功', `已为「${personalityDisplay}」打了 ${selectedRating} 分，评分已记录至服务器`);
    } else {
      showAlert('评分失败', '请稍后重试');
    }
  };

  const handleClearChat = () => {
    showAlert('清空聊天记录', '此操作不可恢复，确定清空吗？', [
      { text: '取消', style: 'cancel' },
      { text: '清空', style: 'destructive', onPress: () => showAlert('已清空', '聊天记录已清空') },
    ]);
  };

  const handleReport = () => {
    showAlert('举报用户', '你的举报将帮助我们改善社区环境', [
      { text: '取消', style: 'cancel' },
      {
        text: '举报',
        style: 'destructive',
        onPress: async () => {
          if (!id) return;
          const sessionId = session_id ? parseInt(String(session_id), 10) : undefined;
          const ok = await reportUser(id, sessionId ?? null, '用户举报');
          if (ok) {
            showAlert('举报成功', '感谢你的反馈，我们会尽快处理');
          } else {
            showAlert('举报失败', '请稍后重试');
          }
        },
      },
    ]);
  };

  const handleBlock = () => {
    showAlert('屏蔽用户', '屏蔽后将不再与此用户匹配', [
      { text: '取消', style: 'cancel' },
      {
        text: '屏蔽',
        style: 'destructive',
        onPress: () => {
          router.back();
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.xs }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back-ios" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>聊天设置</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* User card */}
        <Pressable
          style={styles.userCard}
          onPress={() =>
            router.push(
              `/user/${id}?nickname=${encodeURIComponent(displayNickname)}&avatar=${encodeURIComponent(avatarUri)}&personality=${encodeURIComponent(personalityDisplay)}`
            )
          }
        >
          <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" transition={200} />
          <View style={styles.userInfo}>
            <Text style={styles.userNickname}>{displayNickname}</Text>
            <View style={styles.personalityRow}>
              <Text style={styles.personalityEmoji}>{personalityTheme?.emoji ?? '✨'}</Text>
              <Text style={[styles.personalityText, { color: personalityTheme?.primary ?? currentTheme.primary }]}>
                {personalityDisplay}
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#444" />
        </Pressable>

        {/* Personality Rating Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>性格评分</Text>
          <View style={styles.ratingBlock}>
            <LinearGradient
              colors={[(personalityTheme?.primary ?? currentTheme.primary) + '15', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.ratingQuestion}>
              你觉得他的「{personalityDisplay}」表现如何？
            </Text>
            <Text style={styles.ratingHint}>评分将实时记录到服务器，影响对方的综合评分</Text>
            {ratingSubmitted ? (
              <View style={styles.ratingDone}>
                <MaterialIcons name="check-circle" size={32} color={personalityTheme?.primary ?? currentTheme.primary} />
                <Text style={[styles.ratingDoneText, { color: personalityTheme?.primary ?? currentTheme.primary }]}>
                  已提交 {selectedRating} 分评价
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      style={({ pressed }) => [styles.starBtn, pressed && { transform: [{ scale: 1.3 }] }]}
                      onPress={() => setSelectedRating(star)}
                      hitSlop={8}
                    >
                      <MaterialIcons
                        name={star <= selectedRating ? 'star' : 'star-border'}
                        size={36}
                        color={star <= selectedRating ? '#FFD700' : '#333'}
                      />
                    </Pressable>
                  ))}
                </View>
                {selectedRating > 0 && (
                  <Text style={styles.ratingLabel}>
                    {['', '差劲', '一般', '不错', '很好', '非常棒'][selectedRating]}
                  </Text>
                )}
                <Pressable
                  style={({ pressed }) => [
                    styles.submitRatingBtn,
                    { backgroundColor: selectedRating > 0 ? (personalityTheme?.primary ?? currentTheme.primary) : '#1A1A1A' },
                    pressed && styles.pressed,
                  ]}
                  onPress={handleSubmitRating}
                  disabled={ratingLoading}
                >
                  <Text style={[styles.submitRatingText, selectedRating === 0 && { color: '#444' }]}>
                    {ratingLoading ? '提交中...' : '提交评分'}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>偏好设置</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: currentTheme.primary + '22' }]}>
                  <MaterialIcons name="notifications-off" size={18} color={currentTheme.primary} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>消息免打扰</Text>
                  <Text style={styles.settingSub}>关闭此对话的通知</Text>
                </View>
              </View>
              <Switch
                value={muteNotif}
                onValueChange={setMuteNotif}
                trackColor={{ false: '#1E1E1E', true: currentTheme.primary + '88' }}
                thumbColor={muteNotif ? currentTheme.primary : '#555'}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#FFD700' + '22' }]}>
                  <MaterialIcons name="push-pin" size={18} color="#FFD700" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>置顶聊天</Text>
                  <Text style={styles.settingSub}>保持此对话在列表顶部</Text>
                </View>
              </View>
              <Switch
                value={pinned}
                onValueChange={setPinned}
                trackColor={{ false: '#1E1E1E', true: '#FFD700' + '88' }}
                thumbColor={pinned ? '#FFD700' : '#555'}
              />
            </View>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>更多操作</Text>
          <View style={styles.card}>
            <Pressable
              style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
              onPress={() =>
                router.push(
                  `/user/${id}?nickname=${encodeURIComponent(displayNickname)}&avatar=${encodeURIComponent(avatarUri)}&personality=${encodeURIComponent(personalityDisplay)}`
                )
              }
            >
              <View style={[styles.settingIcon, { backgroundColor: '#0096C7' + '22' }]}>
                <MaterialIcons name="person" size={18} color="#0096C7" />
              </View>
              <Text style={styles.settingLabel}>查看资料</Text>
              <MaterialIcons name="chevron-right" size={18} color="#444" style={styles.chevron} />
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
              onPress={handleClearChat}
            >
              <View style={[styles.settingIcon, { backgroundColor: '#FF9800' + '22' }]}>
                <MaterialIcons name="delete-outline" size={18} color="#FF9800" />
              </View>
              <Text style={styles.settingLabel}>清空聊天记录</Text>
              <MaterialIcons name="chevron-right" size={18} color="#444" style={styles.chevron} />
            </Pressable>
          </View>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Pressable
              style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
              onPress={handleReport}
            >
              <View style={[styles.settingIcon, { backgroundColor: '#FF9800' + '22' }]}>
                <MaterialIcons name="flag" size={18} color="#FF9800" />
              </View>
              <Text style={[styles.settingLabel, { color: '#FF9800' }]}>举报用户</Text>
              <MaterialIcons name="chevron-right" size={18} color="#444" style={styles.chevron} />
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
              onPress={handleBlock}
            >
              <View style={[styles.settingIcon, { backgroundColor: '#FF4444' + '22' }]}>
                <MaterialIcons name="block" size={18} color="#FF4444" />
              </View>
              <Text style={[styles.settingLabel, { color: '#FF4444' }]}>屏蔽此用户</Text>
              <MaterialIcons name="chevron-right" size={18} color="#444" style={styles.chevron} />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080808' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingBottom: SPACING.md,
    backgroundColor: '#0D0D0D', borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: FONT.md, fontWeight: '700' },
  container: { paddingHorizontal: SPACING.lg, gap: SPACING.md, paddingTop: SPACING.md },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: '#111', borderRadius: RADIUS.xl,
    padding: SPACING.md, borderWidth: 1, borderColor: '#1E1E1E',
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  userInfo: { flex: 1 },
  userNickname: { color: '#fff', fontSize: FONT.md, fontWeight: '700', marginBottom: 4 },
  personalityRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  personalityEmoji: { fontSize: 14 },
  personalityText: { fontSize: FONT.sm, fontWeight: '600' },
  section: { gap: SPACING.xs },
  sectionTitle: { color: '#555', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, paddingLeft: 4 },
  card: {
    backgroundColor: '#111', borderRadius: RADIUS.xl,
    overflow: 'hidden', borderWidth: 1, borderColor: '#1E1E1E',
  },
  ratingBlock: {
    backgroundColor: '#111', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: '#1E1E1E',
    padding: SPACING.lg, alignItems: 'center', gap: SPACING.sm, overflow: 'hidden',
  },
  ratingQuestion: { color: '#eee', fontSize: FONT.md, fontWeight: '600', textAlign: 'center' },
  ratingHint: { color: '#555', fontSize: 11, textAlign: 'center' },
  starsRow: { flexDirection: 'row', gap: SPACING.sm, paddingVertical: SPACING.sm },
  starBtn: { padding: 4 },
  ratingLabel: { color: '#FFD700', fontSize: FONT.sm, fontWeight: '700' },
  submitRatingBtn: {
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm,
    minWidth: 120, alignItems: 'center', marginTop: SPACING.xs,
  },
  submitRatingText: { color: '#fff', fontSize: FONT.md, fontWeight: '700' },
  ratingDone: { alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md },
  ratingDoneText: { fontSize: FONT.md, fontWeight: '700' },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.md, gap: SPACING.md,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  settingIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { color: '#eee', fontSize: FONT.md },
  settingSub: { color: '#555', fontSize: 11, marginTop: 1 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md,
  },
  chevron: { marginLeft: 'auto' },
  divider: { height: 1, backgroundColor: '#1A1A1A', marginLeft: SPACING.md + 36 + SPACING.md },
  pressed: { opacity: 0.7 },
});
