import { Tabs } from 'expo-router';
import React from 'react';
import { ColorValue, Text } from 'react-native';

import { MonthProvider } from '@/lib/month-context';
import { colors } from '@/theme';

function TabIcon({ emoji, color }: { emoji: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <MonthProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          sceneStyle: { backgroundColor: colors.bg },
          tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Report',
            tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} />,
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: 'Transactions',
            tabBarIcon: ({ color }) => <TabIcon emoji="🧾" color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <TabIcon emoji="⚙️" color={color} />,
          }}
        />
      </Tabs>
    </MonthProvider>
  );
}
