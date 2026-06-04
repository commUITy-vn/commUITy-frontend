import React from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQueries } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import Svg, { Circle, G } from "react-native-svg";

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

const CHART_COLORS = ["#2563EB", "#16A34A", "#F59E0B", "#DC2626", "#7C3AED", "#0891B2", "#DB2777", "#475569"];

const DonutChart = ({
  data,
}: {
  data: { label: string; value: number; color?: string }[];
}) => {
  const theme = useTheme();
  const size = 148;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, item) => sum + Math.max(0, Number(item.value || 0)), 0);
  let offset = 0;

  return (
    <View style={styles.chartWrap}>
      <View style={styles.chartBox}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.highlightBG}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {total > 0 &&
              data.map((item, index) => {
                const value = Math.max(0, Number(item.value || 0));
                const dash = (value / total) * circumference;
                const segment = (
                  <Circle
                    key={`${item.label}-${index}`}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={item.color || CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="round"
                    fill="none"
                  />
                );
                offset += dash;
                return segment;
              })}
          </G>
        </Svg>
        <View style={styles.chartCenter}>
          <Text style={[styles.chartTotal, { color: theme.text }]}>{total}</Text>
          <Text style={[styles.chartTotalLabel, { color: theme.textSupporting }]}>total</Text>
        </View>
      </View>
      <View style={styles.legendList}>
        {data.map((item, index) => (
          <View key={item.label} style={styles.legendRow}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: item.color || CHART_COLORS[index % CHART_COLORS.length] },
              ]}
            />
            <Text style={[styles.legendText, { color: theme.text }]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[styles.legendValue, { color: theme.textSupporting }]}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function AdminStatistics() {
  const theme = useTheme();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const [
    usersQuery,
    requestsQuery,
    categoriesQuery,
    reportsQuery,
    postsQuery,
    fundsQuery,
  ] = useQueries({
    queries: [
      { queryKey: ["adminDashboard", "users"], queryFn: getUserStatistics, refetchInterval: 30000 },
      { queryKey: ["adminDashboard", "supportRequests"], queryFn: getSupportRequestStatistics, refetchInterval: 30000 },
      { queryKey: ["adminDashboard", "categories"], queryFn: getCategoryStatistics, refetchInterval: 30000 },
      { queryKey: ["adminDashboard", "reports"], queryFn: getReportStatistics, refetchInterval: 30000 },
      { queryKey: ["adminDashboard", "posts"], queryFn: getPostStatistics, refetchInterval: 30000 },
      { queryKey: ["adminStats", "communityFunds"], queryFn: () => getCommunityFunds(false), refetchInterval: 30000 },
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

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        usersQuery.refetch(),
        requestsQuery.refetch(),
        categoriesQuery.refetch(),
        reportsQuery.refetch(),
        postsQuery.refetch(),
        fundsQuery.refetch(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [usersQuery, requestsQuery, categoriesQuery, reportsQuery, postsQuery, fundsQuery]);

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
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
          }
        >
          {hasError ? (
            <View style={[styles.warningBox, { backgroundColor: theme.danger + "12", borderColor: theme.danger }]}>
              <MaterialIcons name="error-outline" size={18} color={theme.danger} />
              <Text style={{ color: theme.danger, flex: 1, fontSize: 13 }}>
                Some statistics could not be refreshed. Showing available data.
              </Text>
              <Pressable onPress={handleRefresh}>
                <Text style={{ color: theme.primary, fontWeight: "800" }}>Retry</Text>
              </Pressable>
            </View>
          ) : null}
          <Section title="User Statistics" icon="people">
            <View style={styles.grid}>
              <StatPill label="Total Users" value={userStats?.totalUsers || 0} />
              <StatPill label="Active" value={userStats?.activeUsers || 0} />
              <StatPill label="Inactive" value={userStats?.inactiveUsers || 0} />
            </View>
            <DonutChart
              data={[
                { label: "Requester", value: userStats?.requesters || 0 },
                { label: "Volunteer", value: userStats?.volunteers || 0 },
                { label: "Collaborator", value: userStats?.collaborators || 0 },
                { label: "Admin", value: userStats?.admins || 0 },
              ]}
            />
          </Section>

          <Section title="Support Request Statistics" icon="volunteer-activism">
            <View style={styles.grid}>
              <StatPill label="Total SR" value={requestStats?.totalSupportRequests || 0} />
              <StatPill label="Approved" value={requestStats?.approved || 0} />
              <StatPill label="In Progress" value={requestStats?.inProgress || 0} />
              <StatPill label="Completed" value={requestStats?.completed || 0} />
            </View>
            <DonutChart
              data={[
                { label: "Pending", value: requestStats?.pending || 0 },
                { label: "Approved", value: requestStats?.approved || 0 },
                { label: "In Progress", value: requestStats?.inProgress || 0 },
                { label: "Rejected", value: requestStats?.rejected || 0 },
                { label: "Completed", value: requestStats?.completed || 0 },
                { label: "Cancelled", value: requestStats?.cancelled || 0 },
              ]}
            />
          </Section>

          <Section title="Category Statistics" icon="category">
            <View style={styles.grid}>
              <StatPill label="Total Categories" value={categoryStats?.totalCategories || 0} />
              <StatPill label="Active Categories" value={categoryStats?.activeCategories || 0} />
            </View>
            <View style={styles.list}>
              <DonutChart
                data={(categoryStats?.categories || []).map((category, index) => ({
                  label: category.categoryName,
                  value: category.supportRequestCount,
                  color: CHART_COLORS[index % CHART_COLORS.length],
                }))}
              />
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
            <DonutChart
              data={[
                { label: "Pending", value: reportStats?.pending || 0 },
                { label: "Reviewed", value: reportStats?.reviewed || 0 },
                { label: "Resolved", value: reportStats?.resolved || 0 },
              ]}
            />
            <DonutChart
              data={[
                { label: "Support Request", value: reportStats?.supportRequestReports || 0 },
                { label: "Post", value: reportStats?.postReports || 0 },
                { label: "User", value: reportStats?.userReports || 0 },
              ]}
            />
          </Section>

          <Section title="Post Statistics" icon="article">
            <View style={styles.grid}>
              <StatPill label="Total Posts" value={postStats?.totalPosts || 0} />
              <StatPill label="Active" value={postStats?.active || 0} />
              <StatPill label="Under Review" value={postStats?.underReview || 0} />
              <StatPill label="Hidden" value={postStats?.hidden || 0} />
              <StatPill label="Removed" value={postStats?.removed || 0} />
            </View>
            <DonutChart
              data={[
                { label: "Active", value: postStats?.active || 0 },
                { label: "Under Review", value: postStats?.underReview || 0 },
                { label: "Hidden", value: postStats?.hidden || 0 },
                { label: "Removed", value: postStats?.removed || 0 },
              ]}
            />
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
  warningBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
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
  chartWrap: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    marginTop: 6,
  },
  chartBox: {
    width: 148,
    height: 148,
    alignItems: "center",
    justifyContent: "center",
  },
  chartCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  chartTotal: { fontSize: 20, fontWeight: "900" },
  chartTotalLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  legendList: { flex: 1, gap: 7 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { flex: 1, fontSize: 12, fontWeight: "700" },
  legendValue: { fontSize: 12, fontWeight: "800" },
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
