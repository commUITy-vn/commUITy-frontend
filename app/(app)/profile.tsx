import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import DonationHistory from '@/features/finance/components/DonationHistory';
import DonationForm from '@/features/finance/components/DonationForm';

export default function ProfileScreen() {
  const theme = useTheme();
  const styles = useThemeStyles();
  const [isDonationModalVisible, setIsDonationModalVisible] = useState(false);

  const handleDonatePress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsDonationModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsDonationModalVisible(false);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.appBG }}>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 100, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Section */}
        <View
          style={[
            localStyles.userInfoCard,
            {
              backgroundColor: theme.componentBG,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={localStyles.avatarContainer}>
            <View
              style={[
                localStyles.avatarPlaceholder,
                { backgroundColor: theme.primary },
              ]}
            >
              <Text style={[localStyles.avatarText, { color: theme.textLight }]}>
                JD
              </Text>
            </View>
          </View>
          <View style={localStyles.userDetails}>
            <Text style={[styles.heading, { color: theme.text, fontSize: 24 }]}>
              John Doe
            </Text>
            <Text style={[styles.textSupporting, { color: theme.textSupporting }]}>
              john@example.com
            </Text>
            <View style={localStyles.userStats}>
              <View style={localStyles.statItem}>
                <Text style={[localStyles.statValue, { color: theme.primary }]}>8</Text>
                <Text style={[localStyles.statLabel, { color: theme.textSupporting }]}>
                  Donations
                </Text>
              </View>
              <View style={localStyles.statDivider} />
              <View style={localStyles.statItem}>
                <Text style={[localStyles.statValue, { color: theme.success }]}>1.050.000đ</Text>
                <Text style={[localStyles.statLabel, { color: theme.textSupporting }]}>
                  Total Given
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Donation History */}
        <DonationHistory />
      </ScrollView>

      {/* Floating Donate Button */}
      <Pressable
        style={[
          localStyles.floatingButton,
          { backgroundColor: theme.primary },
        ]}
        onPress={handleDonatePress}
      >
        <Text style={[localStyles.floatingButtonText, { color: theme.textLight }]}>
          Donate to Community Fund
        </Text>
      </Pressable>

      {/* Donation Modal */}
      <Modal
        visible={isDonationModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <View style={[localStyles.modalContainer, { backgroundColor: theme.appBG }]}>
          <View style={localStyles.modalHeader}>
            <Pressable onPress={handleCloseModal}>
              <Text style={[localStyles.closeButton, { color: theme.link }]}>Close</Text>
            </Pressable>
          </View>
          <DonationForm />
        </View>
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userInfoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  userDetails: {
    alignItems: 'center',
    gap: 4,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    paddingVertical: 18,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    padding: 16,
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '600',
  },
});