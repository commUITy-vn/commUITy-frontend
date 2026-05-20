import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import RequestCard from '@/features/support/components/RequestCard';
import ApplyCollaboratorModal from '@/features/support/components/ApplyCollaboratorModal';
import { SupportRequest } from '@/features/support/types/support.types';

// Dummy data for active volunteer commitments
const DUMMY_VOLUNTEER_REQUESTS: SupportRequest[] = [
  {
    id: 'v1',
    title: 'Food distribution for flood victims',
    description: 'Help deliver food packages to families in District 2.',
    location: 'District 2, Ho Chi Minh City',
    urgency: 1, // UrgencyLevel.HIGH (imported as number)
    status: 2, // SupportStatus.IN_PROGRESS
    category: 1, // SupportCategory.FOOD
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-02T12:00:00Z',
  },
  {
    id: 'v2',
    title: 'Medical transport for seniors',
    description: 'Provide rides to medical appointments for elderly residents.',
    location: 'District 9, Ho Chi Minh City',
    urgency: 2, // MEDIUM
    status: 2,
    category: 3, // SUPPORT_CATEGORY.MEDICAL
    createdAt: '2026-05-03T08:30:00Z',
    updatedAt: '2026-05-04T09:15:00Z',
  },
];

const StatCard = ({ label, value }: { label: string; value: string }) => {
  const theme = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: theme.highlightBG }]}>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSupporting }]}>{label}</Text>
    </View>
  );
};

export default function VolunteerDashboardScreen() {
  const theme = useTheme();
  const styles = useThemeStyles();
  const [applyModalVisible, setApplyModalVisible] = useState(false);

  const handleMarkComplete = async (requestId: string) => {
    // Placeholder for API call – real implementation would call backend endpoint
    console.log('Mark complete', requestId);
  };

  const handleWithdraw = async (requestId: string) => {
    console.log('Withdraw', requestId);
  };

  const renderVolunteerItem = ({ item }: { item: SupportRequest }) => (
    <View style={{ marginBottom: 16 }}>
      <RequestCard request={item} />
      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.buttonPrimary,
            { backgroundColor: theme.primary, marginRight: 8 },
          ]}
          onPress={() => handleMarkComplete(item.id)}
        >
          <Text style={[styles.buttonText, { color: theme.textLight }]}>Mark Complete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonSecondary, { backgroundColor: theme.danger }]}
          onPress={() => handleWithdraw(item.id)}
        >
          <Text style={[styles.buttonText, { color: theme.textLight }]}>Withdraw</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme.appBG, padding: 16 },
    ]}>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard label="Requests Helped" value="12" />
        <StatCard label="Items Contributed" value="45" />
        <StatCard label="Completion Rate" value="100%" />
      </View>

      {/* Role Banner */}
      <TouchableOpacity
        style={[
          styles.banner,
          { backgroundColor: theme.componentBG, borderColor: theme.border, marginTop: 16 },
        ]}
        onPress={() => setApplyModalVisible(true)}
      >
        <Text style={[styles.bannerText, { color: theme.text }]}>Apply to be a Collaborator</Text>
      </TouchableOpacity>

      {/* Volunteer Feed */}
      <FlatList
        data={DUMMY_VOLUNTEER_REQUESTS}
        renderItem={renderVolunteerItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Apply Collaborator Modal */}
      <ApplyCollaboratorModal
        isOpen={applyModalVisible}
        onClose={() => setApplyModalVisible(false)}
        onSubmit={() => setApplyModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  banner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  bannerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonPrimary: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});