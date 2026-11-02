import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '../theme';

export function StepIndicator({ labels, current }: { labels: readonly string[]; current: number }) {
  return (
    <View style={styles.row}>
      {labels.map((label, i) => (
        <View key={label} style={styles.item}>
          <View style={[styles.bar, { backgroundColor: i <= current ? colors.ink : colors.line }]} />
          <Text style={[type.label, styles.text, i === current && { color: colors.ink }]} numberOfLines={1}>
            {`0${i + 1}  ${label}`}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  item: { flex: 1, gap: 8 },
  bar: { height: 2, borderRadius: 1 },
  text: { fontSize: 10, letterSpacing: 0.8 },
});
