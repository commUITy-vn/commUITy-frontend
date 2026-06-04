import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Modal, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import { getUsers } from '@/features/users/api/get-users';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui';
import { api } from '@/lib/api-client';
import {
  useCommunityFund,
  useFundExpenses,
  useFundDonations,
  useCreateDonation,
  useCreatePayOsDonation,
  useCreateExpense,
  useCommunityFundMembers,
  useAddCommunityFundMember,
  useUpdateCommunityFundMemberRole,
  useRemoveCommunityFundMember,
  type CommunityFundMemberRole,
} from '@/features/finance/hooks/useCommunityFunds';
import { useCreateCommunityFundTransferTicket } from '@/features/money-transfer/hooks';

const QUICK_AMOUNTS = [
  { label: '50.000đ', value: 50000 },
  { label: '100.000đ', value: 100000 },
  { label: '200.000đ', value: 200000 },
  { label: '500.000đ', value: 500000 },
];

const PAYMENT_METHODS = [
  { id: 'PAYOS', label: 'PayOS' },
  { id: 'MOMO', label: 'MoMo' },
  { id: 'ZALOPAY', label: 'ZaloPay' },
  { id: 'BANK_TRANSFER', label: 'Bank Transfer' },
];

export default function FundDetailScreen() {
  const theme = useTheme();
  const stylesGlobal = useThemeStyles();
  const router = useRouter();
  const { id: idParam } = useLocalSearchParams<{ id: string | string[] }>();
  const fundId = Array.isArray(idParam) ? idParam[0] : idParam;
  const { user } = useAuthStore();

  const { data: fund, isLoading: isFundLoading, isError: isFundError } = useCommunityFund(fundId);
  const { data: expenses, isLoading: isExpensesLoading } = useFundExpenses(fundId);
  const { data: donations, isLoading: isDonationsLoading } = useFundDonations(fundId);
  const { data: members = [], isLoading: isMembersLoading } = useCommunityFundMembers(fundId);
  const { data: searchableUsers = [] } = useQuery({
    queryKey: ['fundMemberSearchUsers'],
    queryFn: async () => {
      const response: any = await getUsers();
      const pageData = response?.data || response;
      const list = Array.isArray(pageData?.content)
        ? pageData.content
        : Array.isArray(pageData)
          ? pageData
          : [];
      return list
        .map((u: any) => ({
          id: u.id,
          name: u.fullName || u.name || 'Unnamed user',
          email: u.email || '',
          role: u.role || 'REQUESTER',
          isActive: u.isActive !== false,
        }))
        .filter((u: any) => !!u.id);
    },
    enabled: !!fundId,
    retry: false,
  });

  const createDonationMutation = useCreateDonation();
  const createPayOsDonationMutation = useCreatePayOsDonation();
  const createExpenseMutation = useCreateExpense();
  const createTransferTicketMutation = useCreateCommunityFundTransferTicket(fundId);
  const addMemberMutation = useAddCommunityFundMember(fundId);
  const updateMemberRoleMutation = useUpdateCommunityFundMemberRole(fundId);
  const removeMemberMutation = useRemoveCommunityFundMember(fundId);

  // Modals state
  const [donateModalVisible, setDonateModalVisible] = useState(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [isShareSheetVisible, setIsShareSheetVisible] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isConversationsLoading, setIsConversationsLoading] = useState(false);

  // Donation Form state
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [donationNote, setDonationNote] = useState('');
  const [donationError, setDonationError] = useState('');

  // Expense Form state
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseError, setExpenseError] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferError, setTransferError] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedFundUser, setSelectedFundUser] = useState<any>(null);
  const [memberRole, setMemberRole] = useState<CommunityFundMemberRole>('MEMBER');

  // Load conversations when sharing bottom sheet is open
  useEffect(() => {
    if (isShareSheetVisible) {
      setIsConversationsLoading(true);
      api.get<any>('/api/v1/conversations/me')
        .then((res) => {
          setConversations(res || []);
        })
        .catch((err) => {
          console.error('Failed to load conversations for sharing:', err);
        })
        .finally(() => {
          setIsConversationsLoading(false);
        });
    }
  }, [isShareSheetVisible]);

  const handleShareFund = async (conversationId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const payload = {
        content: `[SHARED_ITEM:FUND:${fundId}:${fund?.name || 'Community Fund'}]`,
      };
      await api.post(`/api/v1/conversations/${conversationId}/messages`, payload);
      Alert.alert('Success', 'Community fund shared successfully!');
      setIsShareSheetVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to share fund.');
    }
  };

  // Combine and sort recent transactions
  const combinedTransactions = useMemo(() => {
    const list: any[] = [];

    if (donations && Array.isArray(donations)) {
      donations.forEach((d) => {
        list.push({
          id: d.id,
          type: 'INCOME',
          amount: d.amount,
          title: d.note || 'Community Donation',
          date: new Date(d.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          createdByName: d.createdByName || 'Anonymous',
          timestamp: new Date(d.createdAt).getTime(),
          method: d.paymentMethod,
          status: d.status,
        });
      });
    }

    if (expenses && Array.isArray(expenses)) {
      expenses.forEach((e) => {
        list.push({
          id: e.id,
          type: 'EXPENSE',
          amount: -e.amount,
          title: e.description || 'Outlay Expense',
          date: new Date(e.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          createdByName: e.createdByName || 'Staff Member',
          timestamp: new Date(e.createdAt).getTime(),
        });
      });
    }

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [donations, expenses]);

  const memberSearchResults = useMemo(() => {
    const query = memberSearchQuery.trim().toLowerCase();
    if (!query) return [];
    return searchableUsers
      .filter((candidate: any) => {
        const haystack = `${candidate.name} ${candidate.email} ${candidate.id}`.toLowerCase();
        const alreadyMember = members.some((m) => m.userId === candidate.id);
        return !alreadyMember && haystack.includes(query);
      })
      .slice(0, 6);
  }, [memberSearchQuery, members, searchableUsers]);

  const currentFundMember = useMemo(
    () => members.find((member) => member.userId === user?.id),
    [members, user?.id],
  );
  const canManageFund = user?.role === 'ADMIN' || currentFundMember?.role === 'MANAGER';
  const managerCount = members.filter((member) => member.role === 'MANAGER').length;

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleOpenDonate = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAmount(null);
    setCustomAmount('');
    setIsCustomAmount(false);
    setSelectedPayment(null);
    setDonationNote('');
    setDonationError('');
    setDonateModalVisible(true);
  };

  const handleOpenExpense = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpenseAmount('');
    setExpenseDescription('');
    setExpenseError('');
    setExpenseModalVisible(true);
  };

  const handleOpenTransferTicket = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTransferAmount('');
    setTransferReason('');
    setTransferError('');
    setTransferModalVisible(true);
  };

  const handleDonateConfirm = async () => {
    const finalAmount = isCustomAmount ? Number(customAmount) : selectedAmount;
    if (!finalAmount || finalAmount <= 0) {
      setDonationError('Please select or specify a valid contribution amount');
      return;
    }
    if (!selectedPayment) {
      setDonationError('Please choose a payment method');
      return;
    }
    setDonationError('');

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (selectedPayment === 'PAYOS') {
        const checkout = await createPayOsDonationMutation.mutateAsync({
          fundId,
          amount: finalAmount,
          note: donationNote.trim() || undefined,
        });
        await WebBrowser.openBrowserAsync(checkout.checkoutUrl);
      } else {
        await createDonationMutation.mutateAsync({
          fundId,
          amount: finalAmount,
          paymentMethod: selectedPayment,
          note: donationNote.trim() || undefined,
          transactionCode: `TXN-${Date.now().toString().slice(-6)}`,
        });
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDonateModalVisible(false);
    } catch (err: any) {
      setDonationError(err?.message || 'Failed to submit donation');
    }
  };

  const handleTransferTicketConfirm = async () => {
    const parsedAmount = Number(transferAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setTransferError('Please enter a valid transfer amount');
      return;
    }
    if (!transferReason.trim()) {
      setTransferError('Transfer reason is required');
      return;
    }
    setTransferError('');

    try {
      await createTransferTicketMutation.mutateAsync({
        amount: parsedAmount,
        reason: transferReason.trim(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTransferModalVisible(false);
      Alert.alert('Ticket submitted', 'Admins can now review this money transfer ticket.');
    } catch (err: any) {
      setTransferError(err?.message || 'Failed to create transfer ticket');
    }
  };

  const handleExpenseConfirm = async () => {
    const parsedAmount = Number(expenseAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setExpenseError('Please enter a valid expense amount');
      return;
    }
    if (!expenseDescription.trim()) {
      setExpenseError('Expense description is required');
      return;
    }
    setExpenseError('');

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await createExpenseMutation.mutateAsync({
        fundId,
        amount: parsedAmount,
        description: expenseDescription.trim(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setExpenseModalVisible(false);
    } catch (err: any) {
      setExpenseError(err?.message || 'Failed to record expense');
    }
  };

  const handleAddMember = async () => {
    if (!selectedFundUser?.id) {
      Alert.alert('Notice', 'Search and select a user first.');
      return;
    }
    Alert.alert(
      'Add fund member?',
      `${selectedFundUser.name}\n${selectedFundUser.email || 'No email'}\nRole: ${memberRole}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async () => {
            try {
              await addMemberMutation.mutateAsync({ userId: selectedFundUser.id, role: memberRole });
              setMemberSearchQuery('');
              setSelectedFundUser(null);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to add member.');
            }
          },
        },
      ],
    );
  };

  const handleToggleMemberRole = async (userId: string, currentRole: CommunityFundMemberRole, userName?: string) => {
    const nextRole: CommunityFundMemberRole = currentRole === 'MANAGER' ? 'MEMBER' : 'MANAGER';
    if (currentRole === 'MANAGER' && managerCount <= 1 && user?.role !== 'ADMIN') {
      Alert.alert('Cannot change role', 'This fund needs at least one manager.');
      return;
    }
    Alert.alert('Change member role?', `${userName || 'This member'} will become ${nextRole}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Change',
        onPress: async () => {
          try {
            await updateMemberRoleMutation.mutateAsync({ userId, role: nextRole });
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to update member role.');
          }
        },
      },
    ]);
  };

  const handleRemoveMember = (userId: string, userName: string, role: CommunityFundMemberRole) => {
    if (userId === user?.id) {
      Alert.alert('Action blocked', 'You cannot remove yourself from this fund. Ask another manager or admin to change fund membership.');
      return;
    }
    if (role === 'MANAGER' && managerCount <= 1 && user?.role !== 'ADMIN') {
      Alert.alert('Cannot remove manager', 'This fund needs at least one manager.');
      return;
    }
    Alert.alert('Remove fund member?', `Remove ${userName || 'this member'} from this fund?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeMemberMutation.mutateAsync(userId);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to remove member.');
          }
        },
      },
    ]);
  };

  if (isFundLoading) {
    return (
      <View style={[stylesGlobal.container, { backgroundColor: theme.appBG, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isFundError || !fund) {
    return (
      <View style={[stylesGlobal.container, { backgroundColor: theme.appBG, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text, fontSize: 16 }}>Failed to load community fund details</Text>
      </View>
    );
  }

  const isStaff = canManageFund;

  const options = [
    {
      key: 'share',
      label: 'Share Community Fund',
      icon: 'share' as any,
      onPress: () => {
        setIsOptionsVisible(false);
        requestAnimationFrame(() => {
          setIsShareSheetVisible(true);
        });
      },
    },
  ];

  return (
    <View
      style={[
        stylesGlobal.container,
        {
          backgroundColor: theme.appBG,
          height: (Platform.OS === 'web' ? '100vh' : '100%') as any,
          maxHeight: (Platform.OS === 'web' ? '100vh' : undefined) as any,
        },
      ]}
    >
      {/* Header back button + title + kebab menu */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 8,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.appBG,
        }}
      >
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            { padding: 8, borderRadius: 8 },
            pressed && { backgroundColor: theme.highlightBG },
          ]}
        >
          <MaterialIcons name="chevron-left" size={28} color={theme.text} />
        </Pressable>
        <Text
          numberOfLines={1}
          style={{
            color: theme.text,
            fontSize: 17,
            fontWeight: '600',
            flex: 1,
            textAlign: 'center',
            marginHorizontal: 8,
          }}
        >
          Fund Overview
        </Text>
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsOptionsVisible(true);
          }}
          style={({ pressed }) => [
            { padding: 8, borderRadius: 8 },
            pressed && { backgroundColor: theme.highlightBG },
          ]}
        >
          <MaterialIcons name="more-vert" size={24} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HSL Premium Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: theme.primary }]}>
          <Text style={[styles.balanceLabel, { color: theme.textLight }]}>Live Balance</Text>
          <Text style={[styles.balanceAmount, { color: theme.textLight }]}>
            ₫ {fund.totalBalance.toLocaleString()}
          </Text>
          <Text style={[styles.managerText, { color: theme.textLight }]}>
            Managed by {fund.createdByName || 'Community Fund Manager'}
          </Text>
        </View>

        {/* Fund Info details */}
        <View style={[styles.infoCard, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
          <Text style={[styles.fundTitle, { color: theme.text }]}>{fund.name}</Text>
          <Text style={[styles.fundDescription, { color: theme.textSupporting }]}>
            {fund.description || 'No description available for this community fund.'}
          </Text>
        </View>

        {/* Action triggers */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={handleOpenDonate}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.primary },
              pressed && { opacity: 0.9 },
            ]}
          >
            <Ionicons name="gift-outline" size={20} color={theme.textLight} />
            <Text style={[styles.actionButtonText, { color: theme.textLight }]}>Contribute</Text>
          </Pressable>

          {isStaff && (
            <Pressable
              onPress={handleOpenExpense}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: theme.highlightBG, borderWidth: 1.5, borderColor: theme.border },
                pressed && { backgroundColor: theme.border },
              ]}
            >
              <Ionicons name="receipt-outline" size={20} color={theme.text} />
              <Text style={[styles.actionButtonText, { color: theme.text }]}>Record Expense</Text>
            </Pressable>
          )}
        </View>

        {isStaff && (
          <Pressable
            onPress={handleOpenTransferTicket}
            style={({ pressed }) => [
              styles.secondaryFullButton,
              { backgroundColor: theme.highlightBG, borderColor: theme.border },
              pressed && { backgroundColor: theme.border },
            ]}
          >
            <Ionicons name="cash-outline" size={19} color={theme.text} />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>Request Transfer</Text>
          </Pressable>
        )}

        {isStaff && (
          <View style={[styles.infoCard, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 0 }]}>Fund Members</Text>
            <View style={{ gap: 10 }}>
              <TextInput
                label="Search by name, email, or user ID"
                value={memberSearchQuery}
                onChangeText={(text) => {
                  setMemberSearchQuery(text);
                  setSelectedFundUser(null);
                }}
              />
              {!!memberSearchQuery.trim() && !selectedFundUser && (
                <View style={[styles.memberSearchBox, { borderColor: theme.border }]}>
                  {memberSearchResults.length === 0 ? (
                    <Text style={{ color: theme.textSupporting, padding: 10 }}>No matching users found.</Text>
                  ) : (
                    memberSearchResults.map((candidate: any) => (
                      <Pressable
                        key={candidate.id}
                        onPress={() => {
                          setSelectedFundUser(candidate);
                          if (candidate.role === 'ADMIN') {
                            setMemberRole('MANAGER');
                          }
                          setMemberSearchQuery(`${candidate.name} (${candidate.email || candidate.id})`);
                        }}
                        style={({ pressed }) => [
                          styles.memberSearchRow,
                          {
                            borderBottomColor: theme.border,
                            backgroundColor: pressed ? theme.highlightBG : 'transparent',
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: theme.text, fontWeight: '700' }}>{candidate.name}</Text>
                          <Text style={{ color: theme.textSupporting, fontSize: 12 }}>{candidate.email || candidate.id}</Text>
                        </View>
                        <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>{candidate.role}</Text>
                      </Pressable>
                    ))
                  )}
                </View>
              )}
              {selectedFundUser && (
                <View style={[styles.selectedMemberBox, { borderColor: theme.primary, backgroundColor: theme.highlightBG }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: '800' }}>{selectedFundUser.name}</Text>
                    <Text style={{ color: theme.textSupporting, fontSize: 12 }}>{selectedFundUser.email || selectedFundUser.id}</Text>
                    <Text style={{ color: theme.textSupporting, fontSize: 12 }}>Current role: {selectedFundUser.role}</Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setSelectedFundUser(null);
                      setMemberSearchQuery('');
                    }}
                  >
                    <MaterialIcons name="close" size={20} color={theme.icon} />
                  </Pressable>
                </View>
              )}
              <View style={styles.memberRoleRow}>
                {(['MEMBER', 'MANAGER'] as CommunityFundMemberRole[]).map((role) => (
                  <Pressable
                    key={role}
                    onPress={() => setMemberRole(role)}
                    style={[
                      styles.rolePill,
                      {
                        borderColor: memberRole === role ? theme.primary : theme.border,
                        backgroundColor: memberRole === role ? theme.highlightBG : 'transparent',
                      },
                    ]}
                  >
                    <Text style={{ color: memberRole === role ? theme.primary : theme.text, fontWeight: '700' }}>
                      {role}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Button
                text={addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
                onPress={handleAddMember}
                primary
                isDisabled={addMemberMutation.isPending || !selectedFundUser}
              />
            </View>

            <View style={{ marginTop: 12, gap: 8 }}>
              {isMembersLoading ? (
                <ActivityIndicator color={theme.primary} />
              ) : members.length === 0 ? (
                <Text style={{ color: theme.textSupporting }}>No fund members yet.</Text>
              ) : (
                members.map((member) => (
                  <View key={member.userId} style={[styles.memberRow, { borderColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: '700' }}>{member.userName}</Text>
                      <Text style={{ color: theme.textSupporting, fontSize: 12 }}>{member.userEmail}</Text>
                    </View>
                    <Pressable
                      onPress={() => handleToggleMemberRole(member.userId, member.role, member.userName)}
                      style={[styles.smallAction, { borderColor: theme.border }]}
                    >
                      <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 12 }}>{member.role}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleRemoveMember(member.userId, member.userName, member.role)}
                      style={[styles.smallAction, { borderColor: theme.danger }]}
                    >
                      <MaterialIcons name="person-remove" size={16} color={theme.danger} />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* Transactions list */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Fund Ledger</Text>
        <View style={styles.ledgerContainer}>
          {isExpensesLoading || isDonationsLoading ? (
            <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
          ) : combinedTransactions.length === 0 ? (
            <Text style={{ color: theme.textSupporting, fontStyle: 'italic', textAlign: 'center', marginVertical: 20 }}>
              No transactions recorded in the ledger yet.
            </Text>
          ) : (
            combinedTransactions.map((tx) => {
              const isIncome = tx.type === 'INCOME';
              const amtColor = isIncome ? theme.success : theme.danger;
              const sign = isIncome ? '+' : '-';
              const formattedAmt = `${sign}₫${Math.abs(tx.amount).toLocaleString()}`;

              return (
                <View
                  key={tx.id}
                  style={[
                    styles.txRow,
                    { backgroundColor: theme.componentBG, borderColor: theme.border },
                  ]}
                >
                  <View style={[styles.txIconContainer, { backgroundColor: isIncome ? theme.success + '15' : theme.danger + '15' }]}>
                    <Ionicons
                      name={isIncome ? 'arrow-down-circle' : 'arrow-up-circle'}
                      size={24}
                      color={amtColor}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.txTitle, { color: theme.text }]} numberOfLines={1}>
                      {tx.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textSupporting }}>
                      {tx.date} • {tx.method === 'PAYOS' && tx.status ? `${tx.status} • ` : ''}by {tx.createdByName}
                    </Text>
                  </View>
                  <Text style={[styles.txAmount, { color: amtColor }]}>{formattedAmt}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* 1. Donation Contribution Modal */}
      <Modal
        visible={donateModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setDonateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Contribute to Fund</Text>
              <Pressable onPress={() => setDonateModalVisible(false)} style={styles.modalCloseButton}>
                <MaterialIcons name="close" size={24} color={theme.textSupporting} />
              </Pressable>
            </View>

            {donationError ? (
              <View style={[styles.errorContainer, { backgroundColor: theme.danger + '15', borderColor: theme.danger }]}>
                <Text style={{ color: theme.danger, fontSize: 13 }}>{donationError}</Text>
              </View>
            ) : null}

            <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              {/* Quick Grid Selection */}
              <View style={styles.formSection}>
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>Donation Amount</Text>
                <View style={styles.quickGrid}>
                  {QUICK_AMOUNTS.map((amt) => (
                    <Pressable
                      key={amt.value}
                      style={[
                        styles.quickPill,
                        {
                          backgroundColor: theme.highlightBG,
                          borderColor: selectedAmount === amt.value && !isCustomAmount ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={async () => {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedAmount(amt.value);
                        setIsCustomAmount(false);
                        setCustomAmount('');
                      }}
                    >
                      <Text
                        style={{
                          color: selectedAmount === amt.value && !isCustomAmount ? theme.primary : theme.text,
                          fontWeight: '600',
                          fontSize: 13,
                        }}
                      >
                        {amt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Custom Input */}
                <TextInput
                  label="Custom Amount (VND)"
                  value={customAmount}
                  onChangeText={(txt) => {
                    setCustomAmount(txt.replace(/[^0-9]/g, ''));
                    setIsCustomAmount(true);
                    setSelectedAmount(null);
                  }}
                  keyboardType="numeric"
                />
              </View>

              {/* Payment Methods */}
              <View style={styles.formSection}>
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>Payment Method</Text>
                <View style={{ gap: 8 }}>
                  {PAYMENT_METHODS.map((method) => (
                    <Pressable
                      key={method.id}
                      style={[
                        styles.paymentCard,
                        {
                          backgroundColor: theme.highlightBG,
                          borderColor: selectedPayment === method.id ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={async () => {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedPayment(method.id);
                      }}
                    >
                      <View style={[styles.radioButton, { borderColor: selectedPayment === method.id ? theme.primary : theme.border }]}>
                        {selectedPayment === method.id && (
                          <View style={[styles.radioButtonSelected, { backgroundColor: theme.primary }]} />
                        )}
                      </View>
                      <Text style={{ color: theme.text, fontWeight: '500', fontSize: 15 }}>{method.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Note */}
              <TextInput
                label="Message / Note"
                value={donationNote}
                onChangeText={setDonationNote}
                multiline
                height={80}
              />
            </ScrollView>

            <View style={{ marginTop: 8 }}>
              <Button
                text={(createDonationMutation.isPending || createPayOsDonationMutation.isPending) ? 'Processing...' : 'Confirm Contribution'}
                onPress={handleDonateConfirm}
                primary
                isDisabled={createDonationMutation.isPending || createPayOsDonationMutation.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. External Transfer Ticket Modal */}
      <Modal
        visible={transferModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setTransferModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Request Money Transfer</Text>
              <Pressable onPress={() => setTransferModalVisible(false)} style={styles.modalCloseButton}>
                <MaterialIcons name="close" size={24} color={theme.textSupporting} />
              </Pressable>
            </View>

            {transferError ? (
              <View style={[styles.errorContainer, { backgroundColor: theme.danger + '15', borderColor: theme.danger }]}>
                <Text style={{ color: theme.danger, fontSize: 13 }}>{transferError}</Text>
              </View>
            ) : null}

            <View style={{ gap: 16, marginBottom: 20 }}>
              <TextInput
                label="Amount (VND)"
                value={transferAmount}
                onChangeText={(txt) => setTransferAmount(txt.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />

              <TextInput
                label="Reason"
                value={transferReason}
                onChangeText={setTransferReason}
                multiline
                height={100}
              />
            </View>

            <Button
              text={createTransferTicketMutation.isPending ? 'Submitting...' : 'Submit Ticket'}
              onPress={handleTransferTicketConfirm}
              primary
              isDisabled={createTransferTicketMutation.isPending}
            />
          </View>
        </View>
      </Modal>

      {/* 2. Expense Recording Modal */}
      <Modal
        visible={expenseModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setExpenseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={2}>
                Record Outlay Expense
              </Text>
              <Pressable onPress={() => setExpenseModalVisible(false)} style={styles.modalCloseButton}>
                <MaterialIcons name="close" size={24} color={theme.textSupporting} />
              </Pressable>
            </View>

            {expenseError ? (
              <View style={[styles.errorContainer, { backgroundColor: theme.danger + '15', borderColor: theme.danger }]}>
                <Text style={{ color: theme.danger, fontSize: 13 }}>{expenseError}</Text>
              </View>
            ) : null}

            <View style={{ gap: 16, marginBottom: 20 }}>
              <TextInput
                label="Amount (VND)"
                value={expenseAmount}
                onChangeText={(txt) => setExpenseAmount(txt.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />

              <TextInput
                label="Expense Description / Receipt note"
                value={expenseDescription}
                onChangeText={setExpenseDescription}
                multiline
                height={100}
              />
            </View>

            <View>
              <Button
                text={createExpenseMutation.isPending ? 'Recording...' : 'Record Expense'}
                onPress={handleExpenseConfirm}
                primary
                isDisabled={createExpenseMutation.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Options BottomSheet */}
      <BottomSheet
        isVisible={isOptionsVisible}
        onClose={() => setIsOptionsVisible(false)}
        title="Fund Options"
        options={options}
      />

      {/* Share Target BottomSheet */}
      <BottomSheet
        isVisible={isShareSheetVisible}
        onClose={() => setIsShareSheetVisible(false)}
        title="Share Community Fund"
      >
        <View style={{ paddingBottom: 24, maxHeight: 400, width: '100%' }}>
          {isConversationsLoading ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 20 }} />
          ) : conversations.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: theme.textSupporting, textAlign: 'center' }}>No active chats found</Text>
            </View>
          ) : (
            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
              {conversations.map((c: any) => {
                const otherMember = c.members?.find((m: any) => m.userId !== user?.id);
                const chatName = otherMember?.fullName || 'User';
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => handleShareFund(c.id)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 14,
                      paddingHorizontal: 20,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.border,
                      backgroundColor: pressed ? theme.activeComponentBG : 'transparent',
                    })}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: theme.border,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ color: theme.textSupporting, fontSize: 14, fontWeight: '700' }}>
                        {chatName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: '500' }}>
                      {chatName}
                    </Text>
                    <MaterialIcons name="send" size={18} color={theme.primary} />
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
    gap: 16,
  },
  balanceCard: {
    borderRadius: 16,
    padding: 24,
    gap: 8,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.85,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
  },
  managerText: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.8,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  fundTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  fundDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    alignItems: 'stretch',
  },
  actionButton: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 8,
    minHeight: 48,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'center',
  },
  secondaryFullButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  memberRoleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rolePill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  memberSearchBox: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  memberSearchRow: {
    minHeight: 52,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  selectedMemberBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  smallAction: {
    minHeight: 34,
    minWidth: 42,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  ledgerContainer: {
    gap: 10,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  txIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  modalCloseButton: {
    padding: 4,
  },
  errorContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  formSection: {
    gap: 8,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickPill: {
    width: '48%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    gap: 12,
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
