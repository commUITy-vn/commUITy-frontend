import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';

export default function InboxScreen() {
  const theme = useTheme();
  const styles = useThemeStyles();

  return (
    <View style={[styles.container, { backgroundColor: theme.appBG }]}>
      <Text style={[styles.heading, { color: theme.text }]}>Inbox Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
  },
});