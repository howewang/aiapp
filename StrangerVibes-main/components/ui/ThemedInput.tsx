// Powered by OnSpace.AI
import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { BASE_THEME, SPACING, RADIUS, FONT } from '@/constants/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  accentColor?: string;
  rightElement?: React.ReactNode;
}

export function ThemedInput({ label, error, accentColor = '#00B4D8', rightElement, style, ...rest }: Props) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, { borderColor: error ? BASE_THEME.error : accentColor + '44' }]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#555"
          selectionColor={accentColor}
          {...rest}
        />
        {rightElement ? rightElement : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    color: '#aaa',
    fontSize: FONT.sm,
    marginBottom: SPACING.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    minHeight: 52,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: FONT.md,
    paddingVertical: SPACING.sm,
    includeFontPadding: false,
  },
  error: {
    color: BASE_THEME.error,
    fontSize: FONT.sm,
    marginTop: SPACING.xs,
  },
});
