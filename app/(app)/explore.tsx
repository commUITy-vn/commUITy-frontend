import { View, Text, FlatList, Image, Pressable, StyleSheet, Modal, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { BorderRadius, Spacing } from '@/constants/theme';
import { usePosts, useCreatePost, usePostComments, useCreatePostComment } from '@/features/community/hooks/usePosts';
import { TextInput as TextInputUI, BottomSheet, Button, ConfirmModal } from '@/components/ui';
import { ReportModal, ReportTargetType } from '@/features/reports';
import { getUser } from '@/features/users/api/get-user';
import { createPrivateConversation } from '@/features/communication/api/create-private-conversation';
import { api } from '@/lib/api-client';
import { storage } from '@/lib/storage';
import { env } from '@/config/env';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';

interface Post {
  id: string;
  authorId?: string;
  author: string;
  avatar: string;
  timestamp: string;
  content: string;
  tags: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
}

const DUMMY_POSTS: Post[] = [];

const getMockProfile = (authorId: string, authorName?: string) => {
  const dummy = DUMMY_POSTS.find(p => p.authorId === authorId);
  const name = dummy?.author || authorName || 'Người dùng';
  const nameLower = name.toLowerCase().replace(/\s+/g, '.');
  const email = `${nameLower}@commuity.org`;
  const phone = '0987 654 321';
  let role = 'VOLUNTEER';
  if (name.includes('Nguyen Van A')) role = 'ADMIN';
  else if (name.includes('Tran Thi B')) role = 'COLLABORATOR';

  return {
    id: authorId,
    fullName: name,
    email,
    phone,
    role,
    avatarUrl: dummy?.avatar || 'https://i.pravatar.cc/150',
  };
};

function getRelativeTime(dateString: string): string {
  if (!dateString) return 'Just now';
  if (dateString.includes('ago') || dateString.toLowerCase() === 'just now') {
    return dateString;
  }
  try {
    let clean = dateString;
    // Normalize fractional seconds (e.g. .85436 -> .854)
    clean = clean.replace(/(\.\d{3})\d+/, '$1');
    // Ensure UTC Z if no timezone is specified and it has a 'T'
    if (clean.includes('T') && !clean.endsWith('Z') && !clean.match(/[+-]\d{2}:?\d{2}$/)) {
      clean = clean + 'Z';
    }
    const date = new Date(clean);
    if (isNaN(date.getTime())) return dateString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Handle potential clock drift between server and client
    const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return diffSecs <= 5 ? 'Just now' : `${diffSecs} seconds ago`;
    }
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
    return date.toLocaleDateString();
  } catch (error) {
    return dateString;
  }
}

const DUMMY_COMMENTS: Record<string, any[]> = {};

const Avatar = ({ uri, name, size = 44, theme }: { uri?: string; name?: string; size?: number; theme: any }) => {
  let resolvedUri = uri;
  if (uri && !uri.startsWith('http://') && !uri.startsWith('https://') && !uri.startsWith('file://') && !uri.startsWith('data:')) {
    const apiBase = env.API_URL.endsWith('/api') ? env.API_URL.slice(0, -4) : env.API_URL;
    const cleanUri = uri.startsWith('/') ? uri : '/' + uri;
    resolvedUri = `${apiBase}${cleanUri}`;
  }

  const isImageValid = resolvedUri && 
    (resolvedUri.startsWith('http://') || resolvedUri.startsWith('https://') || resolvedUri.startsWith('file://') || resolvedUri.startsWith('data:')) &&
    !resolvedUri.includes('pravatar.cc');
  
  if (isImageValid) {
    return (
      <Image
        source={{ uri: resolvedUri }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: theme.border,
        }}
      />
    );
  }

  const initial = name ? name.charAt(0).toUpperCase() : 'U';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: size * 0.45, fontWeight: '700' }}>
        {initial}
      </Text>
    </View>
  );
};

