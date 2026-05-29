import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Modal, FlatList, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';
import {
  useCommunityFund,
  useFundExpenses,
  useFundDonations,
  useCreateDonation,
  useCreateExpense,
} from '@/features/finance/hooks/useCommunityFunds';

const QUICK_AMOUNTS = [
  { label: '50.000đ', value: 50000 },
  { label: '100.000đ', value: 100000 },
  { label: '200.000đ', value: 200000 },
  { label: '500.000đ', value: 500000 },
];

const PAYMENT_METHODS = [
  { id: 'MOMO', label: 'MoMo' },
  { id: 'ZALOPAY', label: 'ZaloPay' },
  { id: 'BANK_TRANSFER', label: 'Bank Transfer' },
];

export default function FundDetailScreen() {
  const theme = useTheme();
  const stylesGlobal = useThemeStyles();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();

  const { data: fund, isLoading: isFundLoading, isError: isFundError } = useCommunityFund(id);
  const { data: expenses, isLoading: isExpensesLoading } = useFundExpenses(id);
  const { data: donations, isLoading: isDonationsLoading } = useFundDonations(id);

  const createDonationMutation = useCreateDonation();
  const createExpenseMutation = useCreateExpense();

  // Modals state
  const [donateModalVisible, setDonateModalVisible] = useState(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);

  // Donation Form state
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [donationNote, setDonationNote] = useState('');
  const [donationError, setDonationError] = useState('');

  // Expense Form state
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseError, setExpenseError] = useState('');

  // Combine and sort recent transactions
  const combinedTransactions = useMemo(() => {
    const list: any[] = [];

    if (donations && Array.isArray(donations)) {
      donations.forEach((d) => {
        list.push({
          id: d.id,
          type: 'INCOME',
          amount: d.amount,
          title: d.note || 'Community Donation',
          date: new Date(d.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          createdByName: d.createdByName || 'Anonymous',
          timestamp: new Date(d.createdAt).getTime(),
          method: d.paymentMethod,
        });
      });
    }

    if (expenses && Array.isArray(expenses)) {
      expenses.forEach((e) => {
        list.push({
          id: e.id,
          type: 'EXPENSE',
          amount: -e.amount,
          title: e.description || 'Outlay Expense',
          date: new Date(e.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          createdByName: e.createdByName || 'Staff Member',
          timestamp: new Date(e.createdAt).getTime(),
        });
      });
    }

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [donations, expenses]);

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleOpenDonate = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAmount(null);
    setCustomAmount('');
    setIsCustomAmount(false);
    setSelectedPayment(null);
    setDonationNote('');
    setDonationError('');
    setDonateModalVisible(true);
  };

  const handleOpenExpense = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpenseAmount('');
    setExpenseDescription('');
    setExpenseError('');
    setExpenseModalVisible(true);
  };

  const handleDonateConfirm = async () => {
    const finalAmount = isCustomAmount ? Number(customAmount) : selectedAmount;
    if (!finalAmount || finalAmount <= 0) {
      setDonationError('Please select or specify a valid contribution amount');
      return;
    }
    if (!selectedPayment) {
      setDonationError('Please choose a payment method');
      return;
    }
    setDonationError('');

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await createDonationMutation.mutateAsync({
        fundId: id,
        amount: finalAmount,
        paymentMethod: selectedPayment,
        note: donationNote.trim() || undefined,
        transactionCode: `TXN-${Date.now().toString().slice(-6)}`,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDonateModalVisible(false);
    } catch (err: any) {
      setDonationError(err?.message || 'Failed to submit donation');
    }
  };

  const handleExpenseConfirm = async () => {
    const parsedAmount = Number(expenseAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setExpenseError('Please enter a valid expense amount');
      return;
    }
    if (!expenseDescription.trim()) {
      setExpenseError('Expense description is required');
      return;
    }
    setExpenseError('');

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await createExpenseMutation.mutateAsync({
        fundId: id,
        amount: parsedAmount,
        description: expenseDescription.trim(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setExpenseModalVisible(false);
    } catch (err: any) {
      setExpenseError(err?.message || 'Failed to record expense');
    }
  };

  if (isFundLoading) {
    return (
      <View style={[stylesGlobal.container, { backgroundColor: theme.appBG, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isFundError || !fund) {
    return (
      <View style={[stylesGlobal.container, { backgroundColor: theme.appBG, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text, fontSize: 16 }}>Failed to load community fund details</Text>
      </View>
    );
  }

  const isStaff = user?.role === 'ADMIN' || user?.role === 'COLLABORATOR';

  return (
    <View style={[stylesGlobal.container, { backgroundColor: theme.appBG }]}>
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
            { padding: 8, borderRadius: 8 },
            pressed && { backgroundColor: theme.highlightBG },
          ]}
        >
          <MaterialIcons name="chevron-left" size={28} color={theme.text} />
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
          Fund Overview
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HSL Premium Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: theme.primary }]}>
          <Text style={[styles.balanceLabel, { color: theme.textLight }]}>Live Balance</Text>
          <Text style={[styles.balanceAmount, { color: theme.textLight }]}>
            ₫ {fund.totalBalance.toLocaleString()}
          </Text>
          <Text style={[styles.managerText, { color: theme.textLight }]}>
            Managed by {fund.createdByName || 'Community Fund Manager'}
          </Text>
        </View>

        {/* Fund Info details */}
        <View style={[styles.infoCard, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
          <Text style={[styles.fundTitle, { color: theme.text }]}>{fund.name}</Text>
          <Text style={[styles.fundDescription, { color: theme.textSupporting }]}>
            {fund.description || 'No description available for this community fund.'}
          </Text>
        </View>

        {/* Action triggers */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={handleOpenDonate}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.primary },
              pressed && { opacity: 0.9 },
            ]}
          >
            <Ionicons name="gift-outline" size={20} color={theme.textLight} />
            <Text style={[styles.actionButtonText, { color: theme.textLight }]}>Contribute</Text>
          </Pressable>

          {isStaff && (
            <Pressable
              onPress={handleOpenExpense}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: theme.highlightBG, borderWidth: 1.5, borderColor: theme.border },
                pressed && { backgroundColor: theme.border },
              ]}
            >
              <Ionicons name="receipt-outline" size={20} color={theme.text} />
              <Text style={[styles.actionButtonText, { color: theme.text }]}>Record Expense</Text>
            </Pressable>
          )}
        </View>

        {/* Transactions list */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Fund Ledger</Text>
        <View style={styles.ledgerContainer}>
          {isExpensesLoading || isDonationsLoading ? (
            <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
          ) : combinedTransactions.length === 0 ? (
            <Text style={{ color: theme.textSupporting, fontStyle: 'italic', textAlign: 'center', marginVertical: 20 }}>
              No transactions recorded in the ledger yet.
            </Text>
          ) : (
            combinedTransactions.map((tx) => {
              const isIncome = tx.type === 'INCOME';
              const amtColor = isIncome ? theme.success : theme.danger;
              const sign = isIncome ? '+' : '-';
              const formattedAmt = `${sign}₫${Math.abs(tx.amount).toLocaleString()}`;

              return (
                <View
                  key={tx.id}
                  style={[
                    styles.txRow,
                    { backgroundColor: theme.componentBG, borderColor: theme.border },
                  ]}
                >
                  <View style={[styles.txIconContainer, { backgroundColor: isIncome ? theme.success + '15' : theme.danger + '15' }]}>
                    <Ionicons
                      name={isIncome ? 'arrow-down-circle' : 'arrow-up-circle'}
                      size={24}
                      color={amtColor}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.txTitle, { color: theme.text }]} numberOfLines={1}>
                      {tx.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textSupporting }}>
                      {tx.date} • by {tx.createdByName}
                    </Text>
                  </View>
                  <Text style={[styles.txAmount, { color: amtColor }]}>{formattedAmt}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* 1. Donation Contribution Modal */}
      <Modal
        visible={donateModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setDonateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Contribute to Fund</Text>
              <Pressable onPress={() => setDonateModalVisible(false)} style={styles.modalCloseButton}>
                <MaterialIcons name="close" size={24} color={theme.textSupporting} />
              </Pressable>
            </View>

            {donationError ? (
              <View style={[styles.errorContainer, { backgroundColor: theme.danger + '15', borderColor: theme.danger }]}>
                <Text style={{ color: theme.danger, fontSize: 13 }}>{donationError}</Text>
              </View>
            ) : null}

            <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              {/* Quick Grid Selection */}
              <View style={styles.formSection}>
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>Donation Amount</Text>
                <View style={styles.quickGrid}>
                  {QUICK_AMOUNTS.map((amt) => (
                    <Pressable
                      key={amt.value}
                      style={[
                        styles.quickPill,
                        {
                          backgroundColor: theme.highlightBG,
                          borderColor: selectedAmount === amt.value && !isCustomAmount ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={async () => {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedAmount(amt.value);
                        setIsCustomAmount(false);
                        setCustomAmount('');
                      }}
                    >
                      <Text
                        style={{
                          color: selectedAmount === amt.value && !isCustomAmount ? theme.primary : theme.text,
                          fontWeight: '600',
                          fontSize: 13,
                        }}
                      >
                        {amt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Custom Input */}
                <TextInput
                  label="Custom Amount (VND)"
                  value={customAmount}
                  onChangeText={(txt) => {
                    setCustomAmount(txt.replace(/[^0-9]/g, ''));
                    setIsCustomAmount(true);
                    setSelectedAmount(null);
                  }}
                  keyboardType="numeric"
                />
              </View>

              {/* Payment Methods */}
              <View style={styles.formSection}>
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>Payment Method</Text>
                <View style={{ gap: 8 }}>
                  {PAYMENT_METHODS.map((method) => (
                    <Pressable
                      key={method.id}
                      style={[
                        styles.paymentCard,
                        {
                          backgroundColor: theme.highlightBG,
                          borderColor: selectedPayment === method.id ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={async () => {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedPayment(method.id);
                      }}
                    >
                      <View style={[styles.radioButton, { borderColor: selectedPayment === method.id ? theme.primary : theme.border }]}>
                        {selectedPayment === method.id && (
                          <View style={[styles.radioButtonSelected, { backgroundColor: theme.primary }]} />
                        )}
                      </View>
                      <Text style={{ color: theme.text, fontWeight: '500', fontSize: 15 }}>{method.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Note */}
              <TextInput
                label="Message / Note"
                value={donationNote}
                onChangeText={setDonationNote}
                multiline
                height={80}
              />
            </ScrollView>

            <View style={{ marginTop: 8 }}>
              <Button
                text={createDonationMutation.isPending ? 'Processing...' : 'Confirm Contribution'}
                onPress={handleDonateConfirm}
                primary
                isDisabled={createDonationMutation.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Expense Recording Modal */}
      <Modal
        visible={expenseModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setExpenseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Record Outlay Expense</Text>
              <Pressable onPress={() => setExpenseModalVisible(false)} style={styles.modalCloseButton}>
                <MaterialIcons name="close" size={24} color={theme.textSupporting} />
              </Pressable>
            </View>

            {expenseError ? (
              <View style={[styles.errorContainer, { backgroundColor: theme.danger + '15', borderColor: theme.danger }]}>
                <Text style={{ color: theme.danger, fontSize: 13 }}>{expenseError}</Text>
              </View>
            ) : null}

            <View style={{ gap: 16, marginBottom: 20 }}>
              <TextInput
                label="Amount (VND)"
                value={expenseAmount}
                onChangeText={(txt) => setExpenseAmount(txt.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />

              <TextInput
                label="Expense Description / Receipt note"
                value={expenseDescription}
                onChangeText={setExpenseDescription}
                multiline
                height={100}
              />
            </View>

            <View>
              <Button
                text={createExpenseMutation.isPending ? 'Recording...' : 'Record Expense'}
                onPress={handleExpenseConfirm}
                primary
                isDisabled={createExpenseMutation.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
    gap: 16,
  },
  balanceCard: {
    borderRadius: 16,
    padding: 24,
    gap: 8,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.85,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
  },
  managerText: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.8,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  fundTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  fundDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    minHeight: 48,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  ledgerContainer: {
    gap: 10,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  txIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 4,
  },
  errorContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  formSection: {
    gap: 8,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickPill: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    gap: 12,
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
