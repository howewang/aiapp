// Powered by OnSpace.AI
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '@/hooks/useChat';
import { SPACING, RADIUS, FONT } from '@/constants/theme';

interface Props {
  message: ChatMessage;
  accentColor: string;
}

export function MessageBubble({ message, accentColor }: Props) {
  const isMe = message.role === 'me';

  return (
    <View style={[styles.wrapper, isMe ? styles.wrapperMe : styles.wrapperThem]}>
      <View
        style={[
          styles.bubble,
          isMe
            ? [styles.bubbleMe, { backgroundColor: accentColor }]
            : styles.bubbleThem,
        ]}
      >
        <Text style={[styles.text, isMe ? styles.textMe : styles.textThem]}>
          {message.text}
        </Text>
      </View>
      <Text style={styles.time}>{message.time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: SPACING.xs,
    maxWidth: '75%',
    paddingHorizontal: SPACING.md,
  },
  wrapperMe: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  wrapperThem: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  bubbleMe: {
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#1E1E1E',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: FONT.md,
    lineHeight: 22,
    includeFontPadding: false,
  },
  textMe: {
    color: '#fff',
  },
  textThem: {
    color: '#eee',
  },
  time: {
    fontSize: 10,
    color: '#555',
    marginTop: 2,
  },
});
