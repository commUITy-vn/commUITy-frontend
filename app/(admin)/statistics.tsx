import React, { useMemo } from "react";
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
import { getPosts } from "@/features/community/api/get-posts";
import { getCommunityFunds } from "@/features/finance/hooks/useCommunityFunds";
import { getAllReports } from "@/features/reports/api/get-all-reports";
import { ReportTargetType } from "@/features/reports/types/reports.types";
import { getCategories } from "@/features/support/api/get-categories";
import { getSupportRequests } from "@/features/support/api/get-support-requests";
import { SupportStatus } from "@/features/support/types/support.types";
import { getUsers } from "@/features/users/api/get-users";
import { useTheme } from "@/hooks/useTheme";

type CountMap = Record<string, number>;

const toArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const countBy = (items: any[], key: string): CountMap =>
  items.reduce((acc: CountMap, item: any) => {
    const value = item?.[key] || "UNKNOWN";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

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
      { queryKey: ["adminStats", "users"], queryFn: getUsers },
      { queryKey: ["adminStats", "supportRequests"], queryFn: () => getSupportRequests() },
      { queryKey: ["adminStats", "categories"], queryFn: () => getCategories(false) },
      { queryKey: ["adminStats", "reports"], queryFn: getAllReports },
      { queryKey: ["adminStats", "posts"], queryFn: () => getPosts() },
      { queryKey: ["adminStats", "communityFunds"], queryFn: () => getCommunityFunds(false) },
    ],
  });

  const users = toArray(usersQuery.data);
  const requests = toArray(requestsQuery.data);
  const categories = toArray(categoriesQuery.data);
  const reports = toArray(reportsQuery.data);
  const posts = toArray(postsQuery.data);
  const funds = toArray(fundsQuery.data);

  const requestStatus = useMemo(() => countBy(requests, "status"), [requests]);
  const userRoles = useMemo(() => countBy(users, "role"), [users]);
  const reportStatus = useMemo(() => countBy(reports, "status"), [reports]);
  const reportTargets = useMemo(() => countBy(reports, "targetType"), [reports]);
  const postStatus = useMemo(() => countBy(posts, "status"), [posts]);
  const requestsByCategory = useMemo(
    () => countBy(requests, "categoryName"),
    [requests],
  );

  const activeUsers = users.filter((user) => user.status === "ACTIVE" || user.isActive === true).length;
  const inactiveUsers = users.length - activeUsers;
  const activeCategories = categories.filter((category) => category.isActive !== false).length;
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
              <StatPill label="Total Users" value={users.length} />
              <StatPill label="Active" value={activeUsers} />
              <StatPill label="Inactive" value={inactiveUsers} />
              <StatPill label="Requester" value={userRoles.REQUESTER || 0} />
              <StatPill label="Volunteer" value={userRoles.VOLUNTEER || 0} />
              <StatPill label="Collaborator" value={userRoles.COLLABORATOR || 0} />
              <StatPill label="Admin" value={userRoles.ADMIN || 0} />
            </View>
          </Section>

          <Section title="Support Request Statistics" icon="volunteer-activism">
            <View style={styles.grid}>
              <StatPill label="Total SR" value={requests.length} />
              <StatPill label="Pending" value={requestStatus[SupportStatus.PENDING] || 0} />
              <StatPill label="Approved" value={requestStatus[SupportStatus.APPROVED] || 0} />
              <StatPill label="In Progress" value={requestStatus[SupportStatus.IN_PROGRESS] || 0} />
              <StatPill label="Rejected" value={requestStatus[SupportStatus.REJECTED] || 0} />
              <StatPill label="Completed" value={requestStatus[SupportStatus.COMPLETED] || 0} />
              <StatPill label="Cancelled" value={requestStatus[SupportStatus.CANCELLED] || 0} />
            </View>
          </Section>

          <Section title="Category Statistics" icon="category">
            <View style={styles.grid}>
              <StatPill label="Total Categories" value={categories.length} />
              <StatPill label="Active Categories" value={activeCategories} />
            </View>
            <View style={styles.list}>
              {Object.entries(requestsByCategory).map(([category, count]) => (
                <View key={category} style={[styles.row, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.rowLabel, { color: theme.text }]}>{category}</Text>
                  <Text style={[styles.rowValue, { color: theme.textSupporting }]}>{count}</Text>
                </View>
              ))}
            </View>
          </Section>

          <Section title="Report Statistics" icon="report">
            <View style={styles.grid}>
              <StatPill label="Total Reports" value={reports.length} />
              <StatPill label="Pending" value={reportStatus.PENDING || 0} />
              <StatPill label="Reviewed" value={reportStatus.REVIEWED || 0} />
              <StatPill label="Resolved" value={reportStatus.RESOLVED || 0} />
              <StatPill label="SR Target" value={reportTargets[ReportTargetType.SUPPORT_REQUEST] || 0} />
              <StatPill label="Post Target" value={reportTargets[ReportTargetType.POST] || 0} />
              <StatPill label="User Target" value={reportTargets[ReportTargetType.USER] || 0} />
            </View>
          </Section>

          <Section title="Post Statistics" icon="article">
            <View style={styles.grid}>
              <StatPill label="Total Posts" value={posts.length} />
              <StatPill label="Active" value={postStatus.ACTIVE || posts.filter((post) => post.isActive !== false).length} />
              <StatPill label="Under Review" value={postStatus.UNDER_REVIEW || 0} />
              <StatPill label="Hidden" value={postStatus.HIDDEN || 0} />
              <StatPill label="Removed" value={postStatus.REMOVED || 0} />
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
