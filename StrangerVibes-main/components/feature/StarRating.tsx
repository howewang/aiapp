// Powered by OnSpace.AI
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Props {
  rating: number;
  size?: number;
  color?: string;
}

export function StarRating({ rating, size = 16, color = '#FFD700' }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.floor(rating);
        const half = !filled && star <= Math.ceil(rating) && rating % 1 >= 0.5;
        return (
          <MaterialIcons
            key={star}
            name={filled ? 'star' : half ? 'star-half' : 'star-border'}
            size={size}
            color={color}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
});
