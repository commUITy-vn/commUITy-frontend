import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Platform, Modal, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '@/features/users/api/get-users';
import { updateUserRole } from '@/features/users/api/update-user-role';
import { updateUserStatus } from '@/features/users/api/update-user-status';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';

const initialUsers = [
  { id: 'mock-1', name: 'Nguyen Van A', role: 'ADMIN', status: 'Active', email: 'a.nguyen@commuity.org' },
  { id: 'mock-2', name: 'Le Thi B', role: 'REQUESTER', status: 'Suspended', email: 'b.le@commuity.org' },
  { id: 'mock-3', name: 'Tran Van C', role: 'COLLABORATOR', status: 'Active', email: 'c.tran@commuity.org' },
  { id: 'mock-4', name: 'Pham Minh D', role: 'VOLUNTEER', status: 'Active', email: 'd.pham@commuity.org' },
];

export default function UsersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [usersList, setUsersList] = useState(initialUsers);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<any>(null);
  const [detailUser, setDetailUser] = useState<any>(null);

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Fetch real users from backend if available, with a graceful fallback to mock data
  const { data: realUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const response: any = await getUsers();
        // Since Spring Boot /api/v1/users returns Page<UserSummaryResponse> inside ApiResponse:
        const pageData = response?.data || response;
        if (pageData && (Array.isArray(pageData.content) || Array.isArray(pageData))) {
          const list = Array.isArray(pageData.content) ? pageData.content : pageData;
          return list.map((u: any) => ({
            id: u.id || String(Math.random()),
            name: u.fullName || u.name || 'Real User',
            role: u.role || 'REQUESTER',
            status: u.isActive === false || u.status === 'SUSPENDED' ? 'Suspended' : 'Active',
            email: u.email || 'user@commuity.org',
            phone: u.phone || u.phoneNumber || '',
            address: u.address || '',
            createdAt: u.createdAt || '',
          }));
        }
      } catch (e) {
        console.warn('Real users fetch failed, falling back to mock users:', e);
      }
      return initialUsers;
    },
    retry: false,
  });

  useEffect(() => {
    if (realUsers) {
      setUsersList(realUsers);
    }
  }, [realUsers]);

  const handleToggleBlock = async (userId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const targetUser = usersList.find(u => u.id === userId);
    if (!targetUser) return;
    if (targetUser.id === currentUser?.id) {
      Alert.alert('Action blocked', 'You cannot suspend or restore your own admin account from this screen.');
      return;
    }
    const isCurrentlySuspended = targetUser.status === 'Suspended';
    const nextStatus = isCurrentlySuspended ? 'Active' : 'Suspended';
    const nextIsActive = isCurrentlySuspended;

    Alert.alert(
      isCurrentlySuspended ? 'Restore user?' : 'Suspend user?',
      `${targetUser.name} will be marked as ${nextStatus}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isCurrentlySuspended ? 'Restore' : 'Suspend',
          style: isCurrentlySuspended ? 'default' : 'destructive',
          onPress: async () => {
            setUsersList(prev =>
              prev.map(u =>
                u.id === userId
                  ? { ...u, status: nextStatus }
                  : u
              )
            );

            try {
              if (userId && !userId.startsWith('mock-') && userId.length > 5) {
                await updateUserStatus(userId, nextIsActive);
              }
            } catch (err: any) {
              console.error('Failed to update status on server:', err);
              Alert.alert('Update failed', err?.message || 'Could not update user status.');
              setUsersList(prev =>
                prev.map(u =>
                  u.id === userId
                    ? { ...u, status: targetUser.status }
                    : u
                )
              );
            }
          },
        },
      ]
    );
  };

  const handleChangeRole = async (role: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const targetUser = selectedUserForRole;
    if (!targetUser) return;
    if (targetUser.id === currentUser?.id) {
      Alert.alert('Action blocked', 'You cannot change your own role from this screen.');
      return;
    }
    if (targetUser.role === 'ADMIN' && role !== 'ADMIN') {
      Alert.alert('Action blocked', 'Admin accounts cannot be downgraded from the mobile admin panel.');
      return;
    }
    if (targetUser.role === role) {
      Alert.alert('No change needed', `${targetUser.name} already has the ${role} role.`);
      return;
    }

    const workflowWarning =
      targetUser.role === 'REQUESTER' || role === 'REQUESTER' || targetUser.role === 'VOLUNTEER' || role === 'VOLUNTEER'
        ? '\n\nThis may change which dashboard and use-case actions the user can access. Existing records remain in backend, but the user may no longer see the same role panel.'
        : '';

    Alert.alert(
      'Change role?',
      `${targetUser.name} will be changed from ${targetUser.role} to ${role}.${workflowWarning}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: async () => {
            const originalRole = targetUser.role;
            setUsersList(prev =>
              prev.map(u =>
                u.id === targetUser.id ? { ...u, role } : u
              )
            );
            setRoleModalVisible(false);

            try {
              const userId = targetUser.id;
              if (userId && !userId.startsWith('mock-') && userId.length > 5) {
                await updateUserRole(userId, role);
              }
            } catch (err: any) {
              console.error('Failed to update role on server:', err);
              Alert.alert('Update failed', err?.message || 'Could not update user role.');
              setUsersList(prev =>
                prev.map(u =>
                  u.id === targetUser.id ? { ...u, role: originalRole } : u
                )
              );
            } finally {
              setSelectedUserForRole(null);
            }
          },
        },
      ]
    );
  };



  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return theme.danger;
      case 'COLLABORATOR':
        return theme.primary;
      case 'VOLUNTEER':
        return theme.success;
      default:
        return theme.textSupporting;
    }
  };

  const renderItem = ({ item }: { item: typeof initialUsers[0] }) => {
    const isSuspended = item.status === 'Suspended';
    const initial = item.name ? item.name.charAt(0).toUpperCase() : 'U';

    return (
      <View style={[styles.userCard, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
        {/* User Profile Summary */}
        <View style={styles.userInfoRow}>
          <View style={[styles.avatar, { backgroundColor: theme.highlightBG, borderColor: theme.border }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>{initial}</Text>
          </View>
          <View style={styles.userMeta}>
            <Text style={[styles.userName, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.userEmail, { color: theme.textSupporting }]}>{item.email}</Text>
          </View>
          <View style={styles.statusTags}>
            <View style={[styles.badge, { backgroundColor: theme.highlightBG, borderColor: getRoleColor(item.role) }]}>
              <Text style={[styles.badgeText, { color: getRoleColor(item.role) }]}>{item.role}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: isSuspended ? '#FFE5E5' : '#E5F6EE', borderColor: isSuspended ? theme.danger : '#008040' }]}>
              <Text style={[styles.badgeText, { color: isSuspended ? theme.danger : '#008040' }]}>{item.status}</Text>
            </View>
          </View>
        </View>

        {/* Action Controls */}
        <View style={[styles.actionsRow, { borderTopColor: theme.border }]}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              {
                borderColor: theme.border,
                backgroundColor: pressed ? theme.highlightBG : 'transparent',
              },
            ]}
            onPress={() => setDetailUser(item)}
          >
            <MaterialIcons name="info-outline" size={18} color={theme.primary} />
            <Text style={[styles.actionText, { color: theme.text }]}>Details</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              {
                borderColor: theme.border,
                backgroundColor: pressed ? theme.highlightBG : 'transparent',
              },
            ]}
            onPress={() => {
              setSelectedUserForRole(item);
              setRoleModalVisible(true);
            }}
          >
            <MaterialIcons name="swap-horiz" size={18} color={theme.primary} />
            <Text style={[styles.actionText, { color: theme.text }]}>Change Role</Text>
          </Pressable>
          
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              {
                borderColor: theme.border,
                backgroundColor: pressed ? (isSuspended ? '#E5F6EE' : '#FFE5E5') : 'transparent',
              },
            ]}
            onPress={() => handleToggleBlock(item.id)}
          >
            <MaterialIcons
              name={isSuspended ? 'lock-open' : 'block'}
              size={18}
              color={isSuspended ? '#008040' : theme.danger}
            />
            <Text style={[styles.actionText, { color: isSuspended ? '#008040' : theme.danger }]}>
              {isSuspended ? 'Unsuspend' : 'Suspend'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.appBG }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>User Management</Text>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        data={usersList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Role Picker Modal */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setRoleModalVisible(false);
          setSelectedUserForRole(null);
        }}
      >
        <Pressable
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: 20,
          }}
          onPress={() => {
            setRoleModalVisible(false);
            setSelectedUserForRole(null);
          }}
        >
          <Pressable
            style={{
              width: '100%',
              maxWidth: 320,
              backgroundColor: theme.componentBG,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
              padding: 20,
              gap: 12,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 8, textAlign: 'center' }}>
              Select Role for {selectedUserForRole?.name}
            </Text>
            
            {['REQUESTER', 'VOLUNTEER', 'COLLABORATOR', 'ADMIN'].map((role) => (
              <Pressable
                key={role}
                onPress={() => handleChangeRole(role)}
                style={({ pressed }) => ({
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  borderWidth: 1.5,
                  borderColor: selectedUserForRole?.role === role ? theme.primary : theme.border,
                  backgroundColor: selectedUserForRole?.role === role ? theme.highlightBG : 'transparent',
                  alignItems: 'center',
                  opacity: selectedUserForRole?.role === 'ADMIN' && role !== 'ADMIN' ? 0.45 : pressed ? 0.8 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: selectedUserForRole?.role === role ? theme.primary : theme.text,
                  }}
                >
                  {role}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={!!detailUser}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailUser(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setDetailUser(null)}>
          <Pressable
            style={[styles.detailModal, { backgroundColor: theme.componentBG, borderColor: theme.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.detailHeader}>
              <Text style={[styles.detailTitle, { color: theme.text }]}>User Details</Text>
              <Pressable onPress={() => setDetailUser(null)}>
                <MaterialIcons name="close" size={22} color={theme.icon} />
              </Pressable>
            </View>
            {detailUser && [
              ['Name', detailUser.name],
              ['Email', detailUser.email],
              ['Role', detailUser.role],
              ['Status', detailUser.status],
              ['Phone', detailUser.phone || 'N/A'],
              ['Address', detailUser.address || 'N/A'],
              ['User ID', detailUser.id],
            ].map(([label, value]) => (
              <View key={label} style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.detailLabel, { color: theme.textSupporting }]}>{label}</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
              </View>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
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
  list: {
    padding: Spacing.base,
    gap: Spacing.base,
  },
  userCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 14,
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
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  userMeta: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 12,
  },
  statusTags: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  detailModal: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 12,
    borderWidth: 1,
    padding: 18,
    gap: 4,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  detailRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
