import { View, Text, FlatList, Image, Pressable, StyleSheet, Modal, ActivityIndicator, Platform, ScrollView, Linking, Alert } from 'react-native';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { BorderRadius, Spacing } from '@/constants/theme';
import { usePosts, useCreatePost, usePostComments, useCreatePostComment } from '@/features/community/hooks/usePosts';
import { usePostMedia } from '@/features/media/hooks/useMedia';
import { TextInput as TextInputUI, BottomSheet, Button, ConfirmModal } from '@/components/ui';
import { ReportModal, ReportTargetType } from '@/features/reports';
import { getUser } from '@/features/users/api/get-user';
import { createPrivateConversation } from '@/features/communication/api/create-private-conversation';
import { api } from '@/lib/api-client';
import { uploadMedia } from '@/features/media/api/upload-media';
import { storage } from '@/lib/storage';
import { env } from '@/config/env';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import { reactToPost } from '@/features/community/api/react-to-post';
import { removeReaction } from '@/features/community/api/remove-reaction';
import { getPostReactionsCount } from '@/features/community/api/get-post-reactions';
import { deletePost } from '@/features/community/api/delete-post';
import { deleteComment } from '@/features/community/api/delete-comment';

interface Post {
  id: string;
  authorId?: string;
  author: string;
  avatar: string;
  timestamp: string;
  rawCreatedAt?: string | null;
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
    // Backend local timestamps have no timezone. Parsing them as UTC makes old posts look like "Just now".
    clean = clean.replace(' ', 'T');
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

const POST_REACTIONS = [
  { type: 'LIKE', emoji: '👍', label: 'Like' },
  { type: 'LOVE', emoji: '❤️', label: 'Love' },
  { type: 'CARE', emoji: '🤗', label: 'Care' },
  { type: 'WOW', emoji: '😮', label: 'Wow' },
  { type: 'SAD', emoji: '😢', label: 'Sad' },
] as const;

const reactionByType = (type?: string | null) =>
  POST_REACTIONS.find((reaction) => reaction.type === type);

const DUMMY_COMMENTS: Record<string, any[]> = {};

type PendingMedia = {
  id?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  mimeType?: string;
  fileSize?: number;
  file?: File;
  uploadStatus?: 'queued' | 'uploading' | 'uploaded' | 'failed';
  error?: string;
};

const resolveMediaUrl = (uri?: string) => {
  if (!uri) return uri;
  if (
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('file://') ||
    uri.startsWith('data:') ||
    uri.startsWith('blob:')
  ) {
    return uri;
  }

  const apiBase = env.API_URL.endsWith('/api') ? env.API_URL.slice(0, -4) : env.API_URL;
  const cleanUri = uri.startsWith('/') ? uri : '/' + uri;
  return `${apiBase}${cleanUri}`;
};

const isRenderableImageUri = (uri?: string) => Boolean(
  uri &&
  (
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('file://') ||
    uri.startsWith('data:') ||
    uri.startsWith('blob:')
  ) &&
  !uri.includes('pravatar.cc')
);

const getProfileAvatarUrl = (profile: any) =>
  profile?.avatarUrl ||
  profile?.imageUrl ||
  profile?.profileImageUrl ||
  profile?.avatar ||
  profile?.userAvatar;

const uploadPendingMedia = async (item: PendingMedia, folderName: string) => {
  const fileName = item.fileName || `media-${Date.now()}`;
  const mimeType = item.mimeType || 'application/octet-stream';

  return uploadMedia({
    file: item.file,
    uri: item.fileUrl,
    fileName,
    mimeType,
    fileSize: item.fileSize,
    folderName,
    altText: fileName,
  });
};

const Avatar = ({ uri, name, size = 44, theme }: { uri?: string; name?: string; size?: number; theme: any }) => {
  const resolvedUri = resolveMediaUrl(uri);
  const isImageValid = isRenderableImageUri(resolvedUri);
  
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
          zIndex: 100,
          elevation: 20,
        },
        style,
      ]}
    >
      {POST_REACTIONS.map((reaction) => (
        <Pressable
          key={reaction.type}
          onPress={() => onSelect(reaction.emoji)}
          style={({ pressed }) => ({
            paddingHorizontal: 4,
            paddingVertical: 2,
            borderRadius: 6,
            backgroundColor: pressed ? theme.highlightBG : 'transparent',
          })}
        >
          <Text style={{ fontSize: 20 }}>{reaction.emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function PostMediaContainer({ postId }: { postId: string }) {
  const { data: mediaItems, isLoading } = usePostMedia(postId);
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={{ padding: 12, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  if (!mediaItems || mediaItems.length === 0) return null;

  const images = mediaItems.filter(item => item.fileType === 'IMAGE');
  const documents = mediaItems.filter(item => item.fileType !== 'IMAGE');

  return (
    <View style={{ marginTop: 12, gap: 12 }}>
      {/* Render Images */}
      {images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {images.map((img, idx) => {
            const resolvedUrl = resolveMediaUrl(img.fileUrl);

            return (
              <View key={img.mediaId || idx} style={{ borderRadius: 8, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
                <Image
                  source={{ uri: resolvedUrl }}
                  style={{ width: images.length === 1 ? 300 : 220, height: 160 }}
                  resizeMode="cover"
                />
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Render Documents / Other Files */}
      {documents.length > 0 && (
        <View style={{ gap: 6 }}>
          {documents.map((doc, idx) => (
            <Pressable
              key={doc.mediaId || idx}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const resolvedUrl = resolveMediaUrl(doc.fileUrl);
                if (resolvedUrl) {
                  Linking.openURL(resolvedUrl).catch(err => console.error("Couldn't open media URL:", err));
                }
              }}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 10,
                  backgroundColor: theme.highlightBG,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.border,
                },
                pressed && { backgroundColor: theme.border }
              ]}
            >
              <MaterialIcons
                name={doc.fileType === 'VIDEO' ? 'movie' : doc.fileType === 'AUDIO' ? 'music-note' : 'insert-drive-file'}
                size={22}
                color={theme.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: theme.text, fontWeight: '600' }} numberOfLines={1}>
                  {doc.fileName}
                </Text>
                <Text style={{ fontSize: 11, color: theme.textSupporting }}>
                  {doc.fileType.toLowerCase()} • {(doc.fileSize / 1024).toFixed(1)} KB
                </Text>
              </View>
              <MaterialIcons name="open-in-new" size={16} color={theme.textSupporting} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const PostCard = ({ post, onAuthorPress }: { post: Post; onAuthorPress?: (authorId: string, authorName?: string) => void }) => {
  const theme = useTheme();
  const themeStyles = useThemeStyles();
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [commentSort, setCommentSort] = useState<'all' | 'best' | 'recent'>('all');
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [showPostReactionPicker, setShowPostReactionPicker] = useState(false);
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
    if (selectedAuthorId === user?.id) {
      setAlertModal({
        visible: true,
        title: 'Direct message unavailable',
        message: 'You cannot create a direct message with yourself.',
      });
      return;
    }
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
      console.error('Failed to create private conversation:', err);
      setAlertModal({
        visible: true,
        title: 'Could not start chat',
        message: 'Please try again in a moment.',
      });
    } finally {
      setChatLoading(false);
    }
  };

  const { data: serverComments, refetch: refetchComments } = usePostComments(post.id);
  const { mutateAsync: addServerComment } = useCreatePostComment();
  const [localComments, setLocalComments] = useState<any[]>(DUMMY_COMMENTS[post.id] || []);
  const [, setTimeTick] = useState(0);

  // Comments Reactions Local State
  const [commentReactions, setCommentReactions] = useState<Record<string, Record<string, string[]>>>({});
  const [showCommentReactionPickerId, setShowCommentReactionPickerId] = useState<string | null>(null);

  // Comment Media Upload State
  const [selectedCommentMedia, setSelectedCommentMedia] = useState<any | null>(null);
  const [isCommentUploading, setIsCommentUploading] = useState(false);
  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const [replyingToComment, setReplyingToComment] = useState<{ id: string; authorName: string } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTimeTick((tick) => tick + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (showComments) {
        refetchComments();
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [showComments, refetchComments]);

  const commentsList = useMemo(
    () => [
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
            timestamp: getRelativeTime(c.createdAt || c.timestamp || 'Just now'),
            createdAt: c.createdAt || c.timestamp || new Date().toISOString(),
            media: c.media || undefined,
            parentCommentId: c.parentCommentId || undefined,
          }))
        : []),
    ],
    [localComments, serverComments, user?.id],
  );

  const mentionableAuthors = useMemo(() => {
    const seen = new Set<string>();
    return commentsList
      .map((comment: any) => ({
        id: comment.authorId,
        name: comment.authorName,
      }))
      .filter((author: { id: string; name: string }) => {
        if (!author.id || !author.name || seen.has(author.name)) return false;
        seen.add(author.name);
        return true;
      })
      .slice(0, 5);
  }, [commentsList]);
  const mentionQuery = useMemo(() => {
    const match = commentText.match(/(?:^|\s)@([^\s@]*)$/);
    return match ? match[1].toLowerCase() : null;
  }, [commentText]);
  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    return mentionableAuthors.filter((author: { id: string; name: string }) => author.name.toLowerCase().includes(mentionQuery));
  }, [mentionQuery, mentionableAuthors]);

  const commentsCount = serverComments !== undefined
    ? commentsList.length
    : (post.comments || 0) + localComments.length;

  // Load persisted states on mount or post.id change
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
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

  useEffect(() => {
    let isMounted = true;
    const loadReactions = async () => {
      try {
        const [countRes, myRes] = await Promise.all([
          getPostReactionsCount(post.id),
          api.get<any>(`/api/v1/posts/${post.id}/reactions/me`).catch(() => null),
        ]);
        if (!isMounted) return;
        const countData: any = (countRes as any)?.data || countRes || {};
        const counts = countData.countByType || {};
        const total = Number(countData.totalCount || Object.values(counts).reduce((sum: number, value: any) => sum + Number(value || 0), 0));
        setReactionCounts(counts);
        setLikeCount(total);
        const current = (myRes as any)?.data || myRes;
        const currentType = current?.type || null;
        setMyReaction(currentType);
        setIsLiked(!!currentType);
      } catch (err) {
        setLikeCount(post.likes || 0);
        setIsLiked(post.isLiked || false);
      }
    };
    loadReactions();
    return () => {
      isMounted = false;
    };
  }, [post.id, post.isLiked, post.likes]);

  const handleReaction = async (type: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const previousReaction = myReaction;
    const previousCounts = reactionCounts;
    const previousTotal = likeCount;
    const nextReaction = previousReaction === type ? null : type;

    const nextCounts = { ...reactionCounts };
    if (previousReaction) {
      nextCounts[previousReaction] = Math.max(0, Number(nextCounts[previousReaction] || 0) - 1);
    }
    if (nextReaction) {
      nextCounts[nextReaction] = Number(nextCounts[nextReaction] || 0) + 1;
    }
    setMyReaction(nextReaction);
    setReactionCounts(nextCounts);
    setLikeCount(Object.values(nextCounts).reduce((sum, value) => sum + Number(value || 0), 0));
    setIsLiked(!!nextReaction);
    try {
      if (!nextReaction) {
        await removeReaction(post.id);
      } else if (previousReaction) {
        await api.patch(`/api/v1/posts/${post.id}/reactions`, { type: nextReaction });
      } else {
        await reactToPost(post.id, { type: nextReaction });
      }
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (err) {
      console.error('Failed to update post reaction:', err);
      setMyReaction(previousReaction);
      setReactionCounts(previousCounts);
      setLikeCount(previousTotal);
      setIsLiked(!!previousReaction);
      Alert.alert('Unable to react', (err as any)?.message || 'Please try again.');
    }
  };

  const handleShowReactionSummary = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const rows = POST_REACTIONS
      .map((reaction) => `${reaction.emoji} ${reaction.label}: ${reactionCounts[reaction.type] || 0}`)
      .join('\n');
    Alert.alert('Post reactions', rows || 'No reactions yet.');
  };

  const handleComment = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowComments(true);
  };

  const handleCommentFileChange = async (e: any) => {
    if (Platform.OS !== 'web') return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      Alert.alert('Images only', 'Comments only support image attachments.');
      if (commentFileInputRef.current) commentFileInputRef.current.value = '';
      return;
    }
    setIsCommentUploading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uploadedMedia = await uploadPendingMedia({
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileType: 'IMAGE',
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        file,
      }, 'helphub/comments');
      setSelectedCommentMedia({
        id: uploadedMedia?.id || String(Math.random()),
        fileName: file.name,
        fileUrl: uploadedMedia?.fileUrl || URL.createObjectURL(file),
        fileType: 'IMAGE',
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
      });
    } catch (err) {
      console.error('Failed to upload comment file:', err);
      setSelectedCommentMedia({
        id: String(Date.now()),
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileType: 'IMAGE',
        mimeType: file.type,
        fileSize: file.size,
      });
    } finally {
      setIsCommentUploading(false);
      if (commentFileInputRef.current) commentFileInputRef.current.value = '';
    }
  };

  const handlePickCommentImage = async () => {
    if (Platform.OS === 'web') {
      commentFileInputRef.current?.click();
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo permission needed', 'Please allow photo access to attach an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.75,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const fileName = asset.fileName || `comment-image-${Date.now()}.jpg`;
    const mimeType = asset.mimeType || 'image/jpeg';
    setIsCommentUploading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uploadedMedia = await uploadPendingMedia({
        fileName,
        fileUrl: asset.uri,
        fileType: 'IMAGE',
        mimeType,
        fileSize: asset.fileSize || 0,
      }, 'helphub/comments');
      setSelectedCommentMedia({
        id: uploadedMedia?.id || String(Date.now()),
        fileName,
        fileUrl: uploadedMedia?.fileUrl || asset.uri,
        fileType: 'IMAGE',
        mimeType,
        fileSize: asset.fileSize || 0,
      });
    } catch (err) {
      console.error('Failed to upload comment image:', err);
      setSelectedCommentMedia({
        id: String(Date.now()),
        fileName,
        fileUrl: asset.uri,
        fileType: 'IMAGE',
        mimeType,
        fileSize: asset.fileSize || 0,
      });
    } finally {
      setIsCommentUploading(false);
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
            createdAt: new Date().toISOString(),
            media: mediaItem ? [mediaItem] : undefined,
            parentCommentId,
          },
        ];
        setLocalComments(newComments);
        await persistComments(newComments);
      } else {
        await addServerComment({
          postId: post.id,
          content,
          parentCommentId,
          mediaIds: mediaItem?.id ? [mediaItem.id] : undefined,
        });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
              createdAt: new Date().toISOString(),
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
          createdAt: new Date().toISOString(),
          media: mediaItem ? [mediaItem] : undefined,
          parentCommentId,
        },
      ];
      setLocalComments(newComments);
      await persistComments(newComments);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
    await refetchComments();
    await queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  const handleDeleteComment = async (comment: any) => {
    const childReplies = commentsList.filter((item: any) => item.parentCommentId === comment.id);
    Alert.alert(
      'Delete comment?',
      childReplies.length > 0
        ? `This will delete the comment and ${childReplies.length} repl${childReplies.length === 1 ? 'y' : 'ies'}.`
        : 'This will delete this comment.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const deleteIds = [comment.id, ...childReplies.map((reply: any) => reply.id)];
            try {
              await Promise.allSettled(
                deleteIds.map((commentId) => deleteComment(commentId)),
              );
              const nextLocalComments = localComments.filter((item: any) => !deleteIds.includes(item.id));
              setLocalComments(nextLocalComments);
              await persistComments(nextLocalComments);
              await refetchComments();
              await queryClient.invalidateQueries({ queryKey: ['posts'] });
            } catch (error: any) {
              Alert.alert('Unable to delete comment', error?.message || 'Please try again.');
            }
          },
        },
      ],
    );
  };

  const toggleCommentReaction = async (commentId: string, emoji: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userName = 'Me';
    setCommentReactions((prev) => {
      const msgReactions = prev[commentId] || {};
      const newMsgReactions: Record<string, string[]> = {};
      let hadSameReaction = false;
      Object.entries(msgReactions).forEach(([reactionEmoji, users]) => {
        const cleanUsers = (users as string[]).filter((u) => u !== userName);
        if (reactionEmoji === emoji && (users as string[]).includes(userName)) {
          hadSameReaction = true;
        }
        if (cleanUsers.length > 0) newMsgReactions[reactionEmoji] = cleanUsers;
      });
      if (!hadSameReaction) {
        newMsgReactions[emoji] = [...(newMsgReactions[emoji] || []), userName];
      }
      const updated = { ...prev, [commentId]: newMsgReactions };

      storage.setItemAsync(`explore_comment_reactions_${post.id}`, JSON.stringify(updated))
        .catch(err => console.error('Failed to persist comment reactions:', err));

      return updated;
    });
    setShowCommentReactionPickerId(null);
  };

  const applyMentionSuggestion = (name: string) => {
    setCommentText((current) => {
      if (!current.match(/(?:^|\s)@[^\s@]*$/)) return current;
      return current.replace(/(^|\s)@[^\s@]*$/, `$1@${name} `);
    });
  };

  const showCommentReactionSummary = async (commentId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const msgReactions = commentReactions[commentId] || {};
    const rows = POST_REACTIONS
      .map((reaction) => `${reaction.emoji} ${reaction.label}: ${(msgReactions[reaction.emoji] || []).length}`)
      .join('\n');
    Alert.alert('Comment reactions', rows || 'No reactions yet.');
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
              <Text style={[styles.timestamp, { color: theme.textSupporting }]}>
                {getRelativeTime(post.rawCreatedAt || post.timestamp)}
              </Text>
            </View>
          </Pressable>
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
        </View>

        <Pressable onPress={handleComment}>
          <Text style={[styles.content, { color: theme.text }]}>{post.content}</Text>
        </Pressable>

        <Pressable onPress={handleComment}>
          <PostMediaContainer postId={post.id} />
        </Pressable>

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
          <View style={{ position: 'relative' }}>
            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.7 }]}
              onPress={() => setShowPostReactionPicker((value) => !value)}
              onLongPress={handleShowReactionSummary}
            >
              <Text style={{ fontSize: 18 }}>
                {reactionByType(myReaction)?.emoji || '👍'}
              </Text>
              <Text style={[styles.actionText, { color: isLiked ? theme.primary : theme.textSupporting }]}>
                {reactionByType(myReaction)?.label || 'React'} {likeCount > 0 ? likeCount : ''}
              </Text>
            </Pressable>
            {showPostReactionPicker && (
              <View style={[styles.postReactionPicker, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
                {POST_REACTIONS.map((reaction) => (
                  <Pressable
                    key={reaction.type}
                    onPress={() => {
                      setShowPostReactionPicker(false);
                      handleReaction(reaction.type);
                    }}
                    style={({ pressed }) => [
                      styles.postReactionOption,
                      {
                        backgroundColor: myReaction === reaction.type ? theme.activeComponentBG || theme.highlightBG : 'transparent',
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 22 }}>{reaction.emoji}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

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
          ...(post.authorId === user?.id ? [{
            key: 'delete',
            label: 'Delete Post',
            icon: 'delete-outline' as any,
            onPress: () => {
              setIsMenuSheetVisible(false);
              Alert.alert(
                'Delete post?',
                'This will remove your post from the community feed.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await deletePost(post.id);
                        await queryClient.invalidateQueries({ queryKey: ['posts'] });
                      } catch (err) {
                        Alert.alert('Unable to delete post', (err as any)?.message || 'Please try again.');
                      }
                    },
                  },
                ],
              );
            },
          }] : []),
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
            <Text style={[styles.modalTitle, { color: theme.text }]}>Post Details</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={[styles.detailPostPreview, { borderBottomColor: theme.border }]}>
            <Text style={{ color: theme.text, fontSize: 15, lineHeight: 21 }}>{post.content}</Text>
            <PostMediaContainer postId={post.id} />
            <Text style={{ color: theme.textSupporting, fontSize: 12, marginTop: 6 }}>
              {post.author} • {getRelativeTime(post.rawCreatedAt || post.timestamp)}
            </Text>
          </View>
          <View style={styles.commentFilters}>
            {[
              { key: 'all', label: 'All' },
              { key: 'best', label: 'Best' },
              { key: 'recent', label: 'Recent' },
            ].map((option) => (
              <Pressable
                key={option.key}
                onPress={() => setCommentSort(option.key as any)}
                style={({ pressed }) => [
                  styles.commentFilterButton,
                  {
                    backgroundColor: commentSort === option.key ? theme.primary : theme.highlightBG,
                    borderColor: commentSort === option.key ? theme.primary : theme.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    color: commentSort === option.key ? '#FFFFFF' : theme.text,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
          
          <ScrollView 
            style={{ flex: 1, padding: Spacing.base }}
            contentContainerStyle={{ gap: 16, paddingBottom: 32 }}
          >
            {(() => {
              const rootComments = commentsList
                .filter((c: any) => !c.parentCommentId)
                .sort((a: any, b: any) => {
                  if (commentSort === 'recent') {
                    const bTime = new Date(b.createdAt || 0).getTime() || 0;
                    const aTime = new Date(a.createdAt || 0).getTime() || 0;
                    return bTime - aTime;
                  }
                  if (commentSort === 'best') {
                    const aScore = Object.values(commentReactions[a.id] || {}).reduce((sum: number, users: any) => sum + (Array.isArray(users) ? users.length : 0), 0);
                    const bScore = Object.values(commentReactions[b.id] || {}).reduce((sum: number, users: any) => sum + (Array.isArray(users) ? users.length : 0), 0);
                    const aReplies = commentsList.filter((c: any) => c.parentCommentId === a.id).length;
                    const bReplies = commentsList.filter((c: any) => c.parentCommentId === b.id).length;
                    return (bScore + bReplies) - (aScore + aReplies);
                  }
                  return 0;
                });
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
                                source={{ uri: resolveMediaUrl(med.fileUrl) }}
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
                              onLongPress={() => showCommentReactionSummary(item.id)}
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
                              setCommentText((current) => {
                                const mention = `@${item.authorName} `;
                                return current.trim() ? current : mention;
                              });
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

                          {(item.authorId === user?.id || user?.role === 'ADMIN') && (
                            <Pressable
                              onPress={() => handleDeleteComment(item)}
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
                              <MaterialIcons name="delete-outline" size={13} color={theme.danger} />
                              <Text style={{ fontSize: 11, color: theme.danger, fontWeight: '600' }}>Delete</Text>
                            </Pressable>
                          )}
                        </View>

                        {/* Display comment reactions count badges */}
                        {Object.keys(msgReactions).length > 0 && (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                            {Object.entries(msgReactions).map(([emoji, users]) => (
                              <Pressable
                                key={emoji}
                                onPress={() => toggleCommentReaction(item.id, emoji)}
                                onLongPress={() => showCommentReactionSummary(item.id)}
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
                                  <View style={{ position: 'relative', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <Pressable
                                      onPress={() => setShowCommentReactionPickerId(showReplyPicker ? null : reply.id)}
                                      onLongPress={() => showCommentReactionSummary(reply.id)}
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
                                    {(reply.authorId === user?.id || user?.role === 'ADMIN') && (
                                      <Pressable
                                        onPress={() => handleDeleteComment(reply)}
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
                                        <MaterialIcons name="delete-outline" size={12} color={theme.danger} />
                                        <Text style={{ fontSize: 10, color: theme.danger, fontWeight: '600' }}>Delete</Text>
                                      </Pressable>
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
                                        onLongPress={() => showCommentReactionSummary(reply.id)}
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
              accept="image/*"
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
                    source={{ uri: resolveMediaUrl(selectedCommentMedia.fileUrl) }}
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

          {mentionSuggestions.length > 0 && (
            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 12,
                backgroundColor: theme.componentBG,
                overflow: 'hidden',
              }}
            >
              {mentionSuggestions.map((author: { id: string; name: string }) => (
                <Pressable
                  key={`${author.id}-${author.name}`}
                  onPress={() => applyMentionSuggestion(author.name)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    backgroundColor: pressed ? theme.highlightBG : theme.componentBG,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.border,
                  })}
                >
                  <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>
                    @{author.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={[styles.modalInputBar, { borderTopColor: theme.border, backgroundColor: theme.appBG, paddingBottom: Platform.OS === 'ios' ? 24 : 12 }]}>
            {/* Attachment Button */}
            <Pressable
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                await handlePickCommentImage();
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
                <View style={{ marginBottom: 16 }}>
                  <Avatar uri={getProfileAvatarUrl(profileData)} name={profileData.fullName} size={80} theme={theme} />
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
            {selectedAuthorId !== user?.id && (
              <Button
                text="Direct Message"
                primary
                onPress={handleDirectMessage}
                style={{ width: '100%', borderRadius: 100 }}
                isLoading={chatLoading}
              />
            )}

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
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { data: posts, isLoading } = usePosts();
  const { mutateAsync: createPost, isPending: isCreating } = useCreatePost();
  
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedPostMedia, setSelectedPostMedia] = useState<PendingMedia[]>([]);
  const [isPostUploading, setIsPostUploading] = useState(false);
  const [authorFilter, setAuthorFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const postFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }, 10000);
    return () => clearInterval(timer);
  }, [queryClient]);

  const handlePostFileChange = async (e: any) => {
    if (Platform.OS !== 'web') return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newItems: PendingMedia[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const localUrl = URL.createObjectURL(file);
      
      let fileType = 'DOCUMENT';
      if (file.type.startsWith('image/')) fileType = 'IMAGE';
      else if (file.type.startsWith('video/')) fileType = 'VIDEO';
      else if (file.type.startsWith('audio/')) fileType = 'AUDIO';
      
      newItems.push({
        fileName: file.name,
        fileUrl: localUrl,
        fileType,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        file,
        uploadStatus: 'queued' as const,
      });
    }
    
    setSelectedPostMedia(prev => [...prev, ...newItems].slice(0, 3));
    if (postFileInputRef.current) postFileInputRef.current.value = '';
  };

  const handlePickPostMedia = async () => {
    if (Platform.OS === 'web') {
      postFileInputRef.current?.click();
      return;
    }

    if (selectedPostMedia.length >= 3) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      console.warn('Photo access is required to attach post media.');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, 3 - selectedPostMedia.length),
      quality: 0.82,
    });

    if (result.canceled || !result.assets?.length) return;

    const newItems = result.assets.slice(0, 3 - selectedPostMedia.length).map((asset) => {
      const mimeType = asset.mimeType || 'image/jpeg';
      const fileUrl = asset.uri;

      return {
        fileName: asset.fileName || `post-image-${Date.now()}.jpg`,
        fileUrl,
        fileType: 'IMAGE',
        mimeType,
        fileSize: asset.fileSize || 0,
        uploadStatus: 'queued' as const,
      };
    });

    setSelectedPostMedia(prev => [...prev, ...newItems].slice(0, 3));
  };

  const handlePickPostFile = async () => {
    if (Platform.OS === 'web') {
      postFileInputRef.current?.click();
      return;
    }
    if (selectedPostMedia.length >= 3) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return;

    const newItems = result.assets.slice(0, 3 - selectedPostMedia.length).map((asset) => {
      const mimeType = asset.mimeType || 'application/octet-stream';
      let fileType = 'DOCUMENT';
      if (mimeType.startsWith('image/')) fileType = 'IMAGE';
      else if (mimeType.startsWith('video/')) fileType = 'VIDEO';
      else if (mimeType.startsWith('audio/')) fileType = 'AUDIO';

      return {
        fileName: asset.name || `attachment-${Date.now()}`,
        fileUrl: asset.uri,
        fileType,
        mimeType,
        fileSize: asset.size || 0,
        uploadStatus: 'queued' as const,
      };
    });

    setSelectedPostMedia(prev => [...prev, ...newItems].slice(0, 3));
  };

  // Profile bottom sheet states
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
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
        rawCreatedAt: p.createdAt || p.timestamp || null,
        timestamp: getRelativeTime(p.createdAt || p.timestamp || 'Just now'),
        content: p.content || '',
        tags: p.tags || [],
        likes: p.likes || p.reactionsCount || 0,
        comments: p.comments || p.commentsCount || 0,
        isLiked: p.isLiked || false,
      }))
    : DUMMY_POSTS;

  const filteredPosts = displayPosts.filter((post: any) => {
    const authorMatch = !authorFilter.trim()
      || post.author?.toLowerCase().includes(authorFilter.trim().toLowerCase())
      || post.authorId?.toLowerCase?.().includes(authorFilter.trim().toLowerCase());
    if (!authorMatch) return false;
    if (timeFilter === 'all') return true;
    const created = post.rawCreatedAt ? new Date(post.rawCreatedAt) : null;
    if (!created || Number.isNaN(created.getTime())) return true;
    const diffMs = Date.now() - created.getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    if (timeFilter === 'today') return diffMs <= dayMs;
    if (timeFilter === 'week') return diffMs <= 7 * dayMs;
    if (timeFilter === 'month') return diffMs <= 30 * dayMs;
    return true;
  });



  const handleDirectMessage = async () => {
    if (!selectedAuthorId) return;
    if (selectedAuthorId === user?.id) {
      setAlertModal({
        visible: true,
        title: 'Direct message unavailable',
        message: 'You cannot create a direct message with yourself.',
      });
      return;
    }
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
      console.error('Failed to create private conversation:', err);
      setAlertModal({
        visible: true,
        title: 'Could not start chat',
        message: 'Please try again in a moment.',
      });
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && selectedPostMedia.length === 0) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPostUploading(true);
    try {
      const uploadedMedia: any[] = [];

      for (let index = 0; index < selectedPostMedia.length; index++) {
        const item = selectedPostMedia[index];
        setSelectedPostMedia(prev => prev.map((media, mediaIndex) =>
          mediaIndex === index ? { ...media, uploadStatus: 'uploading', error: undefined } : media
        ));

        try {
          const mediaRes = await uploadPendingMedia(item, 'helphub/posts');
          const mediaId = mediaRes?.id || mediaRes?.mediaId || mediaRes?.data?.id;
          if (!mediaId) {
            throw new Error(`Uploaded media did not return an ID for ${item.fileName}`);
          }

          uploadedMedia.push({ ...mediaRes, id: mediaId });
          setSelectedPostMedia(prev => prev.map((media, mediaIndex) =>
            mediaIndex === index
              ? { ...media, id: mediaId, fileUrl: mediaRes?.fileUrl || media.fileUrl, uploadStatus: 'uploaded' }
              : media
          ));
        } catch (uploadError) {
          setSelectedPostMedia(prev => prev.map((media, mediaIndex) =>
            mediaIndex === index
              ? { ...media, uploadStatus: 'failed', error: uploadError instanceof Error ? uploadError.message : 'Upload failed' }
              : media
          ));
          throw uploadError;
        }
      }

      const postRes: any = await createPost({
        content: newPostContent,
        visibility: 'PUBLIC',
      });
      const createdPostId = postRes?.id || postRes?.data?.id;
      if (!createdPostId) {
        throw new Error("Created post does not have a valid ID");
      }

      if (uploadedMedia.length > 0) {
        for (let index = 0; index < uploadedMedia.length; index++) {
          await api.post<any>(`/api/v1/posts/${createdPostId}/media`, {
            mediaId: uploadedMedia[index].id,
            displayOrder: index,
          });
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      await queryClient.invalidateQueries({ queryKey: ['post-media', createdPostId] });
      setNewPostContent('');
      setSelectedPostMedia([]);
      setShowCreatePost(false);
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      await queryClient.refetchQueries({ queryKey: ['posts'] });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Failed to create post with media:', err);
      Alert.alert(
        'Unable to create post',
        (err as any)?.message || 'Please check the media upload configuration and try again.',
      );
    } finally {
      setIsPostUploading(false);
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
        <View style={{ width: 44 }} />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} onAuthorPress={handleAuthorPress} />}
          ListHeaderComponent={
            <View style={[styles.feedFilters, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
              <TextInputUI
                placeholder="Filter by author name or ID..."
                value={authorFilter}
                onChangeText={setAuthorFilter}
                disableFloatingLabel
                height={40}
                containerStyle={{ marginBottom: 0 }}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {[
                  { key: 'all', label: 'All time' },
                  { key: 'today', label: 'Today' },
                  { key: 'week', label: 'This week' },
                  { key: 'month', label: 'This month' },
                ].map((option) => (
                  <Pressable
                    key={option.key}
                    onPress={() => setTimeFilter(option.key as any)}
                    style={({ pressed }) => [
                      styles.feedFilterChip,
                      {
                        backgroundColor: timeFilter === option.key ? theme.primary : theme.highlightBG,
                        borderColor: timeFilter === option.key ? theme.primary : theme.border,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Text style={{ color: timeFilter === option.key ? '#FFFFFF' : theme.text, fontWeight: '700', fontSize: 12 }}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Text style={{ color: theme.textSupporting, fontWeight: '600' }}>No posts match these filters.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Pressable
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowCreatePost(true);
        }}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.primary,
            shadowColor: theme.inverse,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <MaterialIcons name="edit" size={26} color="#FFFFFF" />
      </Pressable>

      {/* Profile Details Bottom Sheet */}
      <BottomSheet isVisible={isProfileVisible} onClose={() => setIsProfileVisible(false)}>
        {isProfileLoading ? (
          <View style={{ padding: 40, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : profileData ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <View
              style={{
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
              <Avatar uri={getProfileAvatarUrl(profileData)} name={profileData.fullName} size={80} theme={theme} />
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
            {selectedAuthorId !== user?.id && (
              <Button
                text="Direct Message"
                primary
                onPress={handleDirectMessage}
                style={{ width: '100%', borderRadius: 100 }}
              />
            )}

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
        onRequestClose={() => {
          if (!isCreating && !isPostUploading) setShowCreatePost(false);
        }}
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
            <Pressable
              onPress={() => setShowCreatePost(false)}
              disabled={isCreating || isPostUploading}
              style={{ opacity: isCreating || isPostUploading ? 0.4 : 1 }}
            >
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
              disabled={isCreating || isPostUploading || (!newPostContent.trim() && selectedPostMedia.length === 0)}
              style={({ pressed }) => [
                {
                  opacity: (isCreating || isPostUploading || (!newPostContent.trim() && selectedPostMedia.length === 0)) ? 0.5 : 1,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 82, justifyContent: 'flex-end' }}>
                {(isCreating || isPostUploading) && <ActivityIndicator size="small" color={theme.primary} />}
                <Text
                  style={{
                    color: theme.primary,
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  {isPostUploading ? 'Uploading' : isCreating ? 'Posting' : 'Post'}
                </Text>
              </View>
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

            {/* Post Media Attachment Previews */}
            {selectedPostMedia.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
                {selectedPostMedia.map((media, idx) => (
                  <View key={idx} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
                    {media.fileType === 'IMAGE' ? (
                      <Image source={{ uri: resolveMediaUrl(media.fileUrl) }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <View style={{ flex: 1, backgroundColor: theme.highlightBG, justifyContent: 'center', alignItems: 'center', padding: 8 }}>
                        <MaterialIcons name={media.fileType === 'VIDEO' ? 'movie' : media.fileType === 'AUDIO' ? 'music-note' : 'insert-drive-file'} size={32} color={theme.primary} />
                        <Text style={{ fontSize: 9, color: theme.text, textAlign: 'center', marginTop: 4 }} numberOfLines={1}>{media.fileName}</Text>
                      </View>
                    )}
                    {(media.uploadStatus === 'uploading' || (isPostUploading && media.uploadStatus !== 'uploaded' && media.uploadStatus !== 'failed')) && (
                      <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                        <ActivityIndicator size="small" color="#FFF" />
                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '600' }}>Uploading</Text>
                      </View>
                    )}
                    {media.uploadStatus === 'failed' && (
                      <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(185,28,28,0.72)', justifyContent: 'center', alignItems: 'center', padding: 6 }}>
                        <MaterialIcons name="error-outline" size={18} color="#FFF" />
                        <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '600', textAlign: 'center' }} numberOfLines={2}>Upload failed</Text>
                      </View>
                    )}
                    <Pressable
                      onPress={() => setSelectedPostMedia(prev => prev.filter((_, i) => i !== idx))}
                      disabled={isPostUploading}
                      style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}
                    >
                      <MaterialIcons name="close" size={14} color="#FFF" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Hidden file input (web only) */}
            {Platform.OS === 'web' && (
              <input
                type="file"
                ref={postFileInputRef}
                style={{ display: 'none' }}
                onChange={handlePostFileChange}
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              />
            )}

            {/* Attachment Action Bar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 16, marginTop: 12 }}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handlePickPostMedia();
                }}
                disabled={isPostUploading || selectedPostMedia.length >= 3}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    backgroundColor: theme.highlightBG,
                    borderWidth: 1,
                    borderColor: theme.border,
                    opacity: selectedPostMedia.length >= 3 ? 0.5 : 1,
                  },
                  pressed && { backgroundColor: theme.border }
                ]}
              >
                <MaterialIcons name="attach-file" size={20} color={theme.primary} />
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>
                  Attach Media ({selectedPostMedia.length}/3)
                </Text>
              </Pressable>
              <Pressable
                onPress={handlePickPostFile}
                disabled={isPostUploading || selectedPostMedia.length >= 3}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    backgroundColor: theme.highlightBG,
                    borderWidth: 1,
                    borderColor: theme.border,
                    opacity: selectedPostMedia.length >= 3 ? 0.5 : 1,
                  },
                  pressed && { backgroundColor: theme.border }
                ]}
              >
                <MaterialIcons name="insert-drive-file" size={20} color={theme.primary} />
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>
                  File
                </Text>
              </Pressable>
            </View>
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
    flexWrap: 'wrap',
    borderTopWidth: 1,
    paddingTop: Spacing.base,
    gap: Spacing.sm,
    alignItems: 'center',
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
  reactionStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    flex: 1,
  },
  reactionChip: {
    minHeight: 28,
    minWidth: 34,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  postReactionPicker: {
    position: 'absolute',
    bottom: 34,
    left: 0,
    flexDirection: 'row',
    gap: 4,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    zIndex: 40,
    elevation: 8,
  },
  postReactionOption: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPostPreview: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  commentFilters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  commentFilterButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedFilters: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  feedFilterChip: {
    minHeight: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
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
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 28,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
});
