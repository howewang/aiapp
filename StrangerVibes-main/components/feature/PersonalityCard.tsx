// Powered by OnSpace.AI
import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { PersonalityTheme, RADIUS, SPACING, FONT } from '@/constants/theme';

interface Props {
  theme: PersonalityTheme;
  usageCount: number;
  rating: number;
  isSelected: boolean;
  isLocked: boolean;
  onPress: () => void;
  onUnlock: () => void;
}

export function PersonalityCard({ theme, usageCount, rating, isSelected, isLocked, onPress, onUnlock }: Props) {
  return (
    <Pressable
      onPress={isLocked ? undefined : onPress}
      style={({ pressed }) => [styles.pressable, !isLocked && pressed && styles.pressed]}
    >
      <LinearGradient
        colors={isSelected ? theme.gradient : isLocked ? ['#161616', '#101010'] : ['#1A1A1A', '#111111']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, isSelected && { borderColor: theme.primary, borderWidth: 2 }]}
      >
        {/* Lock overlay */}
        {isLocked ? (
          <View style={styles.lockOverlay}>
            <View style={styles.lockIconWrapper}>
              <MaterialIcons name="lock" size={22} color="#888" />
            </View>
            <Text style={styles.lockName}>{theme.name}</Text>
            <Text style={styles.lockEmoji}>{theme.emoji}</Text>
            <Pressable
              style={({ pressed }) => [styles.unlockBtn, pressed && styles.unlockBtnPressed]}
              onPress={onUnlock}
            >
              <LinearGradient
                colors={theme.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.unlockGradient}
              >
                <MaterialIcons name="workspace-premium" size={12} color="#fff" />
                <Text style={styles.unlockText}>解锁</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <>
            {isSelected ? (
              <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
                <MaterialIcons name="check" size={12} color="#fff" />
              </View>
            ) : null}
            <Text style={styles.emoji}>{theme.emoji}</Text>
            <Text style={[styles.name, { color: isSelected ? '#fff' : '#eee' }]}>{theme.name}</Text>
            <Text style={[styles.tagline, { color: isSelected ? 'rgba(255,255,255,0.8)' : '#666' }]}>
              {theme.tagline}
            </Text>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <MaterialIcons name="history" size={12} color={isSelected ? 'rgba(255,255,255,0.7)' : '#555'} />
                <Text style={[styles.statText, { color: isSelected ? 'rgba(255,255,255,0.8)' : '#666' }]}>
                  {usageCount}次
                </Text>
              </View>
              <View style={styles.stat}>
                <MaterialIcons name="star" size={12} color={rating > 0 ? (isSelected ? '#FFD700' : '#888') : '#444'} />
                <Text style={[styles.statText, { color: rating > 0 ? (isSelected ? '#FFD700' : '#888') : '#444' }]}>
                  {rating > 0 ? rating.toFixed(1) : '暂无'}
                </Text>
              </View>
            </View>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    minHeight: 148,
    borderWidth: 1,
    borderColor: '#222',
    position: 'relative',
  },
  pressable: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  selectedBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  name: {
    fontSize: FONT.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: SPACING.sm,
  },
  stats: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 11,
  },
  // Lock state
  lockOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 148 - SPACING.md * 2,
    gap: SPACING.xs,
  },
  lockIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  lockName: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  lockEmoji: {
    fontSize: 20,
    opacity: 0.4,
  },
  unlockBtn: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginTop: SPACING.xs,
  },
  unlockBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  unlockGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  unlockText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
