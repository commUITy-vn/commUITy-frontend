import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';

const QUICK_AMOUNTS = [
  { label: '50.000đ', value: 50000 },
  { label: '100.000đ', value: 100000 },
  { label: '200.000đ', value: 200000 },
  { label: '500.000đ', value: 500000 },
];

const PAYMENT_METHODS = [
  { id: 'momo', label: 'MoMo' },
  { id: 'zalopay', label: 'ZaloPay' },
  { id: 'credit', label: 'Credit Card' },
];

export default function DonationForm() {
  const theme = useTheme();
  const styles = useThemeStyles();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  const handleQuickAmountSelect = useCallback(async (value: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAmount(value);
    setIsCustomAmount(false);
    setCustomAmount('');
  }, []);

  const handleCustomAmountChange = useCallback((text: string) => {
    setCustomAmount(text.replace(/[^0-9]/g, ''));
    setIsCustomAmount(true);
    setSelectedAmount(null);
  }, []);

  const handlePaymentMethodSelect = useCallback(async (methodId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPaymentMethod(methodId);
  }, []);

  const handleConfirmDonation = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const amount = isCustomAmount ? Number(customAmount) : selectedAmount;
    console.log('Donation confirmed:', { amount, paymentMethod: selectedPaymentMethod });
  }, [isCustomAmount, customAmount, selectedAmount, selectedPaymentMethod]);

  const getDisplayAmount = () => {
    if (isCustomAmount && customAmount) return `${Number(customAmount).toLocaleString('vi-VN')}đ`;
    if (selectedAmount) return `${selectedAmount.toLocaleString('vi-VN')}đ`;
    return '';
  };

  const isConfirmDisabled = !((isCustomAmount && customAmount) || selectedAmount) || !selectedPaymentMethod;

  return (
    <View style={[localStyles.container, { backgroundColor: theme.appBG }]}>
      <Text style={[styles.heading, { color: theme.text }]}>Make a Donation</Text>
      <Text style={[styles.subtitle, { color: theme.textSupporting }]}>
        Support the community fund with your contribution
      </Text>

      {/* Amount Selection */}
      <View style={localStyles.section}>
        <Text style={[styles.label, { color: theme.text }]}>Donation Amount</Text>
        <View style={localStyles.quickAmountGrid}>
          {QUICK_AMOUNTS.map((amount) => (
            <Pressable
              key={amount.value}
              style={[
                localStyles.quickAmountButton,
                {
                  backgroundColor: theme.componentBG,
                  borderColor: selectedAmount === amount.value && !isCustomAmount ? theme.primary : theme.border,
                  borderWidth: selectedAmount === amount.value && !isCustomAmount ? 2 : 1,
                },
              ]}
              onPress={() => handleQuickAmountSelect(amount.value)}
            >
              <Text
                style={[
                  localStyles.quickAmountText,
                  {
                    color: selectedAmount === amount.value && !isCustomAmount ? theme.primary : theme.text,
                    fontWeight: selectedAmount === amount.value && !isCustomAmount ? 'bold' : 'normal',
                  },
                ]}
              >
                {amount.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View
          style={[
            localStyles.inputContainer,
            {
              borderColor: isCustomAmount ? theme.primary : theme.border,
              backgroundColor: theme.componentBG,
            },
          ]}
        >
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Custom Amount (VND)"
            placeholderTextColor={theme.placeholderText}
            keyboardType="numeric"
            value={customAmount}
            onChangeText={handleCustomAmountChange}
            onFocus={() => setIsCustomAmount(true)}
          />
          {customAmount ? (
            <Text style={[localStyles.currencySymbol, { color: theme.textSupporting }]}>đ</Text>
          ) : null}
        </View>
      </View>

      {/* Payment Method */}
      <View style={localStyles.section}>
        <Text style={[styles.label, { color: theme.text }]}>Payment Method</Text>
        <View style={localStyles.paymentMethodContainer}>
          {PAYMENT_METHODS.map((method) => (
            <Pressable
              key={method.id}
              style={[
                localStyles.paymentMethodCard,
                {
                  backgroundColor: theme.componentBG,
                  borderColor: selectedPaymentMethod === method.id ? theme.primary : theme.border,
                  borderWidth: selectedPaymentMethod === method.id ? 2 : 1,
                },
              ]}
              onPress={() => handlePaymentMethodSelect(method.id)}
            >
              <View style={localStyles.paymentMethodContent}>
                <View
                  style={[
                    localStyles.radioButton,
                    {
                      borderColor: selectedPaymentMethod === method.id ? theme.primary : theme.border,
                    },
                  ]}
                >
                  {selectedPaymentMethod === method.id ? (
                    <View
                      style={[
                        localStyles.radioButtonSelected,
                        { backgroundColor: theme.primary },
                      ]}
                    />
                  ) : null}
                </View>
                <Text
                  style={[
                    localStyles.paymentMethodText,
                    {
                      color: selectedPaymentMethod === method.id ? theme.primary : theme.text,
                      fontWeight: selectedPaymentMethod === method.id ? 'bold' : 'normal',
                    },
                  ]}
                >
                  {method.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Summary */}
      {(selectedAmount || (isCustomAmount && customAmount)) && selectedPaymentMethod ? (
        <View style={[localStyles.summaryCard, { backgroundColor: theme.highlightBG }]}>
          <Text style={[styles.textSecondary, { color: theme.textSupporting }]}>Donation Summary</Text>
          <Text style={[localStyles.summaryAmount, { color: theme.text }]}>{getDisplayAmount()}</Text>
          <Text style={[styles.textSupporting, { color: theme.textSupporting }]}>
            via {PAYMENT_METHODS.find((m) => m.id === selectedPaymentMethod)?.label}
          </Text>
        </View>
      ) : null}

      {/* Confirm Button */}
      <Pressable
        style={[
          localStyles.confirmButton,
          {
            backgroundColor: isConfirmDisabled ? theme.buttonDefaultBG : theme.primary,
            opacity: isConfirmDisabled ? 0.5 : 1,
          },
        ]}
        onPress={handleConfirmDonation}
        disabled={isConfirmDisabled}
      >
        <Text
          style={[
            localStyles.confirmButtonText,
            { color: isConfirmDisabled ? theme.textSupporting : theme.textLight },
          ]}
        >
          Confirm Donation
        </Text>
      </Pressable>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  quickAmountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAmountButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  currencySymbol: {
    fontSize: 16,
    marginLeft: 4,
  },
  paymentMethodContainer: {
    gap: 12,
  },
  paymentMethodCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    gap: 4,
    alignItems: 'center',
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  confirmButton: {
    paddingVertical: 20,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 56,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
