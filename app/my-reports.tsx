import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useMyReports } from '@/features/reports/hooks/useMyReports';
import { ReportTargetType, ReportStatus } from '@/features/reports/types/reports.types';
import { useQueries } from '@tanstack/react-query';
import { usePosts } from '@/features/community/hooks/usePosts';
import { getUser } from '@/features/users/api/get-user';
import { getSupportRequestById } from '@/features/support/api/get-support-request-by-id';

export default function MyReportsScreen() {
  const theme = useTheme();
  const styles = useThemeStyles();
  const router = useRouter();

  const { data: reports, isLoading, isError, refetch } = useMyReports();
  const { data: postsData } = usePosts();
  const posts = React.useMemo(
    () => (Array.isArray(postsData) ? postsData : []),
    [postsData],
  );
  const targetQueries = useQueries({
    queries: (reports || [])
      .filter((report: any) => report.targetType !== ReportTargetType.POST)
      .map((report: any) => ({
        queryKey: ['reportTarget', report.targetType, report.targetId],
        queryFn: () => {
          if (report.targetType === ReportTargetType.USER) {
            return getUser(report.targetId);
          }
          if (report.targetType === ReportTargetType.SUPPORT_REQUEST) {
            return getSupportRequestById(report.targetId);
          }
          return Promise.resolve(null);
        },
        enabled: !!report.targetId,
        retry: false,
      })),
  });

  const targetLabelByReportId = React.useMemo(() => {
    const labels = new Map<string, string>();
    let queryIndex = 0;

    (reports || []).forEach((report: any) => {
      if (report.targetType === ReportTargetType.POST) {
        const post = (posts || []).find((item: any) => item.id === report.targetId);
        const content = post?.content ? `"${String(post.content).slice(0, 60)}${String(post.content).length > 60 ? '...' : ''}"` : 'Community post';
        const author = post?.author || post?.authorName || post?.userName;
        labels.set(report.id, author ? `Post: ${content} by ${author}` : `Post: ${content}`);
        return;
      }

      const target = targetQueries[queryIndex]?.data as any;
      queryIndex += 1;
      if (report.targetType === ReportTargetType.USER) {
        labels.set(report.id, `User: ${target?.fullName || target?.email || 'Unknown user'}`);
        return;
      }
      if (report.targetType === ReportTargetType.SUPPORT_REQUEST) {
        labels.set(report.id, `Support request: ${target?.title || 'Unknown request'}`);
        return;
      }
      labels.set(report.id, `Target: ${String(report.targetId).slice(0, 8)}`);
    });

    return labels;
  }, [reports, posts, targetQueries]);

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const getTargetTypeLabel = (type: ReportTargetType) => {
    switch (type) {
      case ReportTargetType.SUPPORT_REQUEST:
        return 'Help Request';
      case ReportTargetType.POST:
        return 'Community Post';
      case ReportTargetType.USER:
        return 'User Profile';
      default:
        return 'Item';
    }
  };

  const getTargetIcon = (type: ReportTargetType) => {
    switch (type) {
      case ReportTargetType.SUPPORT_REQUEST:
        return 'support';
      case ReportTargetType.POST:
        return 'article';
      case ReportTargetType.USER:
        return 'person';
      default:
        return 'warning';
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.PENDING:
        return { text: '#B35900', bg: '#FFF4E5', border: '#FFE6CC' };
      case ReportStatus.REVIEWED:
        return { text: '#0066CC', bg: '#E5F2FF', border: '#CCE6FF' };
      case ReportStatus.RESOLVED:
        return { text: '#008040', bg: '#E5F6EE', border: '#CCF2DF' };
      default:
        return { text: theme.textSupporting, bg: theme.highlightBG, border: theme.border };
    }
  };

  const handleNavigateToTarget = async (type: ReportTargetType, targetId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (type) {
      case ReportTargetType.SUPPORT_REQUEST:
        router.push({ pathname: '/request/[id]', params: { id: targetId } } as any);
        break;
      case ReportTargetType.USER:
        router.push({ pathname: '/profile/[userId]', params: { userId: targetId } } as any);
        break;
      case ReportTargetType.POST:
        router.push('/explore');
        break;
      default:
        break;
    }
  };

  const renderReportItem = ({ item }: { item: any }) => {
    const statusStyle = getStatusColor(item.status);
    return (
      <Pressable
        onPress={() => handleNavigateToTarget(item.targetType, item.targetId)}
        style={({ pressed }) => [
          localStyles.itemCard,
          {
            backgroundColor: theme.componentBG,
            borderColor: theme.border,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        <View style={localStyles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <MaterialIcons
              name={getTargetIcon(item.targetType)}
              size={18}
              color={theme.primary}
            />
            <Text style={[localStyles.itemTitle, { color: theme.text }]} numberOfLines={1}>
              {getTargetTypeLabel(item.targetType)}
            </Text>
          </View>
          <View
            style={[
              localStyles.statusBadge,
              {
                backgroundColor: statusStyle.bg,
                borderColor: statusStyle.border,
              },
            ]}
          >
            <Text style={[localStyles.statusText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 14, color: theme.text, marginTop: 2, marginBottom: 4, lineHeight: 20 }} numberOfLines={2}>
          <Text style={{ fontWeight: '700', color: theme.textSupporting }}>Reason: </Text>
          {item.reason || 'No reason provided'}
        </Text>

        <View style={[localStyles.metaInfo, { backgroundColor: theme.highlightBG }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={[localStyles.itemDesc, { color: theme.textSupporting }]} numberOfLines={1}>
                {targetLabelByReportId.get(item.id) || `${getTargetTypeLabel(item.targetType)}: ${String(item.targetId).slice(0, 8)}`}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={18} color={theme.textSupporting} />
          </View>
        </View>

        <View style={localStyles.cardFooter}>
          <MaterialIcons name="access-time" size={14} color={theme.textSupporting} />
          <Text style={{ fontSize: 11, color: theme.textSupporting }}>
            Submitted: {new Date(item.createdAt).toLocaleDateString([], {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[localStyles.container, { backgroundColor: theme.appBG }]}>
      {/* Header */}
      <View style={[localStyles.headerBlock, { borderBottomColor: theme.border, backgroundColor: theme.componentBG }]}>
        <Pressable onPress={handleBack} style={localStyles.backButton}>
          <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
        </Pressable>
        <Text style={[localStyles.headerTitle, { color: theme.text }]}>My Reports</Text>
        <View style={{ width: 44 }} />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : isError ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <MaterialIcons name="error-outline" size={48} color={theme.danger} style={{ marginBottom: 12 }} />
          <Text style={{ textAlign: 'center', color: theme.textSupporting, fontSize: 16 }}>
            Failed to fetch your reports from the backend.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderReportItem}
          contentContainerStyle={localStyles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={() => (
            <View style={localStyles.emptyContainer}>
              <MaterialIcons name="assignment-turned-in" size={48} color={theme.textSupporting} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginTop: 12 }}>No Reports</Text>
              <Text style={{ fontSize: 14, color: theme.textSupporting, marginTop: 4, textAlign: 'center' }}>
                You have not submitted any community reports.
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBlock: {
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
  list: {
    padding: Spacing.base,
    gap: Spacing.base,
    paddingBottom: 40,
  },
  itemCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 10,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaInfo: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  itemDesc: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
  },
});
