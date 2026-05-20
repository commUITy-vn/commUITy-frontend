import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';
import { SupportItemProgress } from '@/features/support/components/SupportItemProgress';
import { ContributeItemModal } from '@/features/support/components/ContributeItemModal';
import { useSupportRequestById } from '@/features/support/hooks/useSupportRequestById';
import { useState } from 'react';
import {
  SupportStatus,
  UrgencyLevel,
  SupportCategory,
  STATUS_LABELS,
  URGENCY_LABELS,
  CATEGORY_LABELS,
  SupportItem,
  ItemCategory,
} from '@/features/support/types/support.types';

// Dummy items for Module 7
const DUMMY_ITEMS: SupportItem[] = [
  {
    id: 'item-1',
    category: ItemCategory.FOOD,
    name: 'Bottled Water',
    neededQuantity: 50,
    receivedQuantity: 20,
  },
  {
    id: 'item-2',
    category: ItemCategory.FOOD,
    name: 'Rice (kg)',
    neededQuantity: 20,
    receivedQuantity: 8,
  },
  {
    id: 'item-3',
    category: ItemCategory.HYGIENE,
    name: 'Sanitary Pads',
    neededQuantity: 100,
    receivedQuantity: 30,
  },
];

export default function RequestDetailScreen() {
  const theme = useTheme();
  const styles = useThemeStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const getUrgencyBg = (urgency: number): string => {
    switch (urgency) {
      case 1: // HIGH
        return '#FFE5E5';
      case 2: // MEDIUM
        return '#FFF4E5';
      case 3: // LOW
        return '#E5F6EE';
      default:
        return theme.border;
    }
  };

  const getUrgencyText = (urgency: number): string => {
    switch (urgency) {
      case 1: // HIGH
        return '#CC0000';
      case 2: // MEDIUM
        return '#B35900';
      case 3: // LOW
        return '#008040';
      default:
        return theme.text;
    }
  };

  const getStatusBg = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return '#E2E8F0';
      case 'APPROVED':
        return '#E5F6EE';
      case 'IN_PROGRESS':
        return '#E0F2FE';
      case 'FULFILLED':
        return '#E5F6EE';
      case 'REJECTED':
        return '#FFE5E5';
      case 'CANCELLED':
        return '#F0F0F0';
      default:
        return theme.border;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return '#475569';
      case 'APPROVED':
        return '#008040';
      case 'IN_PROGRESS':
        return '#0369A1';
      case 'FULFILLED':
        return '#008040';
      case 'REJECTED':
        return '#CC0000';
      case 'CANCELLED':
        return '#666666';
      default:
        return theme.text;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const { data: request, isLoading, isError } = useSupportRequestById(id);
  const [selectedItem, setSelectedItem] = useState<SupportItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleHelpPress = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // For now, open modal for the first item when volunteer clicks help
    if (DUMMY_ITEMS.length > 0) {
      setSelectedItem(DUMMY_ITEMS[0]);
      setModalVisible(true);
    }
  };

  const handleConfirmContribution = (
    itemId: string,
    quantity: number,
    notes: string
  ) => {
    console.log('Contribution:', { itemId, quantity, notes });
    setModalVisible(false);
    setSelectedItem(null);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.appBG, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text, fontSize: 18 }}>Failed to load request details</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={[styles.container, { backgroundColor: theme.appBG, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text, fontSize: 18 }}>Request not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.appBG }]}>
      <ScrollView contentContainerStyle={localStyles.scrollContent}>
        <View style={[localStyles.card, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
          <Text style={[localStyles.title, { color: theme.text }]}>{request.title}</Text>

          <View style={localStyles.badgeContainer}>
            <View style={[localStyles.badge, { backgroundColor: getUrgencyBg(request.urgency) }]}>
              <Text style={[localStyles.badgeText, { color: getUrgencyText(request.urgency) }]}>
                {URGENCY_LABELS[request.urgency]} Urgency
              </Text>
            </View>
            <View style={[localStyles.badge, { backgroundColor: getStatusBg(request.status) }]}>
              <Text style={[localStyles.badgeText, { color: getStatusText(request.status) }]}>
                {request.status}
              </Text>
            </View>
          </View>

          <View style={[localStyles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[localStyles.detailLabel, { color: theme.textSupporting }]}>Category</Text>
            <Text style={[localStyles.detailValue, { color: theme.text }]}>
              {request.categoryName}
            </Text>
          </View>

          <View style={[localStyles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[localStyles.detailLabel, { color: theme.textSupporting }]}>Location</Text>
            <Text style={[localStyles.detailValue, { color: theme.text }]}>{request.address || 'Location not available'}</Text>
          </View>

          <View style={[localStyles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[localStyles.detailLabel, { color: theme.textSupporting }]}>Created</Text>
            <Text style={[localStyles.detailValue, { color: theme.text }]}>
              {formatDate(request.createdAt)}
            </Text>
          </View>

          <Text style={[localStyles.sectionTitle, { color: theme.text }]}>Description</Text>
          <Text style={[localStyles.description, { color: theme.textSupporting }]}>
            {request.description}
          </Text>

          {/* Needed Items Section */}
          <Text style={[localStyles.sectionTitle, { color: theme.text }]}>Needed Items</Text>
          <View style={localStyles.itemsContainer}>
            {DUMMY_ITEMS.map((item) => (
              <SupportItemProgress key={item.id} item={item} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Contribution Modal */}
      <ContributeItemModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        item={selectedItem}
        onConfirm={handleConfirmContribution}
      />

      <View style={localStyles.footer}>
        <Pressable
          style={({ pressed }) => [
            localStyles.helpButton,
            {
              backgroundColor: theme.primary,
              opacity: pressed ? 0.9 : 1,
              shadowColor: theme.inverse,
            },
          ]}
          onPress={handleHelpPress}
        >
          <Text style={[localStyles.helpButtonText, { color: theme.textLight }]}>
            I Want to Help
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  itemsContainer: {
    gap: 12,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'transparent',
  },
  helpButton: {
    paddingVertical: 18,
    borderRadius: 100,
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  helpButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});