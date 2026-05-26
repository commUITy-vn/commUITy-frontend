import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BorderRadius, Spacing } from '@/constants/theme';

const initialPending = [
  { id: 'p1', title: 'Support Request #123', description: 'Emergency grocery assistance needed for a low-income family of 5 in District 7.', author: 'Nguyen Van Minh' },
  { id: 'p2', title: 'Support Request #124', description: 'Financial medical assistance for urgent prescription medication.', author: 'Tran Thi Dung' },
];

const initialReports = [
  { id: 'r1', title: 'Report #456', description: 'Offensive language used in Explore feed comment on Post #8.', reportedUser: 'Le Minh Tu', reason: 'Abusive language' },
];

export default function ModerationScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<'pending' | 'reports'>('pending');
  const [pendingList, setPendingList] = useState(initialPending);
  const [reportsList, setReportsList] = useState(initialReports);

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleApprove = async (id: string) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (tab === 'pending') {
      setPendingList(prev => prev.filter(item => item.id !== id));
    } else {
      setReportsList(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleReject = async (id: string) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (tab === 'pending') {
      setPendingList(prev => prev.filter(item => item.id !== id));
    } else {
      setReportsList(prev => prev.filter(item => item.id !== id));
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <View style={[styles.itemCard, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <MaterialIcons
            name={tab === 'pending' ? 'volunteer-activism' : 'gavel'}
            size={20}
            color={theme.primary}
          />
          <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
        </View>
        
        <Text style={[styles.itemDesc, { color: theme.textSupporting }]}>{item.description}</Text>

        <View style={[styles.metaInfo, { backgroundColor: theme.highlightBG }]}>
          <Text style={{ fontSize: 12, color: theme.textSupporting }}>
            {tab === 'pending' ? `Requester: ${item.author}` : `Reported User: ${item.reportedUser} | Reason: ${item.reason}`}
          </Text>
        </View>

        <View style={[styles.actionsRow, { borderTopColor: theme.border }]}>
          <Pressable
            onPress={() => handleApprove(item.id)}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: '#E5F6EE',
                borderColor: '#008040',
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <MaterialIcons name="check" size={18} color="#008040" />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#008040' }}>Approve</Text>
          </Pressable>
          
          <Pressable
            onPress={() => handleReject(item.id)}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: '#FFE5E5',
                borderColor: theme.danger,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <MaterialIcons name="close" size={18} color={theme.danger} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.danger }}>Reject</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const activeData = tab === 'pending' ? pendingList : reportsList;

  return (
    <View style={[styles.container, { backgroundColor: theme.appBG }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.componentBG }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Moderation Queue</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Modern Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: theme.border, backgroundColor: theme.componentBG }]}>
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTab('pending');
          }}
          style={[styles.tab, tab === 'pending' && { borderBottomColor: theme.primary }]}
        >
          <Text style={[styles.tabText, { color: tab === 'pending' ? theme.primary : theme.textSupporting, fontWeight: tab === 'pending' ? '700' : '500' }]}>
            Pending Requests ({pendingList.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTab('reports');
          }}
          style={[styles.tab, tab === 'reports' && { borderBottomColor: theme.primary }]}
        >
          <Text style={[styles.tabText, { color: tab === 'reports' ? theme.primary : theme.textSupporting, fontWeight: tab === 'reports' ? '700' : '500' }]}>
            User Reports ({reportsList.length})
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={activeData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="check-circle-outline" size={48} color={theme.textSupporting} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginTop: 12 }}>All Clear!</Text>
            <Text style={{ fontSize: 14, color: theme.textSupporting, marginTop: 4, textAlign: 'center' }}>
              No items require moderation in this queue.
            </Text>
          </View>
        )}
      />
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 13,
  },
  list: {
    padding: Spacing.base,
    gap: Spacing.base,
  },
  itemCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 16,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaInfo: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
});