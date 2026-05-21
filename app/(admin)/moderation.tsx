import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useRouter } from 'expo-router';

const dummyPending = [
  { id: 'p1', title: 'Support Request #123', description: 'User needs assistance with login' },
];
const dummyReports = [
  { id: 'r1', title: 'Report #456', description: 'Inappropriate content reported' },
];

const ModerationScreen = () => {
  const theme = useTheme();
  const styles = useGeneratedStyles();
  const [tab, setTab] = useState<'pending' | 'reports'>('pending');
  const data = tab === 'pending' ? dummyPending : dummyReports;

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemCard}>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemDesc}>{item.description}</Text>
      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [styles.approveButton, { backgroundColor: pressed ? theme.successHover : theme.success }]}
          onPress={() => {/* Approve logic placeholder */}}
        >
          <Text style={styles.actionText}>Approve</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.rejectButton, { backgroundColor: pressed ? theme.dangerHover : theme.danger }]}
          onPress={() => {/* Reject logic placeholder */}}
        >
          <Text style={styles.actionText}>Reject</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <Pressable onPress={() => setTab('pending')} style={tab === 'pending' ? styles.activeTab : styles.inactiveTab}>
          <Text style={styles.tabText}>Pending Requests</Text>
        </Pressable>
        <Pressable onPress={() => setTab('reports')} style={tab === 'reports' ? styles.activeTab : styles.inactiveTab}>
          <Text style={styles.tabText}>User Reports</Text>
        </Pressable>
      </View>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

export default ModerationScreen;

// Styles aligned with UI guidelines
const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.appBG },
    tabContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 12 },
    activeTab: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: theme.link, borderRadius: 8 },
    inactiveTab: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: theme.cardBG, borderRadius: 8 },
    tabText: { color: '#fff', fontWeight: '500' },
    listContainer: { padding: 16 },
    itemCard: { backgroundColor: theme.cardBG || theme.appBG, padding: 12, borderRadius: 8, marginBottom: 12 },
    itemTitle: { fontSize: 16, fontWeight: '600', color: theme.text },
    itemDesc: { fontSize: 14, color: theme.textSupporting, marginBottom: 8 },
    actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    approveButton: { flex: 1, marginRight: 4, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
    rejectButton: { flex: 1, marginLeft: 4, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
    actionText: { color: '#fff', fontWeight: '500' },
  });

// Generate styles with current theme
const useGeneratedStyles = () => {
  const theme = useTheme();
  return createStyles(theme);
};