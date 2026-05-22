import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, TextInput, Platform, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useConversations } from '@/features/communication/hooks/useConversations';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';

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

    if (diffSecs < 60) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'Hôm qua';
    return `${diffDays} ngày trước`;
  } catch (e) {
    return '';
  }
};

const CONVERSATIONS: Conversation[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Nguyen Van A',
    avatarLetter: 'N',
    lastMessage: 'Chào bạn, tôi có thể giúp gì cho bạn?',
    timestamp: '2 phút trước',
    unreadCount: 3,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Tran Thi B',
    avatarLetter: 'T',
    lastMessage: 'Cảm ơn bạn đã hỗ trợ, tôi sẽ liên hệ lại sau.',
    timestamp: '1 giờ trước',
    unreadCount: 0,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Le Van C',
    avatarLetter: 'L',
    lastMessage: 'Đã nhận được hỗ trợ từ bạn, rất cảm ơn!',
    timestamp: 'Hôm qua',
    unreadCount: 1,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Pham Thi D',
    avatarLetter: 'P',
    lastMessage: 'Bạn có thể giúp tôi với vấn đề này không?',
    timestamp: 'Hôm qua',
    unreadCount: 0,
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Hoang Van E',
    avatarLetter: 'H',
    lastMessage: 'Tôi sẽ đến địa điểm vào lúc 3 giờ chiều nay.',
    timestamp: '2 ngày trước',
    unreadCount: 2,
  },
];

const ConversationRow = ({
  item,
  onPress,
}: {
  item: Conversation;
  onPress: () => void;
}) => {
  const theme = useTheme();
  const [isPressed, setIsPressed] = useState(false);

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
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          height: 64,
          paddingHorizontal: 8,
          marginHorizontal: 12,
          marginVertical: 2,
          borderRadius: 8,
          backgroundColor: pressed || isPressed ? theme.highlightBG : 'transparent',
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
            backgroundColor: isUnread ? (isDark ? 'rgba(3, 212, 124, 0.15)' : '#E5F6EE') : theme.border,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: isUnread ? theme.success : theme.textSupporting,
              fontSize: 15,
              fontWeight: '700',
            }}
          >
            {item.avatarLetter}
          </Text>
        </View>
        {/* Active/Online indicator */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: theme.success,
            borderWidth: 2,
            borderColor: isPressed ? theme.highlightBG : theme.appBG,
          }}
        />
      </View>

      {/* Content */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 2 }}>
          <Text
            style={{
              color: isUnread ? theme.text : theme.textSupporting,
              fontSize: 15,
              fontWeight: isUnread ? '700' : '500',
              flex: 1,
            }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={{
              color: isUnread ? theme.success : theme.textSupporting,
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
                backgroundColor: theme.success,
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
                  fontSize: 10,
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
  const { user } = useAuthStore();
  const { data: conversations, isLoading } = useConversations();
  const [searchQuery, setSearchQuery] = useState('');

  const handleConversationPress = (id: string) => {
    router.push({ pathname: '/messages/[id]', params: { id } } as any);
  };

  const displayConversations = conversations && Array.isArray(conversations) && conversations.length > 0
    ? conversations.map((c: any) => {
        const otherMember = c.members?.find((m: any) => m.userId !== user?.id);
        const name = otherMember?.fullName || 'Người dùng';
        return {
          id: c.id || String(Math.random()),
          name,
          avatarLetter: name.charAt(0).toUpperCase(),
          lastMessage: c.lastMessageContent || 'Chưa có tin nhắn',
          timestamp: formatRelativeTime(c.lastMessageCreatedAt) || formatRelativeTime(c.createdAt) || 'Vừa xong',
          unreadCount: c.unreadCount || 0,
        };
      })
    : CONVERSATIONS;

  const filteredConversations = displayConversations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.appBG }}>
      {/* Section Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 8,
          backgroundColor: theme.appBG,
        }}
      >
        <Text style={{ color: theme.text, fontSize: 22, fontWeight: '700' }}>
          Inbox
        </Text>
      </View>

      {/* Search Bar */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 12,
          paddingTop: 4,
          backgroundColor: theme.appBG,
        }}
      >
        <View
          style={{
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
            placeholder="Search conversations..."
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

      {/* Conversation List */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
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
                {searchQuery ? "Không tìm thấy hội thoại phù hợp" : "Chưa có cuộc hội thoại nào"}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
