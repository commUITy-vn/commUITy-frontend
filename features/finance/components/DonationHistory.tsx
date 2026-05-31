import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';

export type DonationRecord = {
  id: string;
  date: string;
  amount: number;
  recipient: string;
  status: 'Success' | 'Pending' | 'Failed';
};

const DUMMY_DONATIONS: DonationRecord[] = [
  { id: '1', date: '2026-05-07', amount: 50000, recipient: 'Community Food Bank', status: 'Success' },
  { id: '2', date: '2026-05-05', amount: 100000, recipient: 'Youth Education Fund', status: 'Success' },
  { id: '3', date: '2026-05-03', amount: 200000, recipient: 'Disaster Relief', status: 'Pending' },
  { id: '4', date: '2026-04-28', amount: 50000, recipient: 'Animal Shelter', status: 'Success' },
  { id: '5', date: '2026-04-25', amount: 150000, recipient: 'Community Health Clinic', status: 'Success' },
  { id: '6', date: '2026-04-20', amount: 300000, recipient: 'Elderly Care Fund', status: 'Failed' },
  { id: '7', date: '2026-04-15', amount: 100000, recipient: 'Community Food Bank', status: 'Success' },
  { id: '8', date: '2026-04-10', amount: 50000, recipient: 'Youth Sports Program', status: 'Success' },
];

export default function DonationHistory() {
  const theme = useTheme();
  const styles = useThemeStyles();

  const getStatusColor = useMemo(() => {
    return (status: DonationRecord['status']) => {
      switch (status) {
        case 'Success':
          return theme.success;
        case 'Pending':
          return theme.warning;
        case 'Failed':
          return theme.danger;
        default:
          return theme.textSupporting;
      }
    };
  }, [theme]);

  const renderItem = ({ item }: { item: DonationRecord }) => (
    <Pressable
      style={[
        localStyles.donationCard,
        {
          backgroundColor: theme.componentBG,
          borderColor: theme.border,
        },
      ]}
      onPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <View style={localStyles.donationHeader}>
        <Text style={[styles.textPrimary, { color: theme.text, fontWeight: 'bold' }]}>
          {item.recipient}
        </Text>
        <View
          style={[
            localStyles.statusBadge,
            { backgroundColor: `${getStatusColor(item.status)}20` },
          ]}
        >
          <Text style={[localStyles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={localStyles.donationDetails}>
        <Text style={[styles.textSupporting, { color: theme.textSupporting }]}>
          {new Date(item.date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
        <Text style={[localStyles.amountText, { color: theme.primary, fontWeight: 'bold' }]}>
          {item.amount.toLocaleString('vi-VN')}đ
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={localStyles.container}>
      <Text style={[styles.heading, { color: theme.text }]}>Donation History</Text>
      <Text style={[styles.subtitle, { color: theme.textSupporting }]}>
        Your past contributions to community funds
      </Text>

      <FlatList
        data={DUMMY_DONATIONS}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={localStyles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={localStyles.separator} />}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  listContent: {
    gap: 12,
    paddingBottom: 16,
  },
  donationCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  donationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 16,
  },
  separator: {
    height: 12,
  },
});
