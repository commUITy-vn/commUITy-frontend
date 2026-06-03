import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQueries } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { BorderRadius, Spacing } from "@/constants/theme";
import {
  getCategoryStatistics,
  getPostStatistics,
  getReportStatistics,
  getSupportRequestStatistics,
  getUserStatistics,
} from "@/features/admin/api/dashboard-statistics";
import { getCommunityFunds } from "@/features/finance/hooks/useCommunityFunds";
import { useTheme } from "@/hooks/useTheme";

const toArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const StatPill = ({ label, value }: { label: string; value: string | number }) => {
  const theme = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: theme.highlightBG, borderColor: theme.border }]}>
      <Text style={[styles.pillValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.pillLabel, { color: theme.textSupporting }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const Section = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  children: React.ReactNode;
}) => {
  const theme = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name={icon} size={20} color={theme.primary} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
};

export default function AdminStatistics() {
  const theme = useTheme();
  const router = useRouter();

  const [
    usersQuery,
    requestsQuery,
    categoriesQuery,
    reportsQuery,
    postsQuery,
    fundsQuery,
  ] = useQueries({
    queries: [
      { queryKey: ["adminDashboard", "users"], queryFn: getUserStatistics },
      { queryKey: ["adminDashboard", "supportRequests"], queryFn: getSupportRequestStatistics },
      { queryKey: ["adminDashboard", "categories"], queryFn: getCategoryStatistics },
      { queryKey: ["adminDashboard", "reports"], queryFn: getReportStatistics },
      { queryKey: ["adminDashboard", "posts"], queryFn: getPostStatistics },
      { queryKey: ["adminStats", "communityFunds"], queryFn: () => getCommunityFunds(false) },
    ],
  });

  const userStats = usersQuery.data;
  const requestStats = requestsQuery.data;
  const categoryStats = categoriesQuery.data;
  const reportStats = reportsQuery.data;
  const postStats = postsQuery.data;
  const funds = toArray(fundsQuery.data);
  const totalFundBalance = funds.reduce((sum, fund) => sum + Number(fund.totalBalance || 0), 0);

  const isLoading =
    usersQuery.isLoading ||
    requestsQuery.isLoading ||
    categoriesQuery.isLoading ||
    reportsQuery.isLoading ||
    postsQuery.isLoading ||
    fundsQuery.isLoading;

  const hasError =
    usersQuery.isError ||
    requestsQuery.isError ||
    categoriesQuery.isError ||
    reportsQuery.isError ||
    postsQuery.isError ||
    fundsQuery.isError;

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.appBG }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>System Statistics</Text>
        <View style={{ width: 44 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : hasError ? (
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={42} color={theme.danger} />
          <Text style={[styles.emptyText, { color: theme.text }]}>Some statistics could not be loaded.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Section title="User Statistics" icon="people">
            <View style={styles.grid}>
              <StatPill label="Total Users" value={userStats?.totalUsers || 0} />
              <StatPill label="Active" value={userStats?.activeUsers || 0} />
              <StatPill label="Inactive" value={userStats?.inactiveUsers || 0} />
              <StatPill label="Requester" value={userStats?.requesters || 0} />
              <StatPill label="Volunteer" value={userStats?.volunteers || 0} />
              <StatPill label="Collaborator" value={userStats?.collaborators || 0} />
              <StatPill label="Admin" value={userStats?.admins || 0} />
            </View>
          </Section>

          <Section title="Support Request Statistics" icon="volunteer-activism">
            <View style={styles.grid}>
              <StatPill label="Total SR" value={requestStats?.totalSupportRequests || 0} />
              <StatPill label="Pending" value={requestStats?.pending || 0} />
              <StatPill label="Approved" value={requestStats?.approved || 0} />
              <StatPill label="In Progress" value={requestStats?.inProgress || 0} />
              <StatPill label="Rejected" value={requestStats?.rejected || 0} />
              <StatPill label="Completed" value={requestStats?.completed || 0} />
              <StatPill label="Cancelled" value={requestStats?.cancelled || 0} />
            </View>
          </Section>

          <Section title="Category Statistics" icon="category">
            <View style={styles.grid}>
              <StatPill label="Total Categories" value={categoryStats?.totalCategories || 0} />
              <StatPill label="Active Categories" value={categoryStats?.activeCategories || 0} />
            </View>
            <View style={styles.list}>
              {(categoryStats?.categories || []).map((category) => (
                <View key={category.categoryId} style={[styles.row, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.rowLabel, { color: theme.text }]}>{category.categoryName}</Text>
                  <Text style={[styles.rowValue, { color: theme.textSupporting }]}>{category.supportRequestCount}</Text>
                </View>
              ))}
            </View>
          </Section>

          <Section title="Report Statistics" icon="report">
            <View style={styles.grid}>
              <StatPill label="Total Reports" value={reportStats?.totalReports || 0} />
              <StatPill label="Pending" value={reportStats?.pending || 0} />
              <StatPill label="Reviewed" value={reportStats?.reviewed || 0} />
              <StatPill label="Resolved" value={reportStats?.resolved || 0} />
              <StatPill label="SR Target" value={reportStats?.supportRequestReports || 0} />
              <StatPill label="Post Target" value={reportStats?.postReports || 0} />
              <StatPill label="User Target" value={reportStats?.userReports || 0} />
            </View>
          </Section>

          <Section title="Post Statistics" icon="article">
            <View style={styles.grid}>
              <StatPill label="Total Posts" value={postStats?.totalPosts || 0} />
              <StatPill label="Active" value={postStats?.active || 0} />
              <StatPill label="Under Review" value={postStats?.underReview || 0} />
              <StatPill label="Hidden" value={postStats?.hidden || 0} />
              <StatPill label="Removed" value={postStats?.removed || 0} />
            </View>
          </Section>

          <Section title="Fund Statistics" icon="account-balance-wallet">
            <View style={styles.grid}>
              <StatPill label="Community Funds" value={funds.length} />
              <StatPill label="Active Funds" value={funds.filter((fund) => fund.isActive !== false).length} />
              <StatPill label="Total Balance" value={`${totalFundBalance.toLocaleString()} VND`} />
            </View>
          </Section>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { marginTop: 10, fontSize: 15, fontWeight: "600", textAlign: "center" },
  content: { padding: Spacing.base, gap: Spacing.base, paddingBottom: 40 },
  section: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    minWidth: "31%",
    flexGrow: 1,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  pillValue: { fontSize: 18, fontWeight: "800" },
  pillLabel: { marginTop: 2, fontSize: 11, fontWeight: "600" },
  list: { marginTop: 2 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { flex: 1, fontSize: 13, fontWeight: "600" },
  rowValue: { fontSize: 13, fontWeight: "700" },
});
