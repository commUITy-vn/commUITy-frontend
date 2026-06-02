import { MaterialIcons } from "@expo/vector-icons";
import { useQueries } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/ui";
import { getSupportNeeds } from "@/features/support/api/get-support-needs";
import type { SupportRequestSummaryResponse } from "@/features/support/api/get-support-requests";
import { useMySupportRequests } from "@/features/support/hooks/useSupportRequests";
import { SupportStatus } from "@/features/support/types/support.types";
import { useTheme } from "@/hooks/useTheme";
import { useThemeStyles } from "@/hooks/useThemeStyles";

const StatCard = ({ label, value }: { label: string; value: string }) => {
  const theme = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: theme.highlightBG }]}>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSupporting }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const statusColor = (status: string, theme: any) => {
  switch (status) {
    case SupportStatus.PENDING:
      return { bg: "#E2E8F0", text: "#475569" };
    case SupportStatus.APPROVED:
      return { bg: "#E5F6EE", text: "#008040" };
    case SupportStatus.IN_PROGRESS:
      return { bg: "#E0F2FE", text: "#0369A1" };
    case SupportStatus.COMPLETED:
      return { bg: "#DCFCE7", text: "#166534" };
    case SupportStatus.REJECTED:
      return { bg: "#FFE5E5", text: theme.danger };
    default:
      return { bg: theme.highlightBG, text: theme.textSupporting };
  }
};

export default function RequesterDashboardScreen() {
  const theme = useTheme();
  const stylesGlobal = useThemeStyles();
  const router = useRouter();
  const { data: requests = [], isLoading, isError, refetch } = useMySupportRequests();

  const needsQueries = useQueries({
    queries: requests.map((request) => ({
      queryKey: ["supportNeeds", request.id],
      queryFn: () => getSupportNeeds(request.id),
      enabled: !!request.id,
    })),
  });

  const needSummaryByRequest = useMemo(() => {
    const summary = new Map<string, { total: number; fulfilled: number }>();
    requests.forEach((request, index) => {
      const needs = needsQueries[index]?.data || [];
      summary.set(request.id, {
        total: needs.length,
        fulfilled: needs.filter((need) => need.isFulfilled).length,
      });
    });
    return summary;
  }, [needsQueries, requests]);

  const pendingCount = requests.filter((r) => r.status === SupportStatus.PENDING).length;
  const activeCount = requests.filter(
    (r) => r.status === SupportStatus.APPROVED || r.status === SupportStatus.IN_PROGRESS,
  ).length;
  const completedCount = requests.filter((r) => r.status === SupportStatus.COMPLETED).length;
  const totalNeeds = Array.from(needSummaryByRequest.values()).reduce(
    (sum, item) => sum + item.total,
    0,
  );
  const fulfilledNeeds = Array.from(needSummaryByRequest.values()).reduce(
    (sum, item) => sum + item.fulfilled,
    0,
  );

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleOpenRequest = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/request/[id]", params: { id } } as any);
  };

  const renderRequest = ({ item }: { item: SupportRequestSummaryResponse }) => {
    const colors = statusColor(item.status, theme);
    const needSummary = needSummaryByRequest.get(item.id) || { total: 0, fulfilled: 0 };
    const needsLoading = needsQueries[requests.findIndex((r) => r.id === item.id)]?.isLoading;

    return (
      <Pressable
        onPress={() => handleOpenRequest(item.id)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.componentBG,
            borderColor: theme.border,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={[styles.meta, { color: theme.textSupporting }]} numberOfLines={1}>
          {item.categoryName || "Uncategorized"}
        </Text>
        <Text style={[styles.meta, { color: theme.textSupporting }]} numberOfLines={2}>
          {item.address || "No address supplied"}
        </Text>

        <View style={[styles.progressBox, { backgroundColor: theme.highlightBG }]}>
          <MaterialIcons name="inventory-2" size={18} color={theme.primary} />
          <Text style={[styles.progressText, { color: theme.text }]}>
            {needsLoading
              ? "Loading needs..."
              : `${needSummary.fulfilled}/${needSummary.total} needs fulfilled`}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <Button
            text={
              item.status === SupportStatus.PENDING
                ? "Edit Request"
                : "Manage Details"
            }
            onPress={() => handleOpenRequest(item.id)}
            primary={item.status === SupportStatus.PENDING}
            style={{ flex: 1 }}
          />
        </View>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        stylesGlobal.container,
        {
          backgroundColor: theme.appBG,
          height: (Platform.OS === "web" ? "100vh" : "100%") as any,
        },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Requests</Text>
        <Pressable
          onPress={() => router.push("/create-request" as any)}
          style={styles.backButton}
        >
          <MaterialIcons name="add" size={26} color={theme.primary} />
        </Pressable>
      </View>

      <View style={{ padding: 16, flex: 1 }}>
        <View style={styles.statsGrid}>
          <StatCard label="Total" value={String(requests.length)} />
          <StatCard label="Pending" value={String(pendingCount)} />
          <StatCard label="Active" value={String(activeCount)} />
          <StatCard label="Completed" value={String(completedCount)} />
        </View>
        <View style={[styles.summaryBar, { backgroundColor: theme.highlightBG }]}>
          <MaterialIcons name="checklist" size={18} color={theme.primary} />
          <Text style={{ color: theme.text, fontWeight: "700" }}>
            {fulfilledNeeds}/{totalNeeds} support needs fulfilled
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : isError ? (
          <View style={styles.center}>
            <Text style={{ color: theme.textSupporting }}>Failed to load your requests.</Text>
            <Button text="Try Again" onPress={() => refetch()} style={{ marginTop: 12 }} />
          </View>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            renderItem={renderRequest}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 80, gap: 12 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.center}>
                <MaterialIcons name="volunteer-activism" size={46} color={theme.textSupporting} />
                <Text style={{ color: theme.text, fontWeight: "700", marginTop: 10 }}>
                  No support requests yet
                </Text>
                <Button
                  text="Create Support Request"
                  onPress={() => router.push("/create-request" as any)}
                  primary
                  style={{ marginTop: 14 }}
                />
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { padding: 12 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  statsGrid: { flexDirection: "row", gap: 8 },
  statCard: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { marginTop: 3, fontSize: 11, fontWeight: "600" },
  summaryBar: {
    marginTop: 12,
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: "800" },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: "800" },
  meta: { fontSize: 13, lineHeight: 18 },
  progressBox: {
    marginTop: 4,
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressText: { fontSize: 13, fontWeight: "700" },
  actionsRow: { flexDirection: "row", marginTop: 4 },
});
