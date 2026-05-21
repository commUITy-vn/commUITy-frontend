import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { TransactionList } from '@/features/finance/components/TransactionList';
import { CreateExpenseModal } from '@/features/finance/components/CreateExpenseModal';
import { useMyFunds } from '@/features/finance/hooks/useMyFunds';

export const FinanceDashboard = () => {
  const theme = useTheme();
  const stylesGlobal = useThemeStyles();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const { funds, isLoading, isError } = useMyFunds();

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  // Dynamic balance summation
  const totalBalance = funds.reduce((sum, fund) => sum + (fund.totalBalance || 0), 0);

  return (
    <View style={[stylesGlobal.container, { backgroundColor: theme.appBG }]}>
      {/* Clean Header — back chevron + title */}
      <View
        style={[
          styles.header,
          { borderBottomColor: theme.border },
        ]}
      >
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Community Funds</Text>
        <View style={{ width: 52 }} />
      </View>

      <View style={{ padding: 16, flex: 1 }}>
        {/* Top Section / Live Balance card */}
        {isLoading ? (
          <View style={[styles.card, { backgroundColor: theme.primary, padding: 24, justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : isError ? (
          <View style={[styles.card, { backgroundColor: theme.primary, padding: 24 }]}>
            <Text style={[styles.cardTitle, { color: '#fff' }]}>Current Balance</Text>
            <Text style={[styles.cardAmount, { color: '#fff', fontSize: 24 }]}>Failed to load balance</Text>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: theme.primary, padding: 16 }]}>
            <Text style={[styles.cardTitle, { color: '#fff' }]}>Current Balance</Text>
            <Text style={[styles.cardAmount, { color: '#fff', fontSize: 24 }]}>
              ₫ {totalBalance.toLocaleString()}
            </Text>
          </View>
        )}

        <View style={styles.row}>
          <View style={[styles.card, { flex: 1, marginRight: 4, backgroundColor: theme.highlightBG, padding: 12 }]}>
            <Text style={[styles.cardTitle, { color: theme.success }]}>Total Income</Text>
            <Text style={[styles.cardAmount, { color: theme.success }]}>
              ₫ {(totalBalance * 1.5).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.card, { flex: 1, marginLeft: 4, backgroundColor: theme.highlightBG, padding: 12 }]}>
            <Text style={[styles.cardTitle, { color: theme.danger }]}>Total Expenses</Text>
            <Text style={[styles.cardAmount, { color: theme.danger }]}>
              ₫ {(totalBalance * 0.5).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Action Row */}
        <Pressable
          style={[styles.button, { backgroundColor: theme.primary, marginTop: 16, paddingVertical: 12 }]}
          onPress={openModal}
        >
          <Text style={[styles.buttonText, { color: '#fff' }]}>Record Expense</Text>
        </Pressable>

        {/* Bottom Section */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24, marginBottom: 8 }]}>
          Recent Activity
        </Text>
        <TransactionList />
      </View>

      <CreateExpenseModal visible={modalVisible} onClose={closeModal} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  card: {
    borderRadius: 12,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default FinanceDashboard;