function ReactionPopup({
  onSelect,
  theme,
  style,
}: {
  onSelect: (emoji: string) => void;
  theme: any;
  style?: any;
}) {
  const quickEmojis = ['👍', '❤️', '😂', '🎉', '😮', '😢'];
  return (
    <View
      style={[
        {
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
        },
        style,
      ]}
    >
      {quickEmojis.map((emoji) => (
        <Pressable
          key={emoji}
          onPress={() => onSelect(emoji)}
          style={({ pressed }) => ({
            paddingHorizontal: 4,
            paddingVertical: 2,
            borderRadius: 6,
            backgroundColor: pressed ? theme.highlightBG : 'transparent',
          })}
        >
          <Text style={{ fontSize: 20 }}>{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const PostCard = ({ post, onAuthorPress }: { post: Post; onAuthorPress?: (authorId: string, authorName?: string) => void }) => {
  const theme = useTheme();
  const themeStyles = useThemeStyles();
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isMenuSheetVisible, setIsMenuSheetVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [alertModal, setAlertModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });
  const [isReportUserModalVisible, setIsReportUserModalVisible] = useState(false);

  // Local profile bottom sheet states inside Comments modal
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const handleAuthorPress = async (authorId: string, customAuthorName?: string) => {
    setSelectedAuthorId(authorId);
    setIsProfileVisible(true);
    setIsProfileLoading(true);
    setProfileData(null);

    try {
      const res = await getUser(authorId);
      if (res) {
        setProfileData(res);
      } else {
        setProfileData(getMockProfile(authorId, customAuthorName));
      }
    } catch (err) {
      console.warn('Failed to fetch user details, using mock fallback:', err);
      setProfileData(getMockProfile(authorId, customAuthorName));
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleDirectMessage = async () => {
    if (!selectedAuthorId) return;
    setChatLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProfileVisible(false);
    setShowComments(false);

    try {
      const res: any = await createPrivateConversation({ receiverId: selectedAuthorId });
      const conversationId = res?.id || res?.data?.id;
      if (conversationId) {
        requestAnimationFrame(() => {
          router.push({ pathname: '/messages/[id]', params: { id: conversationId } } as any);
        });
      } else {
        console.error('No conversation ID returned', res);
      }
    } catch (err) {
      console.error('Failed to create private conversation, navigating to mock chat:', err);
      requestAnimationFrame(() => {
        router.push({ pathname: '/messages/[id]', params: { id: selectedAuthorId } } as any);
      });
    } finally {
      setChatLoading(false);
    }
  };

  const { data: serverComments } = usePostComments(post.id);
  const { mutateAsync: addServerComment } = useCreatePostComment();
  const [localComments, setLocalComments] = useState<any[]>(DUMMY_COMMENTS[post.id] || []);

  // Comments Reactions Local State
  const [commentReactions, setCommentReactions] = useState<Record<string, Record<string, string[]>>>({});
  const [showCommentReactionPickerId, setShowCommentReactionPickerId] = useState<string | null>(null);

  // Comment Media Upload State
  const [selectedCommentMedia, setSelectedCommentMedia] = useState<any | null>(null);
  const [isCommentUploading, setIsCommentUploading] = useState(false);
  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const [replyingToComment, setReplyingToComment] = useState<{ id: string; authorName: string } | null>(null);

  const commentsList = [
    ...localComments.map((c: any) => ({
      ...c,
      authorId: c.authorId || user?.id || 'me-id',
    })),
    ...(serverComments && Array.isArray(serverComments)
      ? serverComments.map((c: any) => ({
          id: c.id || String(Math.random()),
          authorId: c.authorId || c.userId || (c.user && c.user.id) || c.creatorId || c.createdBy || 'unknown',
          authorName: c.author || c.authorName || c.userName || 'User',
          avatar: c.avatar || c.authorAvatarUrl || c.userAvatarUrl || 'https://i.pravatar.cc/150',
          content: c.content,
          timestamp: getRelativeTime(c.timestamp || c.createdAt || 'Just now'),
          media: c.media || undefined,
          parentCommentId: c.parentCommentId || undefined,
        }))
      : []),
  ];

  const commentsCount = serverComments !== undefined
    ? commentsList.length
    : (post.comments || 0) + localComments.length;

  // Load persisted states on mount or post.id change
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const likesDataStr = await storage.getItemAsync(`explore_likes_${post.id}`);
        if (likesDataStr) {
          const likesData = JSON.parse(likesDataStr);
          setIsLiked(likesData.isLiked);
          setLikeCount(likesData.likes);
        } else {
          setIsLiked(post.isLiked);
          setLikeCount(post.likes);
        }

        const localCommentsStr = await storage.getItemAsync(`explore_comments_${post.id}`);
        if (localCommentsStr) {
          setLocalComments(JSON.parse(localCommentsStr));
        } else {
          setLocalComments([]);
        }

        const reactionsStr = await storage.getItemAsync(`explore_comment_reactions_${post.id}`);
        if (reactionsStr) {
          setCommentReactions(JSON.parse(reactionsStr));
        } else {
          setCommentReactions({});
        }
      } catch (err) {
        console.error('Failed to load persisted explore data:', err);
      }
    };
    loadPersistedData();
  }, [post.id, post.isLiked, post.likes]);

  const handleLike = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;
    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);

    try {
      await storage.setItemAsync(
        `explore_likes_${post.id}`,
        JSON.stringify({ isLiked: newIsLiked, likes: newLikeCount })
      );
    } catch (err) {
      console.error('Failed to persist like state:', err);
    }
  };

  const handleComment = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowComments(true);
  };

  const handleCommentFileChange = async (e: any) => {
    if (Platform.OS !== 'web') return;
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCommentUploading(true);
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
      setSelectedCommentMedia({
        id: mediaRes.id || String(Math.random()),
        fileName: file.name,
        fileUrl: localUrl,
        fileType,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
      });
    } catch (err) {
      console.error('Failed to upload comment file:', err);
      // Fallback local media if upload fails
      setSelectedCommentMedia({
        id: String(Date.now()),
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileType: file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
        mimeType: file.type,
        fileSize: file.size,
      });
    } finally {
      setIsCommentUploading(false);
      if (commentFileInputRef.current) commentFileInputRef.current.value = '';
    }
  };

  const persistComments = async (updatedComments: any[]) => {
    try {
      await storage.setItemAsync(
        `explore_comments_${post.id}`,
        JSON.stringify(updatedComments)
      );
    } catch (err) {
      console.error('Failed to persist local comments:', err);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() && !selectedCommentMedia) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const content = commentText.trim();
    const mediaItem = selectedCommentMedia;
    const parentCommentId = replyingToComment?.id || undefined;
    
    setCommentText('');
    setSelectedCommentMedia(null);
    setReplyingToComment(null);

    try {
      if (['1', '2', '3', '4', '5'].includes(post.id)) {
        const newComments = [
          ...localComments,
          {
            id: String(Date.now()),
            authorId: user?.id || 'me-id',
            authorName: 'Me',
            avatar: 'https://i.pravatar.cc/150?img=8',
            content,
            timestamp: 'Just now',
            media: mediaItem ? [mediaItem] : undefined,
            parentCommentId,
          },
        ];
        setLocalComments(newComments);
        await persistComments(newComments);
      } else {
        await addServerComment({ postId: post.id, content, parentCommentId });
        // Server might not support comments media, so we save locally for display
        if (mediaItem) {
          const newComments = [
            ...localComments,
            {
              id: String(Date.now()),
              authorId: user?.id || 'me-id',
              authorName: 'Me',
              avatar: 'https://i.pravatar.cc/150?img=8',
              content,
              timestamp: 'Just now',
              media: [mediaItem],
              parentCommentId,
            },
          ];
          setLocalComments(newComments);
          await persistComments(newComments);
        }
      }
    } catch (error) {
      const newComments = [
        ...localComments,
        {
          id: String(Date.now()),
          authorId: user?.id || 'me-id',
          authorName: 'Me',
          avatar: 'https://i.pravatar.cc/150?img=8',
          content,
          timestamp: 'Just now',
          media: mediaItem ? [mediaItem] : undefined,
        },
      ];
      setLocalComments(newComments);
      await persistComments(newComments);
    }
  };

  const toggleCommentReaction = async (commentId: string, emoji: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userName = 'Me';
    setCommentReactions((prev) => {
      const msgReactions = prev[commentId] || {};
      const usersList = msgReactions[emoji] || [];
      const newUsersList = usersList.includes(userName)
        ? usersList.filter((u) => u !== userName)
        : [...usersList, userName];
      const newMsgReactions = { ...msgReactions };
      if (newUsersList.length === 0) delete newMsgReactions[emoji];
      else newMsgReactions[emoji] = newUsersList;
      const updated = { ...prev, [commentId]: newMsgReactions };

      storage.setItemAsync(`explore_comment_reactions_${post.id}`, JSON.stringify(updated))
        .catch(err => console.error('Failed to persist comment reactions:', err));

      return updated;
    });
    setShowCommentReactionPickerId(null);
  };

  return (
    <>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.componentBG,
            borderColor: theme.bordersBold,
            borderRadius: BorderRadius.lg,
          },
        ]}
      >
        <View style={styles.header}>
          <Pressable
            onPress={async () => {
              if (post.authorId) {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onAuthorPress?.(post.authorId);
              }
            }}
            style={({ pressed }) => [
              { flexDirection: 'row', alignItems: 'center', flex: 1 },
              pressed && { opacity: 0.7 }
            ]}
          >
            <Avatar uri={post.avatar} name={post.author} size={44} theme={theme} />
            <View style={styles.authorInfo}>
              <Text style={[styles.authorName, { color: theme.text }]}>{post.author}</Text>
              <Text style={[styles.timestamp, { color: theme.textSupporting }]}>{post.timestamp}</Text>
            </View>
          </Pressable>
          {post.authorId !== user?.id && (
            <Pressable
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsMenuSheetVisible(true);
              }}
              style={({ pressed }) => [
                { padding: 8, borderRadius: 8 },
                pressed && { backgroundColor: theme.highlightBG }
              ]}
            >
              <MaterialIcons name="more-vert" size={22} color={theme.textSupporting} />
            </Pressable>
          )}
        </View>

        <Text style={[styles.content, { color: theme.text }]}>{post.content}</Text>

        {post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: theme.highlightBG, borderColor: theme.border }]}>
                <Text style={[styles.tagText, { color: theme.primary }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.actions, { borderTopColor: theme.border }]}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.7 }]}
            onPress={handleLike}
          >
            <MaterialIcons
              name={isLiked ? 'favorite' : 'favorite-border'}
              size={20}
              color={isLiked ? theme.danger : theme.icon}
            />
            <Text style={[styles.actionText, { color: theme.textSupporting }]}>{likeCount}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && {
                backgroundColor: theme.highlightBG,
                borderColor: theme.border
              }
            ]}
            onPress={handleComment}
          >
            <MaterialIcons name="chat-bubble-outline" size={20} color={theme.icon} />
            <Text style={[styles.actionText, { color: theme.textSupporting }]}>{commentsCount}</Text>
          </Pressable>
        </View>
      </View>

      {/* Options Menu BottomSheet */}
      <BottomSheet
        isVisible={isMenuSheetVisible}
        onClose={() => setIsMenuSheetVisible(false)}
        title="Options"
        options={[
          ...(!post.authorId || post.authorId !== user?.id ? [{
            key: 'report',
            label: 'Report Post',
            icon: 'flag' as any,
            onPress: () => {
              setIsMenuSheetVisible(false);
              // Defer opening of the next sheet to prevent React Native modal conflict
              setTimeout(() => {
                setIsReportModalVisible(true);
              }, 400);
            },
          }] : []),
        ]}
      />

      <ReportModal
        visible={isReportModalVisible}
        onClose={() => setIsReportModalVisible(false)}
        targetType={ReportTargetType.POST}
        targetId={post.id}
        targetName={post.content}
        onSuccessSubmit={() => {
          setAlertModal({
            visible: true,
            title: 'Report Submitted',
            message: 'Your report has been submitted to administrators for review.',
          });
        }}
      />

      <ConfirmModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        confirmText="OK"
        cancelText=""
        onConfirm={() => setAlertModal(prev => ({ ...prev, visible: false }))}
        onCancel={() => setAlertModal(prev => ({ ...prev, visible: false }))}
      />

      <ReportModal
        visible={isReportUserModalVisible}
        onClose={() => setIsReportUserModalVisible(false)}
        targetType={ReportTargetType.USER}
        targetId={selectedAuthorId || ''}
        targetName={profileData?.fullName || 'User'}
        onSuccessSubmit={() => {
          setAlertModal({
            visible: true,
            title: 'Report Submitted',
            message: 'Your report has been submitted to administrators for review.',
          });
        }}
      />

      {/* Comments Modal - Expensify style */}
      <Modal
        visible={showComments}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowComments(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.appBG }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Pressable onPress={() => setShowComments(false)} style={styles.modalCloseBtn}>
              <MaterialIcons name="close" size={24} color={theme.text} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Comments</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView 
            style={{ flex: 1, padding: Spacing.base }}
            contentContainerStyle={{ gap: 16, paddingBottom: 32 }}
          >
            {(() => {
              const rootComments = commentsList.filter((c: any) => !c.parentCommentId);
              const replies = commentsList.filter((c: any) => c.parentCommentId);

              if (rootComments.length === 0) {
                return (
                  <View style={{ flex: 1, paddingVertical: 40, justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialIcons name="chat-bubble-outline" size={48} color={theme.textSupporting} />
                    <Text style={{ color: theme.textSupporting, fontSize: 16, marginTop: 12, textAlign: 'center' }}>
                      No comments yet. Start the conversation!
                    </Text>
                  </View>
                );
              }

              return rootComments.map((item) => {
                const msgReactions = commentReactions[item.id] || {};
                const showPicker = showCommentReactionPickerId === item.id;
                const commentReplies = replies.filter((r: any) => r.parentCommentId === item.id);

                return (
                  <View key={item.id} style={{ gap: 12 }}>
                    {/* Main Root Comment */}
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Pressable
                        onPress={async () => {
                          if (item.authorId) {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            handleAuthorPress(item.authorId, item.authorName);
                          }
                        }}
                        style={({ pressed }) => [
                          pressed && { opacity: 0.7 }
                        ]}
                      >
                        <Avatar uri={item.avatar} name={item.authorName} size={36} theme={theme} />
                      </Pressable>
                      <View style={{ flex: 1, backgroundColor: theme.highlightBG, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 4, gap: 8 }}>
                          <Pressable
                            onPress={async () => {
                              if (item.authorId) {
                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                handleAuthorPress(item.authorId, item.authorName);
                              }
                            }}
                            style={({ pressed }) => [
                              pressed && { opacity: 0.7 }
                            ]}
                          >
                            <Text style={{ fontWeight: '600', color: theme.text, fontSize: 14 }}>{item.authorName}</Text>
                          </Pressable>
                          <Text style={{ fontSize: 11, color: theme.textSupporting }}>{item.timestamp}</Text>
                        </View>
                        <Text style={{ fontSize: 14, color: theme.text, lineHeight: 20 }}>{item.content}</Text>

                        {/* Media preview inside comment */}
                        {item.media && item.media.map((med: any) => (
                          <View key={med.id} style={{ marginTop: 6 }}>
                            {med.fileType === 'IMAGE' ? (
                              <Image
                                source={{ uri: med.fileUrl }}
                                style={{ width: 200, height: 120, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, backgroundColor: theme.appBG, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                                <MaterialIcons name="insert-drive-file" size={20} color={theme.primary} />
                                <Text style={{ fontSize: 12, color: theme.text }} numberOfLines={1}>{med.fileName}</Text>
                              </View>
                            )}
                          </View>
                        ))}

                        {/* Action Bar (React & Reply triggers) */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 6, position: 'relative', zIndex: 10 }}>
                          <View style={{ position: 'relative' }}>
                            <Pressable
                              onPress={() => setShowCommentReactionPickerId(showPicker ? null : item.id)}
                              style={({ pressed }) => ({
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                paddingVertical: 2,
                                paddingHorizontal: 6,
                                borderRadius: 4,
                                backgroundColor: pressed || showPicker ? theme.border : 'transparent',
                              })}
                            >
                              <MaterialIcons name="add-reaction" size={13} color={theme.textSupporting} />
                              <Text style={{ fontSize: 11, color: theme.textSupporting, fontWeight: '600' }}>React</Text>
                            </Pressable>
                            
                            {showPicker && (
                              <ReactionPopup
                                onSelect={(emoji) => toggleCommentReaction(item.id, emoji)}
                                theme={theme}
                                style={{ bottom: 24, left: 0 }}
                              />
                            )}
                          </View>

                          <Pressable
                            onPress={async () => {
                              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setReplyingToComment({ id: item.id, authorName: item.authorName });
                            }}
                            style={({ pressed }) => ({
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              paddingVertical: 2,
                              paddingHorizontal: 6,
                              borderRadius: 4,
                              backgroundColor: pressed ? theme.border : 'transparent',
                            })}
                          >
                            <MaterialIcons name="reply" size={13} color={theme.textSupporting} />
                            <Text style={{ fontSize: 11, color: theme.textSupporting, fontWeight: '600' }}>Reply</Text>
                          </Pressable>
                        </View>

                        {/* Display comment reactions count badges */}
                        {Object.keys(msgReactions).length > 0 && (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                            {Object.entries(msgReactions).map(([emoji, users]) => (
                              <Pressable
                                key={emoji}
                                onPress={() => toggleCommentReaction(item.id, emoji)}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  backgroundColor: (users as string[]).includes('Me')
                                    ? theme.activeComponentBG || theme.highlightBG
                                    : theme.highlightBG,
                                  borderWidth: 1,
                                  borderColor: (users as string[]).includes('Me')
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
                                    color: (users as string[]).includes('Me')
                                      ? theme.primary
                                      : theme.textSupporting,
                                  }}
                                >
                                  {(users as string[]).length}
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Threaded Child Replies */}
                    {commentReplies.length > 0 && (
                      <View style={{ paddingLeft: 24, gap: 12, borderLeftWidth: 1.5, borderLeftColor: theme.border, marginLeft: 18 }}>
                        {commentReplies.map((reply: any) => {
                          const replyReactions = commentReactions[reply.id] || {};
                          const showReplyPicker = showCommentReactionPickerId === reply.id;
                          return (
                            <View key={reply.id} style={{ flexDirection: 'row', gap: 10 }}>
                              <Pressable
                                onPress={async () => {
                                  if (reply.authorId) {
                                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    handleAuthorPress(reply.authorId, reply.authorName);
                                  }
                                }}
                                style={({ pressed }) => [
                                  pressed && { opacity: 0.7 }
                                ]}
                              >
                                <Avatar uri={reply.avatar} name={reply.authorName} size={28} theme={theme} />
                              </Pressable>
                              <View style={{ flex: 1, backgroundColor: theme.appBG, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.border }}>
                                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 4, gap: 8 }}>
                                  <Pressable
                                    onPress={async () => {
                                      if (reply.authorId) {
                                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        handleAuthorPress(reply.authorId, reply.authorName);
                                      }
                                    }}
                                    style={({ pressed }) => [
                                      pressed && { opacity: 0.7 }
                                    ]}
                                  >
                                    <Text style={{ fontWeight: '600', color: theme.text, fontSize: 13 }}>{reply.authorName}</Text>
                                  </Pressable>
                                  <Text style={{ fontSize: 10, color: theme.textSupporting }}>{reply.timestamp}</Text>
                                </View>
                                <Text style={{ fontSize: 13, color: theme.text, lineHeight: 18 }}>{reply.content}</Text>

                                {/* Child actions (React only) */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, position: 'relative', zIndex: 10 }}>
                                  <View style={{ position: 'relative' }}>
                                    <Pressable
                                      onPress={() => setShowCommentReactionPickerId(showReplyPicker ? null : reply.id)}
                                      style={({ pressed }) => ({
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 4,
                                        paddingVertical: 2,
                                        paddingHorizontal: 6,
                                        borderRadius: 4,
                                        backgroundColor: pressed || showReplyPicker ? theme.border : 'transparent',
                                      })}
                                    >
                                      <MaterialIcons name="add-reaction" size={12} color={theme.textSupporting} />
                                      <Text style={{ fontSize: 10, color: theme.textSupporting, fontWeight: '600' }}>React</Text>
                                    </Pressable>
                                    
                                    {showReplyPicker && (
                                      <ReactionPopup
                                        onSelect={(emoji) => toggleCommentReaction(reply.id, emoji)}
                                        theme={theme}
                                        style={{ bottom: 24, left: 0 }}
                                      />
                                    )}
                                  </View>
                                </View>

                                {/* Child Reactions badges */}
                                {Object.keys(replyReactions).length > 0 && (
                                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                                    {Object.entries(replyReactions).map(([emoji, users]) => (
                                      <Pressable
                                        key={emoji}
                                        onPress={() => toggleCommentReaction(reply.id, emoji)}
                                        style={{
                                          flexDirection: 'row',
                                          alignItems: 'center',
                                          backgroundColor: (users as string[]).includes('Me')
                                            ? theme.activeComponentBG || theme.highlightBG
                                            : theme.highlightBG,
                                          borderWidth: 1,
                                          borderColor: (users as string[]).includes('Me')
                                            ? theme.primary
                                            : theme.border,
                                          borderRadius: 8,
                                          paddingHorizontal: 5,
                                          paddingVertical: 1.5,
                                          gap: 3,
                                        }}
                                      >
                                        <Text style={{ fontSize: 10 }}>{emoji}</Text>
                                        <Text
                                          style={{
                                            fontSize: 9,
                                            fontWeight: '600',
                                            color: (users as string[]).includes('Me')
                                              ? theme.primary
                                              : theme.textSupporting,
                                          }}
                                        >
                                          {(users as string[]).length}
                                        </Text>
                                      </Pressable>
                                    ))}
                                  </View>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              });
            })()}
          </ScrollView>

          {/* Hidden file input (web only) */}
          {Platform.OS === 'web' && (
            <input
              type="file"
              ref={commentFileInputRef}
              style={{ display: 'none' }}
              onChange={handleCommentFileChange}
            />
          )}

          {/* Comment Media Attachment Preview Strip */}
          {selectedCommentMedia && (
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
                {selectedCommentMedia.fileType === 'IMAGE' ? (
                  <Image
                    source={{ uri: selectedCommentMedia.fileUrl }}
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
                    {selectedCommentMedia.fileName}
                  </Text>
                  <Text style={{ color: theme.textSupporting, fontSize: 11 }}>
                    {(selectedCommentMedia.fileSize / 1024).toFixed(1)} KB
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setSelectedCommentMedia(null)}
                style={{ padding: 6, borderRadius: 20, backgroundColor: theme.border }}
              >
                <MaterialIcons name="close" size={16} color={theme.text} />
              </Pressable>
            </View>
          )}

          {replyingToComment && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: theme.highlightBG,
                borderTopWidth: 1,
                borderTopColor: theme.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialIcons name="reply" size={16} color={theme.primary} />
                <Text style={{ color: theme.text, fontSize: 13 }}>
                  Replying to <Text style={{ fontWeight: '600' }}>@{replyingToComment.authorName}</Text>
                </Text>
              </View>
              <Pressable
                onPress={() => setReplyingToComment(null)}
                style={{ padding: 4 }}
              >
                <MaterialIcons name="close" size={16} color={theme.textSupporting} />
              </Pressable>
            </View>
          )}

          <View style={[styles.modalInputBar, { borderTopColor: theme.border, backgroundColor: theme.appBG, paddingBottom: Platform.OS === 'ios' ? 24 : 12 }]}>
            {/* Attachment Button */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (Platform.OS === 'web') commentFileInputRef.current?.click();
              }}
              disabled={isCommentUploading}
              style={({ pressed }) => ({
                padding: 8,
                borderRadius: 20,
                backgroundColor: pressed ? theme.highlightBG : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
              })}
            >
              {isCommentUploading ? (
                <ActivityIndicator size="small" color={theme.icon} />
              ) : (
                <MaterialIcons name="add" size={24} color={theme.textSupporting} />
              )}
            </Pressable>

            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.highlightBG,
                paddingHorizontal: 12,
                height: 40,
              }}
            >
              <TextInputUI
                placeholder="Add a comment..."
                placeholderTextColor={theme.placeholderText}
                value={commentText}
                onChangeText={setCommentText}
                disableFloatingLabel
                borderless
                height={40}
                containerStyle={{ flex: 1, marginBottom: 0 }}
                style={{
                  fontSize: 14,
                  paddingTop: 0,
                  paddingBottom: 0,
                }}
              />
            </View>
            <Pressable
              onPress={handleSendComment}
              style={{ padding: 8 }}
            >
              <MaterialIcons name="send" size={24} color={(commentText.trim() || selectedCommentMedia) ? theme.primary : theme.textSupporting} />
            </Pressable>
          </View>

          {/* Local Profile Details Bottom Sheet inside Comments modal */}
          <BottomSheet isVisible={isProfileVisible} onClose={() => setIsProfileVisible(false)}>
            {isProfileLoading ? (
              <View style={{ padding: 40, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            ) : profileData ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                {/* Avatar bubble */}
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: theme.highlightBG,
                    borderWidth: 2,
                    borderColor: theme.border,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ color: theme.text, fontSize: 32, fontWeight: '700' }}>
                    {profileData.fullName?.charAt(0).toUpperCase() ?? '?'}
                  </Text>
                </View>

                {/* Name */}
                <Text
                  style={{
                    color: theme.text,
                    fontSize: 22,
                    fontWeight: '700',
                    textAlign: 'center',
                    marginBottom: 6,
                  }}
                >
                  {profileData.fullName}
                </Text>

                {/* Role Tag */}
                <View
                  style={{
                    backgroundColor: theme.highlightBG,
                    borderColor: theme.border,
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    marginBottom: 24,
                  }}
                >
                  <Text
                    style={{
                      color: theme.primary,
                      fontSize: 12,
                      fontWeight: '600',
                      textTransform: 'uppercase',
                    }}
                  >
                    {profileData.role === 'ADMIN' ? 'Admin' : profileData.role === 'COLLABORATOR' ? 'Collaborator' : 'Volunteer'}
                  </Text>
                </View>

                {/* Info fields */}
                <View
                  style={{
                    width: '100%',
                    backgroundColor: theme.highlightBG,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: theme.border,
                    padding: 16,
                    gap: 16,
                    marginBottom: 24,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons name="email" size={20} color={theme.textSupporting} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.textSupporting, fontSize: 12 }}>Email</Text>
                      <Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }} numberOfLines={1}>
                        {profileData.email || 'N/A'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border }} />

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons name="phone" size={20} color={theme.textSupporting} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.textSupporting, fontSize: 12 }}>Phone</Text>
                      <Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>
                        {profileData.phone || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* DM Button */}
                <Button
                  text="Direct Message"
                  primary
                  onPress={handleDirectMessage}
                  style={{ width: '100%', borderRadius: 100 }}
                  isLoading={chatLoading}
                />

                {/* Report Profile Button */}
                {selectedAuthorId !== user?.id && (
                  <Button
                    onPress={async () => {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setIsProfileVisible(false);
                      setTimeout(() => {
                        setIsReportUserModalVisible(true);
                      }, 400);
                    }}
                    style={{ width: '100%', borderRadius: 100, marginTop: 12, backgroundColor: theme.danger + '15' }}
                  >
                    <Text style={{ color: theme.danger, fontWeight: 'bold', fontSize: 16 }}>Report Profile</Text>
                  </Button>
                )}
              </View>
            ) : (
              <View style={{ padding: 40, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: theme.textSupporting }}>Could not load profile details.</Text>
              </View>
            )}
          </BottomSheet>
        </View>
      </Modal>
    </>
  );
};

