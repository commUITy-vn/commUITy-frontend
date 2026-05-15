import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { TransactionList } from '@/features/finance/components/TransactionList';
import { CreateExpenseModal } from '@/features/finance/components/CreateExpenseModal';

export const FinanceDashboard = () => {
  const theme = useTheme();
  const styles = useThemeStyles();
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  return (
    <View style={styles.container}>
      {/* Top Section */}
      <View style={[styles.card, { backgroundColor: theme.primary, padding: 16 }]}>
        <Text style={[styles.cardTitle, { color: '#fff' }]}>Current Balance</Text>
        <Text style={[styles.cardAmount, { color: '#fff', fontSize: 24 }]}>₫ 1,200,000</Text>
      </View>
      <View style={styles.row}>
        <View style={[styles.card, { flex: 1, marginRight: 4, backgroundColor: '#fff', padding: 12 }]}>
          <Text style={[styles.cardTitle, { color: theme.success }]}>Total Income</Text>
          <Text style={[styles.cardAmount, { color: theme.success }]}>₫ 3,500,000</Text>
        </View>
        <View style={[styles.card, { flex: 1, marginLeft: 4, backgroundColor: '#fff', padding: 12 }]}>
          <Text style={[styles.cardTitle, { color: theme.danger }]}>Total Expenses</Text>
          <Text style={[styles.cardAmount, { color: theme.danger }]}>₫ 2,300,000</Text>
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
      <TransactionList />
      <CreateExpenseModal visible={modalVisible} onClose={closeModal} />
    </View>
  );
};

export default FinanceDashboard;
