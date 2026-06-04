import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BorderRadius, Spacing } from '@/constants/theme';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/features/communication/hooks/useNotifications';

export default function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();

  // Hooks
  const { data: notifications, isLoading, isError } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleMarkAllAsRead = async () => {
    if (!notifications || notifications.length === 0) return;
    const hasUnread = notifications.some((n: any) => !n.isRead);
    if (!hasUnread) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await markAllReadMutation.mutateAsync();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationPress = async (item: any) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Mark as read if not already
    if (!item.isRead) {
      try {
        await markReadMutation.mutateAsync(item.id);
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    // Smart Routing based on referenceType/referenceId or actionUrl
    if (item.referenceType && item.referenceId) {
      const type = item.referenceType.toUpperCase();
      if (type === 'SUPPORT_REQUEST' || type === 'VOLUNTEER_ASSIGNMENT') {
        router.push({ pathname: '/request/[id]', params: { id: item.referenceId } } as any);
        return;
      }
      if (type === 'SUPPORT_LOCATION') {
        router.push({ pathname: '/location/[id]', params: { id: item.referenceId } } as any);
        return;
      }
      if (type === 'CONVERSATION') {
        router.push({ pathname: '/messages/[id]', params: { id: item.referenceId } } as any);
        return;
      }
    }

    if (item.actionUrl) {
      try {
        let target = item.actionUrl;
        
        // Rewrite backend URLs to correct frontend routes
        if (target.includes('/conversations/')) {
          target = target.replace('/conversations/', '/messages/');
        }
        if (target.includes('/support-requests/')) {
          target = target.replace('/support-requests/', '/request/');
        }
        if (target.startsWith('/api/v1/')) {
          target = target.replace('/api/v1/', '/');
        }
        
        const conversationMatch = target.match(/\/messages\/([^/?#]+)/);
        if (conversationMatch) {
          router.push({ pathname: '/messages/[id]', params: { id: conversationMatch[1] } } as any);
          return;
        }
        const requestMatch = target.match(/\/request\/([^/?#]+)/);
        if (requestMatch) {
          router.push({ pathname: '/request/[id]', params: { id: requestMatch[1] } } as any);
          return;
        }
        const locationMatch = target.match(/\/location\/([^/?#]+)/);
        if (locationMatch) {
          router.push({ pathname: '/location/[id]', params: { id: locationMatch[1] } } as any);
          return;
        }
        router.push(target as any);
      } catch {
        console.warn('Could not navigate to actionUrl:', item.actionUrl);
      }
    }
  };

  const getNotificationIcon = (type?: string) => {
    const iconType = type ? type.toUpperCase() : '';
    switch (iconType) {
      case 'SUPPORT_REQUEST':
        return { name: 'help-circle-outline', color: theme.primary };
      case 'SUPPORT_LOCATION':
        return { name: 'location-outline', color: theme.success };
      case 'CONVERSATION':
        return { name: 'chatbubble-ellipses-outline', color: '#3B82F6' };
      default:
        return { name: 'notifications-outline', color: theme.textSupporting };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isUnread = !item.isRead;
    const iconInfo = getNotificationIcon(item.referenceType);

    return (
      <Pressable
        onPress={() => handleNotificationPress(item)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: isUnread
              ? theme.highlightBG
              : pressed
              ? theme.borderLighter
              : theme.componentBG,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: iconInfo.color + '15' }]}>
            <Ionicons name={iconInfo.name as any} size={22} color={iconInfo.color} />
          </View>
          <View style={styles.contentArea}>
            <Text style={[styles.content, { color: theme.text, fontWeight: isUnread ? '700' : '400' }]}>
              {item.content}
            </Text>
            <Text style={[styles.time, { color: theme.textSupporting }]}>
              {new Date(item.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          {isUnread && (
            <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
          )}
        </View>
      </Pressable>
    );
  };

  // Determine if header action is enabled
  const hasUnread = notifications && notifications.some((n: any) => !n.isRead);

  return (
    <View style={[styles.container, { backgroundColor: theme.appBG }]}>
      {/* Header - transparent background to match edit-profile and standards */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
        <Pressable
          onPress={handleMarkAllAsRead}
          style={[styles.actionBtn, { opacity: hasUnread ? 1 : 0.4 }]}
          disabled={!hasUnread}
        >
          <MaterialIcons name="done-all" size={24} color={theme.primary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={48} color={theme.danger} />
          <Text style={[styles.errorText, { color: theme.text, marginTop: 12 }]}>
            Failed to load notifications
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.highlightBG }]}>
                <Ionicons name="notifications-off-outline" size={40} color={theme.textSupporting} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>All Caught Up!</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSupporting }]}>
                You have no new notifications at the moment.
              </Text>
            </View>
          }
        />
      )}
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
  actionBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: Spacing.base,
    gap: Spacing.base,
    paddingBottom: 40,
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 1,
      },
      android: {
        elevation: 0.5,
      },
      default: {},
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentArea: {
    flex: 1,
    gap: 4,
  },
  content: {
    fontSize: 14,
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
