import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, TextInput, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useConversations } from '@/features/communication/hooks/useConversations';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMessages } from '@/features/communication/api/get-messages';
import { getUsers } from '@/features/users/api/get-users';
import { createPrivateConversation } from '@/features/communication/api/create-private-conversation';

const formatRelativeTime = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  } catch {
    return '';
  }
};

const getConversationPreview = (conversation: any) => {
  const content = conversation.lastMessageContent;
  if (!content && conversation.lastMessageId) return 'Received an attachment';
  if (!content) return 'No messages yet';
  if (content.startsWith('[SHARED_ITEM:SUPPORT:') || content.startsWith('[SHARED_ITEM:REQUEST:')) {
    return 'Shared a support request';
  }
  if (content.startsWith('[SHARED_ITEM:LOCATION:')) return 'Shared a support location';
  if (content.startsWith('[SHARED_ITEM:FUND:')) return 'Shared a community fund';
  if (content.startsWith('[SYSTEM:')) {
    const systemMatch = content.match(/^\[SYSTEM:[^\]]*\]\s*(.*)$/);
    return systemMatch ? systemMatch[1] : content;
  }
  return content;
};

export default function MessageSearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { data: conversations, isLoading } = useConversations();
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingChatUserId, setCreatingChatUserId] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['users', 'searchable'],
    queryFn: getUsers,
    enabled: searchQuery.trim().length >= 2,
  });

  // Delayed autofocus to prevent transition lag/killing on Web (as mandated in CLAUDE.md)
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleConversationPress = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['messages', id],
      queryFn: () => getMessages(id),
    });
    router.push({ pathname: '/messages/[id]', params: { id } } as any);
  };

  const displayConversations = conversations && Array.isArray(conversations) && conversations.length > 0
    ? conversations.map((c: any) => {
        const otherMember = c.members?.find((m: any) => m.userId !== user?.id);
        const name = otherMember?.fullName || 'User';

        return {
          id: c.id || String(Math.random()),
          name,
          avatarLetter: name.charAt(0).toUpperCase(),
          avatarUrl: otherMember?.avatarUrl,
          lastMessage: getConversationPreview(c),
          timestamp: formatRelativeTime(c.lastMessageCreatedAt) || formatRelativeTime(c.createdAt) || 'Just now',
          unreadCount: c.unreadCount || 0,
        };
      })
    : [];

  const filteredConversations = displayConversations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const conversationUserIds = new Set(
    (conversations && Array.isArray(conversations) ? conversations : [])
      .flatMap((conversation: any) => conversation.members || [])
      .map((member: any) => String(member.userId)),
  );
  const filteredUsers = Array.isArray(users)
    ? users
        .filter((candidate: any) => String(candidate.id) !== String(user?.id))
        .filter((candidate: any) => {
          const q = searchQuery.trim().toLowerCase();
          return (
            candidate.fullName?.toLowerCase().includes(q) ||
            candidate.email?.toLowerCase().includes(q)
          );
        })
        .filter((candidate: any) => !conversationUserIds.has(String(candidate.id)))
        .slice(0, 8)
    : [];
  const results = [
    ...filteredConversations.map((item) => ({ type: 'conversation' as const, item })),
    ...filteredUsers.map((item: any) => ({ type: 'user' as const, item })),
  ];

  const handleStartChat = async (targetUser: any) => {
    if (!targetUser?.id || creatingChatUserId) return;
    if (String(targetUser.id) === String(user?.id)) {
      Alert.alert('Unable to start chat', 'You cannot create a direct message with yourself.');
      return;
    }
    setCreatingChatUserId(targetUser.id);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const conversation: any = await createPrivateConversation({ receiverId: targetUser.id });
      const conversationId = conversation?.id || conversation?.data?.id;
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (conversationId) {
        router.push({ pathname: '/messages/[id]', params: { id: conversationId } } as any);
      }
    } catch (error: any) {
      Alert.alert('Unable to start chat', error?.message || 'Please try again.');
    } finally {
      setCreatingChatUserId(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.appBG }}>
      {/* Sleek Search Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.border,
          backgroundColor: theme.appBG,
          gap: 8,
        }}
      >
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={({ pressed }) => ({
            padding: 8,
            borderRadius: 8,
            backgroundColor: pressed ? theme.highlightBG : 'transparent',
          })}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </Pressable>

        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.highlightBG,
            borderRadius: 8,
            paddingHorizontal: 10,
            height: 40,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <MaterialIcons name="search" size={20} color={theme.textSupporting} style={{ marginRight: 6 }} />
          <TextInput
            ref={inputRef}
            placeholder="Search chats, names, or email..."
            placeholderTextColor={theme.placeholderText || theme.textSupporting}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              color: theme.text,
              fontSize: 15,
              padding: 0,
              ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
            } as any}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={18} color={theme.textSupporting} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Results List */}
      {isLoading || isUsersLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={searchQuery.trim() ? results : []}
          keyExtractor={(row) => `${row.type}-${row.item.id}`}
          renderItem={({ item: row }) => {
            const item = row.item;
            if (row.type === 'user') {
              const name = item.fullName || item.email || 'User';
              const isCreating = creatingChatUserId === item.id;
              return (
                <Pressable
                  onPress={() => handleStartChat(item)}
                  disabled={isCreating}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: pressed ? theme.activeComponentBG : 'transparent',
                  })}
                >
                  <View style={{ marginRight: 12 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: theme.primary + '18',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: theme.primary, fontSize: 15, fontWeight: '700' }}>
                        {name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }} numberOfLines={1}>
                      {name}
                    </Text>
                    <Text style={{ color: theme.textSupporting, fontSize: 13 }} numberOfLines={1}>
                      {item.email || 'Start a new private chat'}
                    </Text>
                  </View>
                  {isCreating ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <MaterialIcons name="chat" size={20} color={theme.primary} />
                  )}
                </Pressable>
              );
            }
            return (
              <Pressable
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleConversationPress(item.id);
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: pressed ? theme.activeComponentBG : 'transparent',
                })}
              >
                {/* Avatar */}
                <View style={{ marginRight: 12 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: theme.border,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    >
                      {item.avatarUrl ? (
                        <Image source={{ uri: item.avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                      ) : (
                        <Text style={{ color: theme.textSupporting, fontSize: 15, fontWeight: '700' }}>
                          {item.avatarLetter}
                        </Text>
                      )}
                    </View>
                </View>

                {/* Content */}
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 }}>
                    <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={{ color: theme.textSupporting, fontSize: 11, marginLeft: 8 }}>
                      {item.timestamp}
                    </Text>
                  </View>
                  <Text style={{ color: theme.textSupporting, fontSize: 13 }} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                </View>
              </Pressable>
            );
          }}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80, paddingHorizontal: 20 }}>
              <Text style={{ color: theme.textSupporting, textAlign: 'center', fontSize: 14 }}>
                {searchQuery.trim() ? "No matching conversations or users found" : "Type above to search chats or start a new one"}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
