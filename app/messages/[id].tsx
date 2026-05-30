import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput as RNTextInput,
  Image,
  Platform,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { useChat } from '@/features/communication/hooks/useChat';
import { useConversations } from '@/features/communication/hooks/useConversations';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import { api } from '@/lib/api-client';
import EmojiPickerPanel from '@/components/ui/EmojiPickerPanel';
import { BottomSheet } from '@/components/ui';

function GroupAvatar({ members, theme }: { members: any[]; theme: any }) {
  const otherMembers = members.filter(m => m.fullName).slice(0, 2);
  if (otherMembers.length < 2) {
    return (
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: theme.highlightBG,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <MaterialIcons name="group" size={28} color={theme.primary} />
      </View>
    );
  }
  
  const char1 = otherMembers[0].fullName.charAt(0).toUpperCase();
  const char2 = otherMembers[1].fullName.charAt(0).toUpperCase();

  return (
    <View style={{ width: 55, height: 55, position: 'relative' }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: theme.border,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          top: 0,
          left: 0,
          borderWidth: 2,
          borderColor: theme.appBG,
          zIndex: 1,
        }}
      >
        <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>{char1}</Text>
      </View>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: theme.primary,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          bottom: 0,
          right: 0,
          borderWidth: 2,
          borderColor: theme.appBG,
          zIndex: 2,
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>{char2}</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared Item Preview Card
// ─────────────────────────────────────────────────────────────
function SharedItemCard({ content, theme }: { content: string; theme: any }) {
  const match = content.match(/^\[SHARED_ITEM:([^:]+):([^:]+):(.*)\]$/);
  if (!match) return null;

  const [_, type, itemId, title] = match;
  const router = useRouter();

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (type === 'SUPPORT') {
      router.push(`/request/${itemId}`);
    } else if (type === 'LOCATION') {
      router.push(`/location/${itemId}`);
    } else if (type === 'FUND') {
      router.push(`/community-funds/${itemId}`);
    }
  };

  let iconName = 'insert-drive-file';
  let displayType = 'Shared Item';

  if (type === 'SUPPORT') {
    iconName = 'help-outline';
    displayType = 'Shared Help Request';
  } else if (type === 'LOCATION') {
    iconName = 'pin-drop';
    displayType = 'Shared Location Hub';
  } else if (type === 'FUND') {
    iconName = 'monetization-on';
    displayType = 'Shared Community Fund';
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        marginTop: 6,
        padding: 12,
        borderRadius: 12,
        backgroundColor: theme.highlightBG,
        borderWidth: 1,
        borderColor: theme.border,
        maxWidth: 320,
        gap: 8,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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
          <MaterialIcons name={iconName as any} size={22} color={theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {displayType}
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginTop: 2 }} numberOfLines={2}>
            {title}
          </Text>
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: theme.border }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, color: theme.textSupporting, fontWeight: '600' }}>
          View Details
        </Text>
        <MaterialIcons name="chevron-right" size={16} color={theme.textSupporting} />
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────
// Message Hover Floating Action Menu
// ─────────────────────────────────────────────────────────────
function MessageHoverMenu({
  theme,
  onReact,
  onAddReaction,
  onHover,
  onLeave,
}: {
  theme: any;
  onReact: (emoji: string) => void;
  onAddReaction: () => void;
  onHover?: () => void;
  onLeave?: () => void;
}) {
  const quickEmojis = ['👍', '❤️', '😂', '🎉'];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.componentBG,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 20,
        paddingHorizontal: 6,
        paddingVertical: 4,
        gap: 2,
        shadowColor: theme.inverse,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 50,
      }}
    >
      {quickEmojis.map((emoji) => (
        <Pressable
          key={emoji}
          onPress={() => onReact(emoji)}
          onHoverIn={onHover}
          onHoverOut={onLeave}
          style={({ pressed, hovered }) => ({
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 6,
            backgroundColor: (pressed || hovered) ? theme.highlightBG : 'transparent',
            cursor: Platform.OS === 'web' ? 'pointer' as any : undefined,
          })}
        >
          <Text style={{ fontSize: 16 }}>{emoji}</Text>
        </Pressable>
      ))}
      <View style={{ width: 1, height: 16, backgroundColor: theme.border, marginHorizontal: 4 }} />
      <Pressable
        onPress={onAddReaction}
        onHoverIn={onHover}
        onHoverOut={onLeave}
        style={({ pressed, hovered }) => ({
          padding: 4,
          borderRadius: 6,
          backgroundColor: (pressed || hovered) ? theme.highlightBG : 'transparent',
          cursor: Platform.OS === 'web' ? 'pointer' as any : undefined,
        })}
      >
        <MaterialIcons name="add-reaction" size={16} color={theme.textSupporting} />
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Reaction Emoji Popup (small quick-react popover on messages)
// ─────────────────────────────────────────────────────────────
function ReactionPopup({
  onSelect,
  theme,
}: {
  onSelect: (emoji: string) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const quickEmojis = ['👍', '❤️', '😂', '🎉', '😮', '😢'];
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 28,
        right: 0,
        backgroundColor: theme.componentBG,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 6,
        flexDirection: 'row',
        gap: 4,
        shadowColor: theme.inverse,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 100,
      }}
    >
      {quickEmojis.map((emoji) => (
        <Pressable
          key={emoji}
          onPress={() => onSelect(emoji)}
          style={({ pressed, hovered }) => ({
            paddingHorizontal: 4,
            paddingVertical: 2,
            borderRadius: 6,
            backgroundColor: (pressed || hovered) ? theme.highlightBG : 'transparent',
            cursor: Platform.OS === 'web' ? 'pointer' as any : undefined,
          })}
        >
          <Text style={{ fontSize: 20 }}>{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Media Attachment Preview
// ─────────────────────────────────────────────────────────────
function MediaAttachmentView({ media, theme }: { media: any; theme: any }) {
  if (media.fileType === 'IMAGE') {
    return (
      <Pressable
        onPress={() => Platform.OS === 'web' && window.open(media.fileUrl, '_blank')}
        style={{ marginTop: 6 }}
      >
        <Image
          source={{ uri: media.fileUrl }}
          style={{ width: 240, height: 160, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}
          resizeMode="cover"
        />
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={() => Platform.OS === 'web' && window.open(media.fileUrl, '_blank')}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.highlightBG,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        padding: 10,
        marginTop: 6,
        maxWidth: 280,
        gap: 10,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <MaterialIcons name="insert-drive-file" size={24} color={theme.primary} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }} numberOfLines={1}>
          {media.fileName}
        </Text>
        <Text style={{ fontSize: 11, color: theme.textSupporting }}>
          {media.fileSize ? `${(media.fileSize / 1024).toFixed(1)} KB` : 'Attachment'}
        </Text>
      </View>
      <MaterialIcons name="file-download" size={18} color={theme.textSupporting} />
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────
// Main ChatRoomScreen
// ─────────────────────────────────────────────────────────────
export default function ChatRoomScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const { data: conversations } = useConversations();
  const [inputText, setInputText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<RNTextInput>(null);

  // Attachment states
  const [selectedMedia, setSelectedMedia] = useState<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    mimeType: string;
    fileSize: number;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Reactions state
  const [reactions, setReactions] = useState<Record<string, Record<string, string[]>>>({});
  const [showReactionPickerId, setShowReactionPickerId] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [emojiPickerTarget, setEmojiPickerTarget] = useState<'composer' | string>('composer');

  const hoverTimeoutRef = useRef<any>(null);

  const handleHoverIn = (messageId: string) => {
    if (Platform.OS !== 'web') return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredMessageId(messageId);
  };

  const handleHoverOut = () => {
    if (Platform.OS !== 'web') return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredMessageId(null);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const { messages, isLoading, sendMessage } = useChat(id as string);

  // Get current conversation details
  const conversation = React.useMemo(() => {
    return (conversations as any)?.find((c: any) => c.id === id);
  }, [conversations, id]);

  const isGroup = React.useMemo(() => {
    return conversation && conversation?.members && conversation?.members?.length > 2;
  }, [conversation]);

  const memberCount = React.useMemo(() => {
    return conversation?.members?.length || 0;
  }, [conversation]);

  const partnerId = React.useMemo(() => {
    if (isGroup) return null;
    const otherMember = conversation?.members?.find((m: any) => m.userId !== user?.id);
    return otherMember?.userId || null;
  }, [conversation, isGroup, user?.id]);

  // Resolve chat partner name + avatar letter
  const { partnerName, avatarLetter } = React.useMemo(() => {
    const otherMember = conversation?.members?.find((m: any) => m.userId !== user?.id);
    const name =
      otherMember?.fullName ||
      (messages && messages.length > 0
        ? messages.find((m: any) => m.senderId !== user?.id)?.senderName || null
        : null) ||
      'Messages';
    return {
      partnerName: name,
      avatarLetter: name.charAt(0).toUpperCase(),
    };
  }, [conversation, user?.id, messages]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleHeaderPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isGroup) {
      router.push({ pathname: '/messages/[id]/details', params: { id } } as any);
    } else if (partnerId) {
      router.push({ pathname: '/profile/[userId]', params: { userId: partnerId } } as any);
    } else {
      router.push('/(app)/profile' as any);
    }
  };

  const handleFileChange = async (e: any) => {
    if (Platform.OS !== 'web') return;
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const localUrl = URL.createObjectURL(file);
      const isImg = file.type.startsWith('image/');
      const fileType = isImg ? 'IMAGE' : 'DOCUMENT';
      const createPayload = {
        fileName: file.name,
        fileUrl: localUrl,
        fileType,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        altText: file.name,
        isPublic: true,
      };
      const mediaRes = await api.post<any>('/api/v1/media', createPayload);
      setSelectedMedia({
        id: mediaRes.id,
        fileName: file.name,
        fileUrl: localUrl,
        fileType,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
      });
    } catch (err) {
      console.error('Failed to upload file:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !selectedMedia) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const textToSend = inputText;
    const mediaIds = selectedMedia ? [selectedMedia.id] : undefined;
    setInputText('');
    setSelectedMedia(null);
    setShowEmojiPicker(false);
    try {
      await sendMessage(textToSend, mediaIds);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userName = user?.fullName || 'User';
    setReactions((prev) => {
      const msgReactions = prev[messageId] || {};
      const usersList = msgReactions[emoji] || [];
      const newUsersList = usersList.includes(userName)
        ? usersList.filter((u) => u !== userName)
        : [...usersList, userName];
      const newMsgReactions = { ...msgReactions };
      if (newUsersList.length === 0) delete newMsgReactions[emoji];
      else newMsgReactions[emoji] = newUsersList;
      return { ...prev, [messageId]: newMsgReactions };
    });
    setShowReactionPickerId(null);
  };

  // Group consecutive messages within 2 minutes
  const groupedMessages = (messages || []).map((message: any, index: number) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const timeDiff = prevMessage
      ? new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()
      : Infinity;
    return {
      ...message,
      isConsecutive:
        !!prevMessage && prevMessage.senderId === message.senderId && timeDiff < 120000,
    };
  });

  const hasContent = !!(inputText.trim() || selectedMedia);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.appBG,
        height: (Platform.OS === 'web' ? '100vh' : '100%') as any,
        maxHeight: (Platform.OS === 'web' ? '100vh' : undefined) as any,
        overflow: 'hidden',
        position: 'relative', // anchor for absolute emoji picker
      }}
    >
      {/* Hidden file input (web only) */}
      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      )}

      {/* ─── Header ─── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.appBG,
          zIndex: 10,
        }}
      >
        {/* Back button */}
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => ({
            padding: 8,
            borderRadius: 8,
            backgroundColor: pressed ? theme.highlightBG : 'transparent',
            marginRight: 4,
          })}
        >
          <MaterialIcons name="arrow-back" size={20} color={theme.text} />
        </Pressable>

        {/* Tappable partner name + avatar */}
        <Pressable
          onPress={handleHeaderPress}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 4,
            paddingHorizontal: 6,
            borderRadius: 8,
            backgroundColor: pressed ? theme.highlightBG : 'transparent',
            gap: 12,
          })}
        >
          {/* Small avatar */}
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: theme.highlightBG,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: theme.primary,
            }}
          >
            <Text style={{ color: theme.primary, fontSize: 15, fontWeight: '700' }}>
              {avatarLetter}
            </Text>
          </View>
          
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 16,
                  fontWeight: '700',
                }}
                numberOfLines={1}
              >
                {partnerName}
              </Text>
              <MaterialIcons name="chevron-right" size={16} color={theme.textSupporting} />
            </View>
            <Text
              style={{
                color: theme.textSupporting,
                fontSize: 12,
                marginTop: 1,
              }}
              numberOfLines={1}
            >
              {isGroup ? `${memberCount} members` : 'Active now'}
            </Text>
          </View>
        </Pressable>

        {/* Right options button */}
        <Pressable
          onPress={handleHeaderPress}
          style={({ pressed }) => ({
            padding: 8,
            borderRadius: 8,
            backgroundColor: pressed ? theme.highlightBG : 'transparent',
          })}
        >
          <MaterialIcons name="more-vert" size={20} color={theme.textSupporting} />
        </Pressable>
      </View>

      {/* ─── Messages Thread ─── */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 20, gap: 4 }}
          showsVerticalScrollIndicator={false}
          onTouchStart={() => {
            if (showEmojiPicker) setShowEmojiPicker(false);
            if (showReactionPickerId) setShowReactionPickerId(null);
          }}
        >
          {/* Start of Conversation Onboarding Banner */}
          <View
            style={{
              alignItems: 'center',
              paddingVertical: 28,
              paddingHorizontal: 16,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: theme.border,
              backgroundColor: theme.appBG,
              marginBottom: 16,
            }}
          >
            {isGroup ? (
              <GroupAvatar members={conversation?.members || []} theme={theme} />
            ) : (
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: theme.border,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: theme.primary,
                }}
              >
                <Text style={{ color: theme.primary, fontSize: 24, fontWeight: '700' }}>
                  {avatarLetter}
                </Text>
              </View>
            )}

            <Text
              style={{
                color: theme.text,
                fontSize: 20,
                fontWeight: '700',
                marginTop: 12,
                textAlign: 'center',
              }}
            >
              {isGroup
                ? (conversation?.name || 'Group Chat')
                : (partnerId === user?.id || !partnerId ? 'Your Space' : partnerName)}
            </Text>

            <Text
              style={{
                color: theme.textSupporting,
                fontSize: 13,
                textAlign: 'center',
                lineHeight: 18,
                marginTop: 6,
                maxWidth: 300,
              }}
            >
              {isGroup
                ? (conversation?.description || 'This is the beginning of your group chat. Collaborate with your group members here!')
                : (partnerId === user?.id || !partnerId
                  ? 'This is your personal space. You sit for notes, tasks, drafts and reminders.'
                  : `This is the very beginning of your direct message history with ${partnerName}. Use this space to collaborate on tasks, share updates, or just say hello!`)}
            </Text>
          </View>

          {groupedMessages.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 30 }}>
              <Text style={{ color: theme.textSupporting, textAlign: 'center', fontSize: 14 }}>
                No messages yet. Send a message to start the conversation!
              </Text>
            </View>
          ) : (
            groupedMessages.map((message: any) => {
              const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              const msgReactions = reactions[message.id] || {};
              const showPicker = showReactionPickerId === message.id;
              const isHovered = hoveredMessageId === message.id;

              const isSystemMessage = message.content && message.content.startsWith('[SYSTEM:');
              if (isSystemMessage) {
                const systemMatch = message.content.match(/^\[SYSTEM:[^\]]*\]\s*(.*)$/);
                const systemText = systemMatch ? systemMatch[1] : message.content;
                return (
                  <View
                    key={message.id}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      marginVertical: 4,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: theme.highlightBG,
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 16,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        maxWidth: '85%',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          color: theme.textSupporting,
                          fontSize: 12,
                          fontWeight: '600',
                          textAlign: 'center',
                          lineHeight: 16,
                        }}
                      >
                        {systemText}
                      </Text>
                    </View>
                  </View>
                );
              }

              if (message.isConsecutive) {
                return (
                  <Pressable
                    key={message.id}
                    onHoverIn={() => handleHoverIn(message.id)}
                    onHoverOut={handleHoverOut}
                    style={{
                      flexDirection: 'row',
                      paddingLeft: 64,
                      paddingVertical: 4,
                      paddingRight: 16,
                      position: 'relative',
                      backgroundColor: isHovered ? theme.highlightBG : 'transparent',
                      cursor: Platform.OS === 'web' ? 'default' as any : undefined,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      {message.content ? (
                        message.content.startsWith('[SHARED_ITEM:') ? (
                          <SharedItemCard content={message.content} theme={theme} />
                        ) : (
                          <Text style={{ color: theme.text, fontSize: 15, lineHeight: 22 }}>
                            {message.content}
                          </Text>
                        )
                      ) : null}
                      {message.media && message.media.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                          {message.media.map((med: any) => (
                            <MediaAttachmentView key={med.id} media={med} theme={theme} />
                          ))}
                        </View>
                      )}
                      {Object.keys(msgReactions).length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4, alignItems: 'center' }}>
                          {Object.entries(msgReactions).map(([emoji, users]) => (
                            <Pressable
                              key={emoji}
                              onPress={() => toggleReaction(message.id, emoji)}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: (users as string[]).includes(user?.fullName || '')
                                  ? theme.activeComponentBG
                                  : theme.highlightBG,
                                borderWidth: 1,
                                borderColor: (users as string[]).includes(user?.fullName || '')
                                  ? theme.primary
                                  : theme.border,
                                borderRadius: 10,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                gap: 4,
                              }}
                            >
                              <Text style={{ fontSize: 12 }}>{emoji}</Text>
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontWeight: '600',
                                  color: (users as string[]).includes(user?.fullName || '')
                                    ? theme.primary
                                    : theme.textSupporting,
                                }}
                              >
                                {(users as string[]).length}
                              </Text>
                            </Pressable>
                          ))}
                          <Pressable
                            onPress={() => {
                              setEmojiPickerTarget(message.id);
                              setShowEmojiPicker(true);
                            }}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: theme.highlightBG,
                              borderWidth: 1,
                              borderColor: theme.border,
                              borderRadius: 10,
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                            }}
                          >
                            <MaterialIcons name="add-reaction" size={14} color={theme.textSupporting} />
                          </Pressable>
                        </View>
                      )}
                    </View>

                    {/* Hover menu on Web */}
                    {isHovered && Platform.OS === 'web' && (
                      <Pressable
                        onHoverIn={() => handleHoverIn(message.id)}
                        onHoverOut={handleHoverOut}
                        style={{ position: 'absolute', right: 16, top: -24, zIndex: 100, cursor: 'default' as any }}
                      >
                        <MessageHoverMenu
                          theme={theme}
                          onReact={(emoji) => toggleReaction(message.id, emoji)}
                          onAddReaction={() => {
                            setEmojiPickerTarget(message.id);
                            setShowEmojiPicker(true);
                          }}
                          onHover={() => handleHoverIn(message.id)}
                          onLeave={handleHoverOut}
                        />
                      </Pressable>
                    )}
                  </Pressable>
                );
              }

              // Non-consecutive: full row with avatar
              return (
                <Pressable
                  key={message.id}
                  onHoverIn={() => handleHoverIn(message.id)}
                  onHoverOut={handleHoverOut}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    paddingVertical: 6,
                    paddingHorizontal: 16,
                    position: 'relative',
                    backgroundColor: isHovered ? theme.highlightBG : 'transparent',
                    cursor: Platform.OS === 'web' ? 'default' as any : undefined,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: theme.highlightBG,
                      borderWidth: 1,
                      borderColor: theme.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                      marginTop: 2,
                    }}
                  >
                    <Text style={{ color: theme.textSupporting, fontSize: 13, fontWeight: '700' }}>
                      {message.senderName?.[0]?.toUpperCase() ?? 'U'}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 2 }}>
                      <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700', marginRight: 8 }}>
                        {message.senderName ?? 'User'}
                      </Text>
                      <Text style={{ color: theme.textSupporting, fontSize: 11 }}>{formattedTime}</Text>
                    </View>
                    {message.content ? (
                      message.content.startsWith('[SHARED_ITEM:') ? (
                        <SharedItemCard content={message.content} theme={theme} />
                      ) : (
                        <Text style={{ color: theme.text, fontSize: 15, lineHeight: 22 }}>
                          {message.content}
                        </Text>
                      )
                    ) : null}
                    {message.media && message.media.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                        {message.media.map((med: any) => (
                          <MediaAttachmentView key={med.id} media={med} theme={theme} />
                        ))}
                      </View>
                    )}
                    {Object.keys(msgReactions).length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4, alignItems: 'center' }}>
                        {Object.entries(msgReactions).map(([emoji, users]) => (
                          <Pressable
                            key={emoji}
                            onPress={() => toggleReaction(message.id, emoji)}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: (users as string[]).includes(user?.fullName || '')
                                ? theme.activeComponentBG
                                : theme.highlightBG,
                              borderWidth: 1,
                              borderColor: (users as string[]).includes(user?.fullName || '')
                                ? theme.primary
                                : theme.border,
                              borderRadius: 10,
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              gap: 4,
                            }}
                          >
                            <Text style={{ fontSize: 12 }}>{emoji}</Text>
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: '600',
                                color: (users as string[]).includes(user?.fullName || '')
                                  ? theme.primary
                                  : theme.textSupporting,
                              }}
                            >
                              {(users as string[]).length}
                            </Text>
                          </Pressable>
                        ))}
                        <Pressable
                          onPress={() => {
                            setEmojiPickerTarget(message.id);
                            setShowEmojiPicker(true);
                          }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: theme.highlightBG,
                            borderWidth: 1,
                            borderColor: theme.border,
                            borderRadius: 10,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                          }}
                        >
                          <MaterialIcons name="add-reaction" size={14} color={theme.textSupporting} />
                        </Pressable>
                      </View>
                    )}
                  </View>

                  {/* Hover menu on Web */}
                  {isHovered && Platform.OS === 'web' && (
                    <Pressable
                      onHoverIn={() => handleHoverIn(message.id)}
                      onHoverOut={handleHoverOut}
                      style={{ position: 'absolute', right: 16, top: -24, zIndex: 100, cursor: 'default' as any }}
                    >
                      <MessageHoverMenu
                        theme={theme}
                        onReact={(emoji) => toggleReaction(message.id, emoji)}
                        onAddReaction={() => {
                          setEmojiPickerTarget(message.id);
                          setShowEmojiPicker(true);
                        }}
                        onHover={() => handleHoverIn(message.id)}
                        onLeave={handleHoverOut}
                      />
                    </Pressable>
                  )}

                  {/* Fallback Reaction trigger for Mobile (no hover loop risk on Web) */}
                  {Platform.OS !== 'web' && (
                    <View style={{ position: 'absolute', right: 16, top: 6 }}>
                      <Pressable
                        onPress={() => setShowReactionPickerId(showPicker ? null : message.id)}
                        style={({ pressed }) => ({
                          padding: 4,
                          borderRadius: 6,
                          backgroundColor: pressed || showPicker ? theme.highlightBG : 'transparent',
                        })}
                      >
                        <MaterialIcons name="add-reaction" size={16} color={theme.textSupporting} />
                      </Pressable>
                      {showPicker && (
                        <ReactionPopup
                          onSelect={(emoji) => toggleReaction(message.id, emoji)}
                          theme={theme}
                        />
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ─── Attachment Preview Strip ─── */}
      {selectedMedia && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: theme.highlightBG,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {selectedMedia.fileType === 'IMAGE' ? (
              <Image
                source={{ uri: selectedMedia.fileUrl }}
                style={{ width: 44, height: 44, borderRadius: 6 }}
              />
            ) : (
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 6,
                  backgroundColor: theme.appBG,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <MaterialIcons name="insert-drive-file" size={24} color={theme.textSupporting} />
              </View>
            )}
            <View>
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                {selectedMedia.fileName}
              </Text>
              <Text style={{ color: theme.textSupporting, fontSize: 11 }}>
                {(selectedMedia.fileSize / 1024).toFixed(1)} KB
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => setSelectedMedia(null)}
            style={{ padding: 6, borderRadius: 20, backgroundColor: theme.border }}
          >
            <MaterialIcons name="close" size={16} color={theme.text} />
          </Pressable>
        </View>
      )}

      {/* ─── Composer Pill (Expensify-exact layout) ─── */}
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: theme.appBG,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            borderWidth: 1.5,
            borderColor: isFocused ? theme.borderFocus : theme.border,
            borderRadius: 24,
            backgroundColor: theme.componentBG,
            paddingLeft: 0,    // flush left for the half-circle + button
            paddingRight: 8,
            paddingVertical: 0, // 0 padding vertical to allow items to cover the whole height
            minHeight: 40,
          }}
        >
          {/* Left: + Attachment Button (covers full pill height) */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (Platform.OS === 'web') fileInputRef.current?.click();
            }}
            disabled={isUploading}
            style={({ pressed }) => ({
              width: 44,
              borderTopLeftRadius: 22,
              borderBottomLeftRadius: 22,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: pressed ? theme.highlightBG : 'transparent',
              alignSelf: 'stretch', // fill the entire pill height
            })}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={theme.icon} />
            ) : (
              <MaterialIcons name="add" size={24} color={theme.textSupporting} />
            )}
          </Pressable>

          {/* Thin vertical separator (covers full pill height) */}
          <View
            style={{
              width: 1,
              backgroundColor: theme.border,
              alignSelf: 'stretch', // fill the entire pill height
            }}
          />

          {/* Center: Text Input (starts at exactly 1-line height) */}
          <RNTextInput
            ref={inputRef}
            placeholder="Write something..."
            placeholderTextColor={theme.placeholderText}
            value={inputText}
            onChangeText={setInputText}
            multiline
            numberOfLines={1} // sets rows=1 on Web to fix 2-line height bug
            onFocus={() => {
              setIsFocused(true);
              if (showEmojiPicker) setShowEmojiPicker(false);
            }}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={handleSend}
            style={[
              {
                flex: 1,
                fontSize: 15,
                color: theme.text,
                paddingVertical: 10,  // perfect padding for 1-line composer
                paddingHorizontal: 8,
                maxHeight: 120,
                lineHeight: 20,
                height: 'auto',
              },
              Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {},
            ]}
          />

          {/* Right: Emoji Button + Send Button */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-end',
              marginBottom: 4,
              gap: 2,
            }}
          >
            {/* Emoji smiley icon */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEmojiPickerTarget('composer');
                setShowEmojiPicker((v) => !v);
                if (isFocused) inputRef.current?.blur();
              }}
              style={({ pressed }) => ({
                width: 32,
                height: 32,
                borderRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor:
                  pressed || showEmojiPicker ? theme.highlightBG : 'transparent',
              })}
            >
              <MaterialIcons
                name="sentiment-satisfied-alt"
                size={22}
                color={showEmojiPicker ? theme.primary : theme.textSupporting}
              />
            </Pressable>

            {/* Send button (always visible) */}
            <Pressable
              onPress={handleSend}
              disabled={!hasContent}
              style={({ pressed }) => ({
                width: 32,
                height: 32,
                borderRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: hasContent
                  ? pressed
                    ? theme.primaryPressed
                    : theme.primary
                  : 'transparent',
              })}
            >
              <MaterialIcons
                name="send"
                size={16}
                color={hasContent ? '#FFFFFF' : theme.textSupporting}
              />
            </Pressable>
          </View>
        </View>
      </View>

      {showEmojiPicker && (
        <View
          style={{
            position: 'absolute',
            bottom: 68, // clean placement above the composer pill
            right: 16,
            zIndex: 200,
          }}
        >
          <EmojiPickerPanel
            onEmojiSelected={(emoji) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (emojiPickerTarget === 'composer') {
                setInputText((prev) => prev + emoji);
              } else {
                toggleReaction(emojiPickerTarget, emoji);
              }
              setShowEmojiPicker(false);
            }}
            onClose={() => setShowEmojiPicker(false)}
          />
        </View>
      )}
    </View>
  );
}