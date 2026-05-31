import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useConversations } from '@/features/communication/hooks/useConversations';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import { getMessages } from '@/features/communication/api/get-messages';

type Conversation = {
  id: string;
  name: string;
  avatarLetter: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
};

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

const CONVERSATIONS: Conversation[] = [];

const ConversationRow = ({
  item,
  onPress,
}: {
  item: Conversation;
  onPress: () => void;
}) => {
  const theme = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isUnread = item.unreadCount > 0;
  const isDark = theme.appBG === '#0F172A';

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: (pressed || isPressed)
            ? theme.activeComponentBG
            : (isHovered ? theme.highlightBG : 'transparent'),
        },
      ]}
    >
      {/* Avatar Container with Online Badge */}
      <View style={{ marginRight: 12, position: 'relative' }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isUnread ? (isDark ? 'rgba(249, 115, 22, 0.15)' : '#FFF4E5') : theme.border,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: isUnread ? theme.primary : theme.textSupporting,
              fontSize: 15,
              fontWeight: '700',
            }}
          >
            {item.avatarLetter}
          </Text>
        </View>
        {/* Active/Online indicator (swapped from green to brand primary orange) */}
        <View
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: theme.primary,
            borderWidth: 2,
            borderColor: isPressed
              ? theme.activeComponentBG
              : (isHovered ? theme.highlightBG : theme.appBG),
          }}
        />
      </View>

      {/* Content */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 }}>
          <Text
            style={{
              color: theme.text,
              fontSize: 15,
              fontWeight: isUnread ? '600' : '400',
              flex: 1,
            }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={{
              color: isUnread ? theme.primary : theme.textSupporting,
              fontSize: 11,
              fontWeight: isUnread ? '600' : '400',
              marginLeft: 8,
            }}
          >
            {item.timestamp}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={{
              color: isUnread ? theme.text : theme.textSupporting,
              fontSize: 13,
              flex: 1,
              fontWeight: isUnread ? '600' : '400',
            }}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>

          {isUnread && (
            <View
              style={{
                backgroundColor: theme.primary,
                borderRadius: 10,
                paddingHorizontal: 6,
                paddingVertical: 2,
                justifyContent: 'center',
                alignItems: 'center',
                marginLeft: 8,
              }}
            >
              <Text
                style={{
                  color: theme.buttonSuccessText,
                  fontSize: 11,
                  fontWeight: '700',
                }}
              >
                {item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

export default function MessagesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { data: conversations, isLoading } = useConversations();

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

        let lastMessage = c.lastMessageContent || 'No messages yet';
        if (c.lastMessageContent) {
          if (c.lastMessageContent.startsWith('[SHARED_ITEM:SUPPORT:')) {
            lastMessage = 'Shared a support request';
          } else if (c.lastMessageContent.startsWith('[SHARED_ITEM:LOCATION:')) {
            lastMessage = 'Shared a location hub';
          } else if (c.lastMessageContent.startsWith('[SHARED_ITEM:FUND:')) {
            lastMessage = 'Shared a community fund';
          } else if (c.lastMessageContent.startsWith('[SYSTEM:')) {
            const systemMatch = c.lastMessageContent.match(/^\[SYSTEM:[^\]]*\]\s*(.*)$/);
            lastMessage = systemMatch ? systemMatch[1] : c.lastMessageContent;
          }
        }

        return {
          id: c.id || String(Math.random()),
          name,
          avatarLetter: name.charAt(0).toUpperCase(),
          lastMessage,
          timestamp: formatRelativeTime(c.lastMessageCreatedAt) || formatRelativeTime(c.createdAt) || 'Just now',
          unreadCount: c.unreadCount || 0,
        };
      })
    : CONVERSATIONS;

  return (
    <View style={{ flex: 1, backgroundColor: theme.appBG }}>
      {/* Sleek Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.border,
          backgroundColor: theme.appBG,
        }}
      >
        <Text style={{ color: theme.text, fontSize: 28, fontWeight: '700' }}>
          Inbox
        </Text>
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/messages/search');
          }}
          style={({ pressed }) => ({
            padding: 8,
            borderRadius: 8,
            backgroundColor: pressed ? theme.highlightBG : 'transparent',
          })}
        >
          <MaterialIcons name="search" size={24} color={theme.text} />
        </Pressable>
      </View>

      {/* Conversation List */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={displayConversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationRow
              item={item}
              onPress={() => handleConversationPress(item.id)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40, paddingHorizontal: 20 }}>
              <Text style={{ color: theme.textSupporting, textAlign: 'center' }}>
                No conversations yet
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
