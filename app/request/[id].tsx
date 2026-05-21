import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { ConfirmModal } from '@/components/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';
import { SupportItemProgress } from '@/features/support/components/SupportItemProgress';
import { ContributeItemModal } from '@/features/support/components/ContributeItemModal';
import { useSupportRequestById } from '@/features/support/hooks/useSupportRequestById';
import { useSupportNeeds } from '@/features/support/hooks/useSupportNeeds';
import { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
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

export default function RequestDetailScreen() {
  const theme = useTheme();
  const styles = useThemeStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const getUrgencyBg = (urgency: UrgencyLevel): string => {
    switch (urgency) {
      case UrgencyLevel.HIGH:
        return '#FFE5E5';
      case UrgencyLevel.MEDIUM:
        return '#FFF4E5';
      case UrgencyLevel.LOW:
        return '#E5F6EE';
      default:
        return theme.border;
    }
  };

  const getUrgencyText = (urgency: UrgencyLevel): string => {
    switch (urgency) {
      case UrgencyLevel.HIGH:
        return '#CC0000';
      case UrgencyLevel.MEDIUM:
        return '#B35900';
      case UrgencyLevel.LOW:
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

  const { data: request, isLoading: isRequestLoading, isError: isRequestError } = useSupportRequestById(id);
  const { needs, isLoading: isNeedsLoading, contribute, isContributing } = useSupportNeeds(id);

  const [selectedItem, setSelectedItem] = useState<SupportItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [alertModal, setAlertModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: "",
    message: "",
  });

  const showAlert = (title: string, message: string) => {
    setAlertModal({ visible: true, title, message });
  };

  const mappedItems: SupportItem[] = (needs || []).map((need) => ({
    id: need.id,
    category: ItemCategory.FOOD,
    name: need.needName || (need as any).itemName || 'Item',
    neededQuantity: need.requiredQuantity,
    receivedQuantity: need.receivedQuantity,
  }));

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleHelpPress = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (mappedItems.length > 0) {
      setSelectedItem(mappedItems[0]);
      setModalVisible(true);
    } else {
      showAlert('No Items Needed', 'There are no items requested for this support request.');
    }
  };

  const handleConfirmContribution = async (
    itemId: string,
    quantity: number,
    notes: string
  ) => {
    try {
      await contribute({
        needId: itemId,
        data: {
          quantity,
          note: notes,
        },
      });
      setModalVisible(false);
      setSelectedItem(null);
      showAlert('Thank You', 'Your contribution has been recorded successfully!');
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to submit contribution.');
    }
  };

  if (isRequestLoading || isNeedsLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isRequestError) {
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

  const urgencyValue: UrgencyLevel = request.urgency === 1 || request.urgency === 'HIGH' ? UrgencyLevel.HIGH :
                       request.urgency === 3 || request.urgency === 'LOW' ? UrgencyLevel.LOW :
                       UrgencyLevel.MEDIUM;

  return (
    <View style={[styles.container, { backgroundColor: theme.appBG }]}>
      {/* Header back button + title */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 8,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.appBG,
        }}
      >
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            {
              padding: 8,
              borderRadius: 8,
            },
            pressed && { backgroundColor: theme.highlightBG },
          ]}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text
          numberOfLines={1}
          style={{
            color: theme.text,
            fontSize: 17,
            fontWeight: '600',
            flex: 1,
            textAlign: 'center',
            marginHorizontal: 8,
          }}
        >
          {request?.title ?? 'Request Details'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={localStyles.scrollContent}>
        <View style={[localStyles.card, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
          <Text style={[localStyles.title, { color: theme.text }]}>{request.title}</Text>

          <View style={localStyles.badgeContainer}>
            <View style={[localStyles.badge, { backgroundColor: getUrgencyBg(urgencyValue) }]}>
              <Text style={[localStyles.badgeText, { color: getUrgencyText(urgencyValue) }]}>
                {URGENCY_LABELS[urgencyValue]} Urgency
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
            {mappedItems.length > 0 ? (
              mappedItems.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setSelectedItem(item);
                    setModalVisible(true);
                  }}
                  style={({ pressed }) => [
                    pressed && { opacity: 0.7 }
                  ]}
                >
                  <SupportItemProgress item={item} />
                </Pressable>
              ))
            ) : (
              <Text style={{ color: theme.textSupporting, fontStyle: 'italic' }}>No items requested.</Text>
            )}
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

      {mappedItems.length > 0 && (
        <View style={localStyles.footer}>
          <Pressable
            style={({ pressed }) => [
              localStyles.helpButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed || isContributing ? 0.9 : 1,
                shadowColor: theme.inverse,
              },
            ]}
            onPress={handleHelpPress}
            disabled={isContributing}
          >
            {isContributing ? (
              <ActivityIndicator color={theme.textLight} />
            ) : (
              <Text style={[localStyles.helpButtonText, { color: theme.textLight }]}>
                I Want to Help
              </Text>
            )}
          </Pressable>
        </View>
      )}

      <ConfirmModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        confirmText="OK"
        cancelText=""
        onConfirm={() => setAlertModal(prev => ({ ...prev, visible: false }))}
        onCancel={() => setAlertModal(prev => ({ ...prev, visible: false }))}
      />
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