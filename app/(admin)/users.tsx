import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useRouter } from 'expo-router';

const dummyUsers = [
  { id: '1', name: 'Nguyen Van A', role: 'VOLUNTEER', status: 'Active' },
  { id: '2', name: 'Le Thi B', role: 'REQUESTER', status: 'Suspended' },
  { id: '3', name: 'Tran Van C', role: 'COLLABORATOR', status: 'Active' },
];

const UsersScreen = () => {
  const theme = useTheme();
  const styles = useThemeStyles();

  const renderItem = ({ item }) => (
    <View style={styles.userCard}>
      <Text style={styles.userName}>{item.name}</Text>
      <Text style={styles.userInfo}>Role: {item.role}</Text>
      <Text style={styles.userInfo}>Status: {item.status}</Text>
      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [styles.actionButton, { backgroundColor: pressed ? theme.linkHover : theme.link }]}
          onPress={() => {/* Change role logic placeholder */}}
        >
          <Text style={styles.actionText}>Change Role</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.blockButton, { backgroundColor: pressed ? theme.dangerHover : theme.danger }]}
          onPress={() => {/* Block/Unblock logic placeholder */}}
        >
          <Text style={styles.actionText}>Block/Unblock</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <FlatList
      data={dummyUsers}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
    />
  );
};

export default UsersScreen;

// Styles respecting UI guidelines
const createStyles = (theme) =>
  StyleSheet.create({
    listContainer: {
      padding: 16,
    },
    userCard: {
      backgroundColor: theme.cardBG || theme.appBG,
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    userInfo: {
      fontSize: 14,
      color: theme.textSupporting,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    actionButton: {
      flex: 1,
      marginRight: 4,
      paddingVertical: 8,
      borderRadius: 6,
      alignItems: 'center',
    },
    blockButton: {
      flex: 1,
      marginLeft: 4,
      paddingVertical: 8,
      borderRadius: 6,
      alignItems: 'center',
    },
    actionText: {
      color: '#fff',
      fontWeight: '500',
    },
  });

// Hook to generate styles with current theme
const useGeneratedStyles = () => {
  const theme = useTheme();
  return createStyles(theme);
};