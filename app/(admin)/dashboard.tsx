import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useRouter } from 'expo-router';

const Dashboard = () => {
  const theme = useTheme();
  const styles = useGeneratedStyles();
  const router = useRouter();

  const stats = [
    { label: 'Total Users', value: '1,204' },
    { label: 'Pending Requests', value: '15' },
    { label: 'Open Reports', value: '3' },
    { label: 'System Health', value: '99%' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.header}>Admin Control Center</Text>
      <View style={styles.grid}>
        {stats.map((item, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.cardValue}>{item.value}</Text>
            <Text style={styles.cardLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.linksContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.linkButton,
            { backgroundColor: pressed ? theme.linkHover : theme.link },
          ]}
          onPress={() => router.push('/(admin)/users')}
        >
          <Text style={styles.linkText}>User Management</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.linkButton,
            { backgroundColor: pressed ? theme.linkHover : theme.link },
          ]}
          onPress={() => router.push('/(admin)/moderation')}
        >
          <Text style={styles.linkText}>Moderation Queue</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default Dashboard;

// Styles using theme hooks and multiples of 4/8 for spacing
const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.appBG,
    },
    contentContainer: {
      padding: 16,
    },
    header: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 16,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    card: {
      width: '48%',
      backgroundColor: theme.cardBG || theme.appBG,
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    cardValue: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text,
    },
    cardLabel: {
      fontSize: 14,
      color: theme.textSupporting,
    },
    linksContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    linkButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    linkText: {
      color: theme.linkText || '#fff',
      fontWeight: '500',
    },
  });

// Hook to generate styles with current theme
const useGeneratedStyles = () => {
  const theme = useTheme();
  return createStyles(theme);
};

// Replace useThemeStyles with generated styles in component
// (Assuming useThemeStyles returns same structure)
// This is a placeholder to respect UI guidelines.
