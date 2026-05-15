import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AppLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  // Remove default web focus outline for inputs
  if (Platform.OS === 'web') {
    const style = document.createElement('style');
    style.textContent = `textarea, input { outline: none !important; }`;
    document.head.appendChild(style);
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.icon,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          marginTop: 10,
          fontSize: 11,
          fontWeight: '600',
          textAlign: 'center',
        },
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].appBG,
          borderTopColor: Colors[colorScheme ?? 'light'].border,
          borderTopWidth: 1,
          height: 72,
          paddingTop: 0,
          paddingBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol name="house.fill" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color }) => <IconSymbol name="inbox.fill" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol name="person.crop.circle.fill" size={24} color={color} />,
        }}
      />
      {/* All other routes set href: null to prevent tab bar appearance */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="messages/[id]" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="map" options={{ href: null }} />
      <Tabs.Screen name="volunteer-dashboard" options={{ href: null }} />
      <Tabs.Screen name="collaborator-dashboard" options={{ href: null }} />
      <Tabs.Screen name="finance-dashboard" options={{ href: null }} />
      <Tabs.Screen name="create-request" options={{ href: null }} />
      <Tabs.Screen name="location/[id]" options={{ href: null }} />
      <Tabs.Screen name="request/[id]" options={{ href: null }} />
      <Tabs.Screen name="category-picker" options={{ href: null }} />
    </Tabs>
  );
}