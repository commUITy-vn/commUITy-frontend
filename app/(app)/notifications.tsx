import { View, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export default function NotificationsScreen() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.appBG, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: theme.text, fontSize: 24, fontWeight: 'bold' }}>Notifications</Text>
    </View>
  );
}
