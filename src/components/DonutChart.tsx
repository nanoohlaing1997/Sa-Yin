import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { colors } from '@/theme';

export type DonutSlice = { key: string; value: number; color: string };

type Props = {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
};

/**
 * Ring chart drawn with stroke dash offsets — one <Circle> per slice, each
 * dashed to its own arc length and rotated to where the previous slice ended.
 */
export function DonutChart({
  slices,
  size = 180,
  thickness = 22,
  centerLabel,
  centerValue,
}: Props) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  let offset = 0;
  const arcs = total
    ? slices.map((slice) => {
        const length = (slice.value / total) * circumference;
        const arc = { ...slice, length, offset };
        offset += length;
        return arc;
      })
    : [];

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* -90° so the first slice starts at 12 o'clock. */}
        <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.border}
            strokeWidth={thickness}
            fill="none"
          />
          {arcs.map((arc) => (
            <Circle
              key={arc.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={arc.color}
              strokeWidth={thickness}
              strokeDasharray={`${arc.length} ${circumference - arc.length}`}
              strokeDashoffset={-arc.offset}
              strokeLinecap="butt"
              fill="none"
            />
          ))}
        </G>
      </Svg>
      <View style={styles.center} pointerEvents="none">
        {!!centerLabel && <Text style={styles.centerLabel}>{centerLabel}</Text>}
        {!!centerValue && (
          <Text style={styles.centerValue} numberOfLines={1} adjustsFontSizeToFit>
            {centerValue}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  centerValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 12,
  },
});
