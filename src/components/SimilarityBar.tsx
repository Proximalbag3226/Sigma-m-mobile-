import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '../theme';

type Props = { value: number; threshold: number; color: string };

export function SimilarityBar({ value, threshold, color }: Props) {
  const fill = Math.max(0, Math.min(1, value)) * 100;
  const tick = Math.max(0, Math.min(1, threshold)) * 100;
  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${fill}%`, backgroundColor: color }]} />
        <View style={[styles.tick, { left: `${tick}%` }]} />
      </View>
      <View style={styles.legend}>
        <Text style={type.small}>0</Text>
        <Text style={type.small}>{`umbral ${threshold.toFixed(2)}`}</Text>
        <Text style={type.small}>1</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.line, overflow: 'visible' },
  fill: { height: 4, borderRadius: 2 },
  tick: { position: 'absolute', top: -4, width: 1.5, height: 12, backgroundColor: colors.ink },
  legend: { flexDirection: 'row', justifyContent: 'space-between' },
});
