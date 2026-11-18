import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { ColorValue, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconName, TabIcon } from '@/components/TabIcons';
import { colors, shadow } from '@/theme';

function TabGlyph({ name, color, focused }: { name: IconName; color: ColorValue; focused: boolean }) {
  return (
    <View style={focused ? styles.activeWrap : styles.iconWrap}>
      <TabIcon name={name} color={color} />
    </View>
  );
}

function icon(name: IconName) {
  const render = ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <TabGlyph name={name} color={color} focused={focused} />
  );
  render.displayName = `TabIcon(${name})`;
  return render;
}

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#A19DB0',
        tabBarLabelStyle: styles.label,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarStyle: [styles.bar, { height: 62 + bottom, paddingBottom: bottom }],
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home') }} />
      <Tabs.Screen
        name="income"
        options={{ title: 'Income', tabBarIcon: icon('list') }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarButton: () => (
            <View style={styles.centerSlot}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Record income or purchase"
                onPress={() => router.push('/new')}
                style={({ pressed }) => [styles.centerButton, pressed && { opacity: 0.88 }]}
              >
                <TabIcon name="plus" color="#fff" size={28} />
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen name="supplies" options={{ title: 'Supplies', tabBarIcon: icon('store') }} />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: icon('settings') }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.card,
    borderTopWidth: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 8,
    position: 'absolute',
    ...shadow,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: -4 },
  },
  label: { fontSize: 11, fontWeight: '700' },
  iconWrap: { height: 30, justifyContent: 'center' },
  activeWrap: { height: 30, justifyContent: 'center' },
  centerSlot: { flex: 1, alignItems: 'center' },
  centerButton: {
    marginTop: -30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: colors.bg,
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
