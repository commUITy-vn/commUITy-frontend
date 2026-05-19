import { useState } from 'react';
import { View, Text, FlatList, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';

type Conversation = {
  id: string;
  name: string;
  avatarLetter: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatarColor: string;
};

const CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    name: 'Nguyen Van A',
    avatarLetter: 'N',
    lastMessage: 'Chào bạn, tôi có thể giúp gì cho bạn?',
    timestamp: '2 phút trước',
    unreadCount: 3,
    avatarColor: '#F97316',
  },
  {
    id: '2',
    name: 'Tran Thi B',
    avatarLetter: 'T',
    lastMessage: 'Cảm ơn bạn đã hỗ trợ, tôi sẽ liên hệ lại sau.',
    timestamp: '1 giờ trước',
    unreadCount: 0,
    avatarColor: '#3B82F6',
  },
  {
    id: '3',
    name: 'Le Van C',
    avatarLetter: 'L',
    lastMessage: 'Đã nhận được hỗ trợ từ bạn, rất cảm ơn!',
    timestamp: 'Hôm qua',
    unreadCount: 1,
    avatarColor: '#10B981',
  },
  {
    id: '4',
    name: 'Pham Thi D',
    avatarLetter: 'P',
    lastMessage: 'Bạn có thể giúp tôi với vấn đề này không?',
    timestamp: 'Hôm qua',
    unreadCount: 0,
    avatarColor: '#8B5CF6',
  },
  {
    id: '5',
    name: 'Hoang Van E',
    avatarLetter: 'H',
    lastMessage: 'Tôi sẽ đến địa điểm vào lúc 3 giờ chiều nay.',
    timestamp: '2 ngày trước',
    unreadCount: 2,
    avatarColor: '#EF4444',
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

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: pressed || isPressed ? theme.highlightBG : theme.appBG,
        },
      ]}
    >
      {/* Avatar */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: item.avatarColor,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>
          {item.avatarLetter}
        </Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text
            style={{
              color: theme.text,
              fontSize: 16,
              fontWeight: item.unreadCount > 0 ? '700' : '500',
              flex: 1,
            }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={{
              color: theme.textSupporting,
              fontSize: 12,
              marginLeft: 8,
            }}
          >
            {item.timestamp}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={{
              color: theme.textSupporting,
              fontSize: 14,
              flex: 1,
              fontWeight: item.unreadCount > 0 ? '500' : '400',
            }}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>

          {item.unreadCount > 0 && (
            <View
              style={{
                backgroundColor: theme.primary,
                borderRadius: 10,
                minWidth: 20,
                height: 20,
                justifyContent: 'center',
                alignItems: 'center',
                marginLeft: 8,
                paddingHorizontal: 6,
              }}
            >
              <Text
                style={{
                  color: theme.textLight,
                  fontSize: 12,
                  fontWeight: 'bold',
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

import { useConversations } from '@/features/communication/hooks/useConversations';
import { ActivityIndicator } from 'react-native';

export default function MessagesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: conversations, isLoading } = useConversations();

  const handleConversationPress = (id: string) => {
    router.push({ pathname: '/messages/[id]', params: { id } } as any);
  };

  const displayConversations = conversations && Array.isArray(conversations) && conversations.length > 0
    ? conversations.map((c: any) => ({
        id: c.id || String(Math.random()),
        name: c.name || 'Unknown',
        avatarLetter: (c.name || 'U').charAt(0).toUpperCase(),
        lastMessage: c.lastMessage?.content || 'No messages yet',
        timestamp: c.lastMessage?.timestamp || c.updatedAt || 'Just now',
        unreadCount: c.unreadCount || 0,
        avatarColor: '#3B82F6', // Could derive from string hash
      }))
    : CONVERSATIONS;

  return (
    <View style={{ flex: 1, backgroundColor: theme.appBG }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <Text style={{ color: theme.text, fontSize: 28, fontWeight: 'bold' }}>
          Inbox
        </Text>
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
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: 1,
              backgroundColor: theme.border,
              marginLeft: 76,
            }}
          />
        )}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      />
      )}
    </View>
  );
}
