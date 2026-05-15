import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';

type Transaction = {
  id: string;
  amount: number; // positive for income, negative for expense
  category: string;
  date: string; // ISO string
  description: string;
};

const dummyData: Transaction[] = [
  {
    id: '1',
    amount: 500000,
    category: 'Donation',
    date: '2024-01-15',
    description: 'Community donation',
  },
  {
    id: '2',
    amount: -200000,
    category: 'Food Supplies',
    date: '2024-01-20',
    description: 'Bought food supplies',
  },
  {
    id: '3',
    amount: -150000,
    category: 'Transportation',
    date: '2024-01-22',
    description: 'Transport costs',
  },
];

export const TransactionList = () => {
  const theme = useTheme();
  const styles = useThemeStyles();

  const renderItem = ({ item }: { item: Transaction }) => {
    const amountColor = item.amount > 0 ? theme.success : theme.danger;
    const sign = item.amount > 0 ? '+' : '-';
    const formattedAmount = `${sign} ${Math.abs(item.amount).toLocaleString()}đ`;
    return (
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.text}>{item.category}</Text>
          <Text style={[styles.text, { color: '#888' }]}>{item.date}</Text>
        </View>
        <Text style={[styles.text, { color: amountColor }]}>{formattedAmount}</Text>
      </View>
    );
  };

  return (
    <FlatList
      data={dummyData}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      contentContainerStyle={{ paddingVertical: 8 }}
    />
  );
};
