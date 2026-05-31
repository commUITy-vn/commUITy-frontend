import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { BorderRadius, Spacing } from '@/constants/theme';

export default function AdminDashboard() {
  const theme = useTheme();
  const router = useRouter();

  const stats = [
    { label: 'Total Users', value: '1,204', icon: 'people' },
    { label: 'Pending Requests', value: '15', icon: 'pending-actions' },
    { label: 'Open Reports', value: '3', icon: 'report' },
    { label: 'System Health', value: '99%', icon: 'bolt' },
  ];

  const adminOptions = [
    {
      title: 'User Management',
      subtitle: 'Manage roles, view statuses, block/unblock members',
      route: '/(admin)/users',
      icon: 'people-outline',
    },
    {
      title: 'Moderation Queue',
      subtitle: 'Review pending requests and investigate user reports',
      route: '/(admin)/moderation',
      icon: 'gavel',
    },
    {
      title: 'System Statistics',
      subtitle: 'View category summaries and donation metrics',
      route: '/(admin)/statistics',
      icon: 'bar-chart',
    },
    {
      title: 'Category Management',
      subtitle: 'Create, update, and manage support request categories',
      route: '/(admin)/categories',
      icon: 'category',
    },
  ];


  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleNavigate = async (route: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.appBG }]}>
      {/* Sleek Header (Back chevron + title) */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>

        <Pressable onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Admin Panel</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistics Grid */}
        <View style={styles.grid}>
          {stats.map((item, idx) => (
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
              <View style={styles.statHeader}>
                <MaterialIcons name={item.icon as any} size={20} color={theme.primary} />
                <Text style={[styles.statValue, { color: theme.text }]}>{item.value}</Text>
              </View>
              <Text style={[styles.statLabel, { color: theme.textSupporting }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Section Title */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Management Console</Text>

        {/* Settings-style Navigation Options */}
        <View style={[styles.listContainer, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
          {adminOptions.map((opt, idx) => {
            const isLast = idx === adminOptions.length - 1;
            return (
              <Pressable
                key={idx}
                onPress={() => handleNavigate(opt.route)}
                style={({ pressed }) => [
                  styles.optionRow,
                  {
                    backgroundColor: pressed ? theme.highlightBG : 'transparent',
                    borderBottomColor: theme.border,
                    borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <View style={[styles.optionIconContainer, { backgroundColor: theme.highlightBG }]}>
                  <MaterialIcons name={opt.icon as any} size={22} color={theme.primary} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, { color: theme.text }]}>{opt.title}</Text>
                  <Text style={[styles.optionSubtitle, { color: theme.textSupporting }]} numberOfLines={1}>
                    {opt.subtitle}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={theme.icon} />
              </Pressable>
            );
          })}
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
    marginBottom: 8,
  },
  statCard: {
    width: '48%',
    padding: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 6,
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
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  listContainer: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionTextContainer: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionSubtitle: {
    fontSize: 12,
  },
});
