// Powered by OnSpace.AI
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useChat } from '@/hooks/useChat';
import { MessageBubble } from '@/components';
import { SPACING, FONT, RADIUS } from '@/constants/theme';

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, nickname, avatar, personality, personalityKey, sessionId: sessionIdParam } = useLocalSearchParams<{
    id: string;
    nickname: string;
    avatar: string;
    personality: string;
    personalityKey: string;
    sessionId?: string;
  }>();
  const { currentTheme } = useTheme();
  const sessionId = sessionIdParam ?? undefined;
  const { messages, inputText, setInputText, sendMessage, isTyping } = useChat(id || '', sessionId);
  const flatListRef = useRef<FlatList>(null);

  const avatarUri = avatar ?? `https://i.pravatar.cc/150?u=${id}`;
  const displayNickname = nickname ?? '神秘旅人';
  const personalityDisplay = personality ?? '';
  const pKey = personalityKey ?? 'joyful';

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  const goToSettings = () => {
    const params = new URLSearchParams({
      nickname: displayNickname,
      avatar: avatarUri,
      personality: personalityDisplay,
      personalityKey: pKey,
    });
    if (sessionId) params.set('sessionId', String(sessionId));
    router.push(`/chat-settings/${id}?${params.toString()}`);
  };

  const goToUserProfile = () => {
    router.push(
      `/user/${id}?nickname=${encodeURIComponent(displayNickname)}&avatar=${encodeURIComponent(avatarUri)}&personality=${encodeURIComponent(personalityDisplay)}`
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.xs }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back-ios" size={20} color="#fff" />
        </Pressable>

        {/* Tappable avatar → user profile */}
        <Pressable onPress={goToUserProfile} style={styles.headerAvatarBtn}>
          <Image
            source={{ uri: avatarUri }}
            style={styles.headerAvatar}
            contentFit="cover"
            transition={200}
          />
        </Pressable>

        <Pressable style={styles.headerInfo} onPress={goToUserProfile}>
          <Text style={styles.headerName}>{displayNickname}</Text>
          <Text style={[styles.headerPersonality, { color: currentTheme.accent }]}>
            {personalityDisplay}
          </Text>
        </Pressable>

        {/* Right-side action button → chat settings */}
        <Pressable style={styles.headerAction} onPress={goToSettings}>
          <MaterialIcons name="more-vert" size={22} color="#888" />
        </Pressable>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble message={item} accentColor={currentTheme.primary} />
        )}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isTyping ? (
            <View style={styles.typingIndicator}>
              <View style={styles.typingBubble}>
                <View style={[styles.typingDot, { backgroundColor: currentTheme.primary }]} />
                <View style={[styles.typingDot, { backgroundColor: currentTheme.primary, opacity: 0.7 }]} />
                <View style={[styles.typingDot, { backgroundColor: currentTheme.primary, opacity: 0.4 }]} />
              </View>
            </View>
          ) : null
        }
      />

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + SPACING.sm }]}>
        <View style={[styles.inputWrapper, { borderColor: currentTheme.primary + '44' }]}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="说点什么..."
            placeholderTextColor="#444"
            multiline
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={() => sendMessage(inputText)}
            selectionColor={currentTheme.primary}
          />
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            { backgroundColor: inputText.trim() ? currentTheme.primary : '#1A1A1A' },
            pressed && styles.pressed,
          ]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim()}
        >
          <MaterialIcons name="send" size={18} color={inputText.trim() ? '#fff' : '#444'} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

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
    gap: SPACING.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerAvatarBtn: { borderRadius: 20 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerInfo: { flex: 1 },
  headerName: { color: '#fff', fontSize: FONT.md, fontWeight: '700' },
  headerPersonality: { fontSize: FONT.sm },
  headerAction: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  messageList: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.sm },
  typingIndicator: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  typingBubble: {
    flexDirection: 'row', gap: 4,
    backgroundColor: '#1E1E1E', borderRadius: RADIUS.lg,
    borderBottomLeftRadius: 4,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    alignSelf: 'flex-start', alignItems: 'center',
  },
  typingDot: { width: 8, height: 8, borderRadius: 4 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.sm,
    backgroundColor: '#0D0D0D', borderTopWidth: 1, borderTopColor: '#1A1A1A',
    gap: SPACING.sm,
  },
  inputWrapper: {
    flex: 1, backgroundColor: '#1A1A1A', borderRadius: RADIUS.xl,
    borderWidth: 1, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    maxHeight: 120,
  },
  input: { color: '#fff', fontSize: FONT.md, lineHeight: 22, includeFontPadding: false },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
});
