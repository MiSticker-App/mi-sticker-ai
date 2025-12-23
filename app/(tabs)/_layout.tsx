// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { Sparkles, Grid } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderRadius: 30,
          height: 60,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          paddingBottom: 0,
        },
        tabBarActiveTintColor: '#a855f7',
        tabBarInactiveTintColor: '#52525b',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
      }}
    >
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, size }) => <Sparkles size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Gallery',
          tabBarIcon: ({ color, size }) => <Grid size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pack-detail"
        options={{
          href: null, // Ocultar del tab bar
        }}
      />
      <Tabs.Screen
        name="result"
        options={{
          href: null, // Ocultar del tab bar
        }}
      />
    </Tabs>
  );
}
