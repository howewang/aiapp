// Powered by OnSpace.AI
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useAlert } from '@/template';
import { StarRating } from '@/components';
import { PERSONALITY_THEMES, SPACING, FONT, RADIUS } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { currentTheme, currentPersonality } = useTheme();
  const { showAlert } = useAlert();

  const handleLogout = () => {
    showAlert('退出登录', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const totalChats = Object.values(user?.personalityUsage || {}).reduce((a, b) => a + b, 0);
  const avgRating =
    Object.values(user?.personalityRatings || {}).reduce((a, b) => a + b, 0) /
    Object.values(user?.personalityRatings || {}).length;

  const menuItems = [
    { icon: 'tune' as const, label: '偏好设置', sub: '通知、隐私' },
    { icon: 'shield' as const, label: '账号安全', sub: '手机号、密码' },
    { icon: 'help-outline' as const, label: '帮助中心', sub: '常见问题' },
    { icon: 'star-border' as const, label: '给我们评分', sub: '您的支持是我们的动力' },
  ];

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + SPACING.md, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <LinearGradient
          colors={[currentTheme.cardBg, '#111']}
          style={styles.profileCard}
        >
          <Image
            source={{ uri: user?.avatar }}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.nickname}>{user?.nickname}</Text>
            <View style={styles.loginBadge}>
              <MaterialIcons
                name={user?.loginMethod === 'wechat' ? 'chat' : 'phone'}
                size={12}
                color="#888"
              />
              <Text style={styles.loginMethod}>
                {user?.loginMethod === 'wechat' ? '微信登录' : user?.phone || '手机登录'}
              </Text>
            </View>
          </View>
          <Pressable style={[styles.editBtn, { borderColor: currentTheme.primary + '44' }]}>
            <MaterialIcons name="edit" size={16} color={currentTheme.primary} />
          </Pressable>
        </LinearGradient>

        {/* Global stats */}
        <View style={styles.globalStats}>
          <View style={styles.globalStat}>
            <Text style={[styles.globalStatValue, { color: currentTheme.primary }]}>{totalChats}</Text>
            <Text style={styles.globalStatLabel}>总聊天次数</Text>
          </View>
          <View style={styles.globalStat}>
            <Text style={[styles.globalStatValue, { color: '#FFD700' }]}>{avgRating.toFixed(1)}</Text>
            <Text style={styles.globalStatLabel}>平均评分</Text>
          </View>
          <View style={styles.globalStat}>
            <Text style={[styles.globalStatValue, { color: currentTheme.accent }]}>5</Text>
            <Text style={styles.globalStatLabel}>性格数量</Text>
          </View>
        </View>

        {/* Personality history */}
        <Text style={styles.sectionTitle}>性格档案</Text>
        <View style={styles.personalityList}>
          {Object.entries(PERSONALITY_THEMES).map(([key, theme]) => {
            const type = key as keyof typeof PERSONALITY_THEMES;
            const isActive = type === currentPersonality;
            return (
              <View
                key={key}
                style={[styles.personalityRow, isActive && { borderColor: theme.primary + '66', borderWidth: 1 }]}
              >
                <LinearGradient
                  colors={isActive ? theme.gradient : ['transparent', 'transparent']}
                  style={styles.personalityRowLeft}
                >
                  <Text style={styles.personalityEmoji}>{theme.emoji}</Text>
                </LinearGradient>
                <View style={styles.personalityRowInfo}>
                  <View style={styles.personalityRowHeader}>
                    <Text style={styles.personalityRowName}>{theme.name}</Text>
                    {isActive ? (
                      <View style={[styles.activeBadge, { backgroundColor: theme.primary }]}>
                        <Text style={styles.activeBadgeText}>当前</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.personalityRowSub}>使用 {user?.personalityUsage[type] || 0} 次</Text>
                </View>
                <View style={styles.personalityRowRight}>
                  <StarRating rating={user?.personalityRatings[type] || 0} size={12} />
                  <Text style={styles.ratingText}>{(user?.personalityRatings[type] || 0).toFixed(1)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Menu */}
        <Text style={styles.sectionTitle}>设置</Text>
        <View style={styles.menuCard}>
          {menuItems.map((item, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.pressed,
                i < menuItems.length - 1 && styles.menuBorder,
              ]}
            >
              <View style={[styles.menuIcon, { backgroundColor: currentTheme.primary + '22' }]}>
                <MaterialIcons name={item.icon} size={18} color={currentTheme.primary} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color="#444" />
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>退出登录</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080808' },
  container: { paddingHorizontal: SPACING.lg },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  profileInfo: { flex: 1 },
  nickname: { color: '#fff', fontSize: FONT.lg, fontWeight: '700', marginBottom: 4 },
  loginBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  loginMethod: { color: '#666', fontSize: FONT.sm },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  globalStats: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  globalStat: { flex: 1, alignItems: 'center' },
  globalStatValue: { fontSize: FONT.xxl, fontWeight: '800' },
  globalStatLabel: { color: '#555', fontSize: 11, marginTop: 2 },
  sectionTitle: { color: '#888', fontSize: FONT.sm, fontWeight: '600', marginBottom: SPACING.sm, letterSpacing: 0.5 },
  personalityList: {
    backgroundColor: '#111',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    marginBottom: SPACING.lg,
  },
  personalityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    margin: 4,
  },
  personalityRowLeft: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personalityEmoji: { fontSize: 20 },
  personalityRowInfo: { flex: 1 },
  personalityRowHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: 2 },
  personalityRowName: { color: '#eee', fontSize: FONT.md, fontWeight: '600' },
  activeBadge: { borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 },
  activeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  personalityRowSub: { color: '#555', fontSize: FONT.sm },
  personalityRowRight: { alignItems: 'center', gap: 2 },
  ratingText: { color: '#FFD700', fontSize: 11, fontWeight: '600' },
  menuCard: {
    backgroundColor: '#111',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    marginBottom: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  menuIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1 },
  menuLabel: { color: '#eee', fontSize: FONT.md, fontWeight: '500' },
  menuSub: { color: '#555', fontSize: FONT.sm },
  pressed: { opacity: 0.7 },
  logoutBtn: {
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#2A1A1A',
    backgroundColor: '#1A0808',
    marginBottom: SPACING.xl,
  },
  logoutText: { color: '#FF4444', fontSize: FONT.md, fontWeight: '600' },
});
