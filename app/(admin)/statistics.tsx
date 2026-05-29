import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BorderRadius, Spacing } from '@/constants/theme';

const dummyStats = {
  totalRequests: 1234,
  completedRequests: 890,
  totalDonations: 50000,
  activeVolunteers: 345,
};

const categories = [
  { label: 'Food & Groceries', color: '#F97316', count: 480 },
  { label: 'Medical & Health', color: '#10B981', count: 320 },
  { label: 'Clothing & Shelter', color: '#3B82F6', count: 210 },
  { label: 'Education & Books', color: '#8B5CF6', count: 224 },
];

const lineData = [40, 55, 30, 75, 60, 45, 90, 65, 80, 95];

export default function AdminStatistics() {
  const theme = useTheme();
  const router = useRouter();

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const statCards = [
    { label: 'Total Requests', value: dummyStats.totalRequests.toString(), icon: 'volunteer-activism' },
    { label: 'Completed', value: dummyStats.completedRequests.toString(), icon: 'check-circle-outline' },
    { label: 'Total Donations', value: `$${dummyStats.totalDonations.toLocaleString()}`, icon: 'monetization-on' },
    { label: 'Volunteers', value: dummyStats.activeVolunteers.toString(), icon: 'people' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.appBG }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.componentBG }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>System Statistics</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top Summary Cards Grid */}
        <View style={styles.grid}>
          {statCards.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.statCard,
                {
                  backgroundColor: theme.componentBG,
                  borderColor: theme.border,
                },
              ]}
            >
              <MaterialIcons name={item.icon as any} size={22} color={theme.primary} />
              <View style={styles.statInfo}>
                <Text style={[styles.statValue, { color: theme.text }]}>{item.value}</Text>
                <Text style={[styles.statLabel, { color: theme.textSupporting }]} numberOfLines={1}>{item.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Chart Card 1: Trends */}
        <View style={[styles.chartCard, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
          <View style={styles.chartHeader}>
            <MaterialIcons name="trending-up" size={20} color={theme.primary} />
            <Text style={[styles.chartTitle, { color: theme.text }]}>Weekly Support Trends</Text>
          </View>
          <View style={styles.chartArea}>
            <View style={styles.lineChart}>
              {lineData.map((height, idx) => (
                <View key={idx} style={styles.barContainer}>
                  <View style={[styles.bar, { height, backgroundColor: theme.primary }]} />
                  <Text style={{ fontSize: 9, color: theme.textSupporting, marginTop: 4 }}>W{idx + 1}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Chart Card 2: Categories */}
        <View style={[styles.chartCard, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
          <View style={styles.chartHeader}>
            <MaterialIcons name="pie-chart-outline" size={20} color={theme.primary} />
            <Text style={[styles.chartTitle, { color: theme.text }]}>Requests by Category</Text>
          </View>
          <View style={styles.legendContainer}>
            {categories.map((cat, idx) => {
              const percentage = ((cat.count / dummyStats.totalRequests) * 100).toFixed(1);
              return (
                <View key={idx} style={[styles.legendItem, { borderBottomColor: theme.border, borderBottomWidth: idx === categories.length - 1 ? 0 : StyleSheet.hairlineWidth }]}>
                  <View style={[styles.legendColor, { backgroundColor: cat.color }]} />
                  <Text style={[styles.legendLabel, { color: theme.text }]}>{cat.label}</Text>
                  <Text style={[styles.legendValue, { color: theme.textSupporting }]}>
                    {cat.count} ({percentage}%)
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        paddingTop: 12,
      },
    }),
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.base,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  statInfo: {
    flex: 1,
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  chartCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  chartArea: {
    paddingTop: 10,
  },
  lineChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingHorizontal: 8,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 8,
    borderRadius: 4,
  },
  legendContainer: {
    gap: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 10,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  legendValue: {
    fontSize: 12,
  },
});