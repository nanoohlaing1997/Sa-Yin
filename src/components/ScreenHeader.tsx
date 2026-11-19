import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  /** Extra space below the content so following cards can overlap the header. */
  overlap?: number;
};

/** Brand-coloured banking-app header with rounded bottom corners. */
export function ScreenHeader({ title, subtitle, right, children, overlap = 0 }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.wrap,
        { paddingTop: insets.top + spacing(1.5), paddingBottom: spacing(2.5) + overlap },
      ]}
    >
      <View style={styles.circleA} />
      <View style={styles.row}>
        <View style={styles.titles}>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          <Text style={styles.title}>{title}</Text>
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    paddingHorizontal: spacing(2.5),
    overflow: 'hidden',
    gap: spacing(1.5),
  },
  // Soft decorative bubbles, like the patterned hero of a banking app.
  circleA: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titles: { flex: 1 },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  title: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
});
