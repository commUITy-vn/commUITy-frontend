import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

// Dummy data
const dummyStats = {
  totalRequests: 1234,
  completedRequests: 890,
  totalDonations: 50000,
  activeVolunteers: 345,
};

const categories = [
  { label: 'Food', color: '#FF6384' },
  { label: 'Medical', color: '#36A2EB' },
  { label: 'Clothing', color: '#FFCE56' },
];

// Random heights for line chart placeholder (0-100)
const lineData = Array.from({ length: 10 }, () => Math.floor(Math.random() * 80) + 20);

export default function AdminStatistics() {
  const theme = useTheme();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Row Summary Cards */}
      <View style={styles.row}>
        <View style={[styles.card, { backgroundColor: theme.componentBG || theme.highlightBG }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{'Total Requests'}</Text>
          <Text style={[styles.cardValue, { color: theme.text }]}>{dummyStats.totalRequests}</Text>
        </View>
        <View style={[styles.card, { backgroundColor: theme.componentBG || theme.highlightBG }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{'Completed Requests'}</Text>
          <Text style={[styles.cardValue, { color: theme.text }]}>{dummyStats.completedRequests}</Text>
        </View>
        <View style={[styles.card, { backgroundColor: theme.componentBG || theme.highlightBG }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{'Total Donations'}</Text>
          <Text style={[styles.cardValue, { color: theme.text }]}>${dummyStats.totalDonations.toLocaleString()}</Text>
        </View>
        <View style={[styles.card, { backgroundColor: theme.componentBG || theme.highlightBG }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{'Active Volunteers'}</Text>
          <Text style={[styles.cardValue, { color: theme.text }]}>{dummyStats.activeVolunteers}</Text>
        </View>
      </View>

      {/* Charts Area */}
      <View style={styles.section}>
        {/* Line Chart Placeholder */}
        <View style={[styles.chartCard, { borderColor: theme.border }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>{'Trends (Line Chart)'}</Text>
          <View style={styles.lineChart}>
            {lineData.map((height, idx) => (
              <View
                key={idx}
                style={[styles.bar, { height, backgroundColor: theme.primary }]}
              />
            ))}
          </View>
        </View>

        {/* Pie Chart Placeholder */}
        <View style={[styles.chartCard, { borderColor: theme.border }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>{'Requests by Category (Pie Chart)'}</Text>
          <View style={styles.pieLegend}>
            {categories.map((cat, idx) => (
              <View key={idx} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: cat.color }]} />
                <Text style={[styles.legendLabel, { color: theme.text }]}>{cat.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const gap = 8;
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: gap * 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: gap * 3,
  },
  card: {
    flex: 1,
    padding: gap * 2,
    marginHorizontal: gap / 2,
    borderRadius: 6,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    marginBottom: gap / 2,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  section: {
    flexDirection: 'column',
    gap: gap * 3,
  },
  chartCard: {
    padding: gap * 2,
    borderWidth: 1,
    borderRadius: 6,
  },
  chartTitle: {
    fontSize: 16,
    marginBottom: gap,
  },
  lineChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
  },
  bar: {
    width: 8,
    borderRadius: 2,
  },
  pieLegend: {
    marginTop: gap,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: gap / 2,
  },
  legendColor: {
    width: 12,
    height: 12,
    marginRight: gap / 2,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 14,
  },
});