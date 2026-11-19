import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
};

/**
 * Light page header: small subtitle, large title, optional action on the
 * right, then any controls (e.g. the period switcher). Kept light so it sits
 * cleanly under the iPhone status bar.
 */
export function ScreenHeader({ title, subtitle, right, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing(1.5) }]}>
      <View style={styles.row}>
        <View style={styles.titles}>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing(2),
    paddingBottom: spacing(1.5),
    gap: spacing(1.75),
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titles: { flex: 1 },
  subtitle: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
});