export default function ExploreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: posts, isLoading } = usePosts();
  const { mutateAsync: createPost, isPending: isCreating } = useCreatePost();
  
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');

  // Profile bottom sheet states
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const { user } = useAuthStore();
  const [isReportUserModalVisible, setIsReportUserModalVisible] = useState(false);
  const [alertModal, setAlertModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });

  const handleAuthorPress = async (authorId: string, customAuthorName?: string) => {
    setSelectedAuthorId(authorId);
    setIsProfileVisible(true);
    setIsProfileLoading(true);
    setProfileData(null);

    try {
      const res = await getUser(authorId);
      if (res) {
        setProfileData(res);
      } else {
        setProfileData(getMockProfile(authorId, customAuthorName));
      }
    } catch (err) {
      console.warn('Failed to fetch user details, using mock fallback:', err);
      setProfileData(getMockProfile(authorId, customAuthorName));
    } finally {
      setIsProfileLoading(false);
    }
  };

  // Temporary adapter if backend data is not perfectly matching Post type
  const displayPosts = posts && Array.isArray(posts) && posts.length > 0 
    ? posts.map((p: any) => ({
        id: p.id || String(Math.random()),
        authorId: p.authorId || p.userId || (p.user && p.user.id) || p.creatorId || p.createdBy,
        author: p.author || p.authorName || p.userName || 'Unknown User',
        avatar: p.avatar || p.authorAvatarUrl || p.userAvatar || 'https://i.pravatar.cc/150',
        timestamp: getRelativeTime(p.createdAt || p.timestamp || 'Just now'),
        content: p.content || '',
        tags: p.tags || [],
        likes: p.likes || p.reactionsCount || 0,
        comments: p.comments || p.commentsCount || 0,
        isLiked: p.isLiked || false,
      }))
    : DUMMY_POSTS;



  const handleDirectMessage = async () => {
    if (!selectedAuthorId) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Close bottom sheet first
    setIsProfileVisible(false);
    
    try {
      const res: any = await createPrivateConversation({ receiverId: selectedAuthorId });
      const conversationId = res?.id || res?.data?.id;
      if (conversationId) {
        requestAnimationFrame(() => {
          router.push({ pathname: '/messages/[id]', params: { id: conversationId } } as any);
        });
      } else {
        console.error('No conversation ID returned', res);
      }
    } catch (err) {
      console.error('Failed to create private conversation, navigating to mock chat:', err);
      // Fallback: Navigate to the mock chat room with the author id
      requestAnimationFrame(() => {
        router.push({ pathname: '/messages/[id]', params: { id: selectedAuthorId } } as any);
      });
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await createPost({
        content: newPostContent,
        visibility: 'PUBLIC',
      });
      setNewPostContent('');
      setShowCreatePost(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.appBG }]}>
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
          Explore
        </Text>
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowCreatePost(true);
          }}
          style={({ pressed }) => [
            {
              padding: 8,
              borderRadius: 20,
              backgroundColor: theme.highlightBG,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <MaterialIcons name="add" size={24} color={theme.primary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={displayPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} onAuthorPress={handleAuthorPress} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Profile Details Bottom Sheet */}
      <BottomSheet isVisible={isProfileVisible} onClose={() => setIsProfileVisible(false)}>
        {isProfileLoading ? (
          <View style={{ padding: 40, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : profileData ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            {/* Avatar bubble */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: theme.highlightBG,
                borderWidth: 2,
                borderColor: theme.border,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
                ...Platform.select({
                  ios: {
                    shadowColor: theme.inverse,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                  },
                  android: {
                    elevation: 3,
                  },
                  default: {},
                }),
              }}
            >
              <Text style={{ color: theme.text, fontSize: 32, fontWeight: '700' }}>
                {profileData.fullName?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>

            {/* Name */}
            <Text
              style={{
                color: theme.text,
                fontSize: 22,
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: 6,
              }}
            >
              {profileData.fullName}
            </Text>

            {/* Role Tag */}
            <View
              style={{
                backgroundColor: theme.highlightBG,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 4,
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  color: theme.primary,
                  fontSize: 12,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                }}
              >
                {profileData.role === 'ADMIN' ? 'Admin' : profileData.role === 'COLLABORATOR' ? 'Collaborator' : 'Volunteer'}
              </Text>
            </View>

            {/* Info fields */}
            <View
              style={{
                width: '100%',
                backgroundColor: theme.highlightBG,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.border,
                padding: 16,
                gap: 16,
                marginBottom: 24,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="email" size={20} color={theme.textSupporting} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textSupporting, fontSize: 12 }}>Email</Text>
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }} numberOfLines={1}>
                    {profileData.email || 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border }} />

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="phone" size={20} color={theme.textSupporting} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textSupporting, fontSize: 12 }}>Phone</Text>
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>
                    {profileData.phone || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>

            {/* DM Button */}
            <Button
              text="Direct Message"
              primary
              onPress={handleDirectMessage}
              style={{ width: '100%', borderRadius: 100 }}
            />

            {/* Report Profile Button */}
            {selectedAuthorId !== user?.id && (
              <Button
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsProfileVisible(false);
                  setTimeout(() => {
                    setIsReportUserModalVisible(true);
                  }, 400);
                }}
                style={{ width: '100%', borderRadius: 100, marginTop: 12, backgroundColor: theme.danger + '15' }}
              >
                <Text style={{ color: theme.danger, fontWeight: 'bold', fontSize: 16 }}>Report Profile</Text>
              </Button>
            )}
          </View>
        ) : (
          <View style={{ padding: 40, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: theme.textSupporting }}>Could not load profile details.</Text>
          </View>
        )}
      </BottomSheet>

      {/* Create Post Modal */}
      <Modal
        visible={showCreatePost}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreatePost(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.appBG }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}
          >
            <Pressable onPress={() => setShowCreatePost(false)}>
              <MaterialIcons name="close" size={24} color={theme.text} />
            </Pressable>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: theme.text,
              }}
            >
              Create Post
            </Text>
            <Pressable
              onPress={handleCreatePost}
              disabled={isCreating || !newPostContent.trim()}
              style={({ pressed }) => [
                {
                  opacity: (isCreating || !newPostContent.trim()) ? 0.5 : 1,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text
                style={{
                  color: theme.primary,
                  fontSize: 16,
                  fontWeight: '600',
                }}
              >
                Post
              </Text>
            </Pressable>
          </View>

          <View style={{ padding: 20, gap: 16 }}>
            <TextInputUI
              label="Share something with the community..."
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
              height={120}
              style={{
                fontSize: 16,
                color: theme.text,
              }}
            />
          </View>
        </View>
      </Modal>

      <ReportModal
        visible={isReportUserModalVisible}
        onClose={() => setIsReportUserModalVisible(false)}
        targetType={ReportTargetType.USER}
        targetId={selectedAuthorId || ''}
        targetName={profileData?.fullName || 'User'}
        onSuccessSubmit={() => {
          setAlertModal({
            visible: true,
            title: 'Report Submitted',
            message: 'Your report has been submitted to administrators for review.',
          });
        }}
      />

      <ConfirmModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        confirmText="OK"
        cancelText=""
        onConfirm={() => setAlertModal(prev => ({ ...prev, visible: false }))}
        onCancel={() => setAlertModal(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.base,
    gap: Spacing.base,
  },
  card: {
    padding: Spacing.base,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
  },
  authorInfo: {
    marginLeft: Spacing.base,
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.base,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: Spacing.base,
    gap: Spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  actionText: {
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  modalCloseBtn: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  modalInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    paddingVertical: 0,
  },
});
