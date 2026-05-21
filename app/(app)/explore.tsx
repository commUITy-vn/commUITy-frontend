import { View, Text, FlatList, Image, Pressable, StyleSheet, Modal, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { BorderRadius, Spacing } from '@/constants/theme';
import { usePosts, useCreatePost, usePostComments, useCreatePostComment } from '@/features/community/hooks/usePosts';
import { TextInput as TextInputUI } from '@/components/ui';

interface Post {
  id: string;
  author: string;
  avatar: string;
  timestamp: string;
  content: string;
  tags: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
}

const DUMMY_POSTS: Post[] = [
  {
    id: '1',
    author: 'Nguyen Van A',
    avatar: 'https://i.pravatar.cc/150?img=1',
    timestamp: '2 hours ago',
    content: 'Just finished volunteering at the local food bank! It was such a rewarding experience helping families in need. #volunteering #community',
    tags: ['volunteering', 'community'],
    likes: 24,
    comments: 8,
    isLiked: false,
  },
  {
    id: '2',
    author: 'Tran Thi B',
    avatar: 'https://i.pravatar.cc/150?img=2',
    timestamp: '5 hours ago',
    content: 'Looking for volunteers to help with the upcoming charity run. We need people to manage water stations and guide runners. DM me if interested!',
    tags: ['charity', 'volunteering', 'run'],
    likes: 56,
    comments: 12,
    isLiked: true,
  },
  {
    id: '3',
    author: 'Le Van C',
    avatar: 'https://i.pravatar.cc/150?img=3',
    timestamp: '1 day ago',
    content: 'Successfully donated 500 books to the children\'s library today. Education is the foundation of a better future. Thank you everyone who contributed! 📚',
    tags: ['donation', 'education', 'books'],
    likes: 89,
    comments: 15,
    isLiked: false,
  },
  {
    id: '4',
    author: 'Pham Thi D',
    avatar: 'https://i.pravatar.cc/150?img=4',
    timestamp: '2 days ago',
    content: 'Join us this Saturday for a beach cleanup event! Bring your friends and family. Let\'s keep our environment clean together. 🌊🧹',
    tags: ['environment', 'cleanup', 'beach'],
    likes: 112,
    comments: 23,
    isLiked: true,
  },
  {
    id: '5',
    author: 'Hoang Van E',
    avatar: 'https://i.pravatar.cc/150?img=5',
    timestamp: '3 days ago',
    content: 'Just launched my new mentorship program for underprivileged students. If you\'re interested in mentoring or know someone who could benefit, please reach out!',
    tags: ['mentorship', 'education', 'community'],
    likes: 67,
    comments: 19,
    isLiked: false,
  },
];

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

const DUMMY_COMMENTS: Record<string, any[]> = {
  '1': [
    { id: 'c1', authorName: 'Tran Thi B', avatar: 'https://i.pravatar.cc/150?img=2', content: 'Great job! Wish I could have joined.', timestamp: '1 hour ago' },
    { id: 'c2', authorName: 'Le Van C', avatar: 'https://i.pravatar.cc/150?img=3', content: 'Incredible work, Nguyen Van A!', timestamp: '30 mins ago' },
  ],
  '2': [
    { id: 'c3', authorName: 'Nguyen Van A', avatar: 'https://i.pravatar.cc/150?img=1', content: 'I am down to manage the water stations!', timestamp: '4 hours ago' },
  ],
};

const PostCard = ({ post }: { post: Post }) => {
  const theme = useTheme();
  const themeStyles = useThemeStyles();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const { data: serverComments } = usePostComments(post.id);
  const { mutateAsync: addServerComment } = useCreatePostComment();
  const [localComments, setLocalComments] = useState<any[]>(DUMMY_COMMENTS[post.id] || []);

  const commentsList = [
    ...localComments,
    ...(serverComments && Array.isArray(serverComments)
      ? serverComments.map((c: any) => ({
          id: c.id || String(Math.random()),
          authorName: c.author || c.authorName || c.userName || 'User',
          avatar: c.avatar || c.authorAvatarUrl || 'https://i.pravatar.cc/150',
          content: c.content,
          timestamp: getRelativeTime(c.timestamp || c.createdAt || 'Just now'),
        }))
      : []),
  ];

  const handleLike = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLiked(!isLiked);
    setLikeCount(prevCount => (isLiked ? prevCount - 1 : prevCount + 1));
  };

  const handleComment = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowComments(true);
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const content = commentText.trim();
    setCommentText('');

    try {
      if (['1', '2', '3', '4', '5'].includes(post.id)) {
        setLocalComments(prev => [
          ...prev,
          {
            id: String(Date.now()),
            authorName: 'Me',
            avatar: 'https://i.pravatar.cc/150?img=8',
            content,
            timestamp: 'Just now',
          },
        ]);
      } else {
        await addServerComment({ postId: post.id, content });
      }
    } catch (error) {
      setLocalComments(prev => [
        ...prev,
        {
          id: String(Date.now()),
          authorName: 'Me',
          avatar: 'https://i.pravatar.cc/150?img=8',
          content,
          timestamp: 'Just now',
        },
      ]);
    }
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
          <Image source={{ uri: post.avatar }} style={[styles.avatar, { borderColor: theme.border }]} />
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: theme.text }]}>{post.author}</Text>
            <Text style={[styles.timestamp, { color: theme.textSupporting }]}>{post.timestamp}</Text>
          </View>
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
            <Text style={[styles.actionText, { color: theme.textSupporting }]}>{post.comments + localComments.length}</Text>
          </Pressable>
        </View>
      </View>

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
            {commentsList.length === 0 ? (
              <View style={{ flex: 1, paddingVertical: 40, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialIcons name="chat-bubble-outline" size={48} color={theme.textSupporting} />
                <Text style={{ color: theme.textSupporting, fontSize: 16, marginTop: 12, textAlign: 'center' }}>
                  No comments yet. Start the conversation!
                </Text>
              </View>
            ) : (
              commentsList.map((item) => (
                <View key={item.id} style={{ flexDirection: 'row', gap: 12 }}>
                  <Image source={{ uri: item.avatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                  <View style={{ flex: 1, backgroundColor: theme.highlightBG, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ fontWeight: '600', color: theme.text, fontSize: 14 }}>{item.authorName}</Text>
                      <Text style={{ fontSize: 11, color: theme.textSupporting }}>{item.timestamp}</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: theme.text, lineHeight: 20 }}>{item.content}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={[styles.modalInputBar, { borderTopColor: theme.border, backgroundColor: theme.appBG, paddingBottom: Platform.OS === 'ios' ? 24 : 12 }]}>
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
              <MaterialIcons name="send" size={24} color={commentText.trim() ? theme.primary : theme.textSupporting} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default function ExploreScreen() {
  const theme = useTheme();
  const { data: posts, isLoading } = usePosts();
  const { mutateAsync: createPost, isPending: isCreating } = useCreatePost();
  
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');

  // Temporary adapter if backend data is not perfectly matching Post type
  const displayPosts = posts && Array.isArray(posts) && posts.length > 0 
    ? posts.map((p: any) => ({
        id: p.id || String(Math.random()),
        author: p.author || p.authorName || p.userName || 'Unknown User',
        avatar: p.avatar || p.authorAvatarUrl || p.userAvatar || 'https://i.pravatar.cc/150',
        timestamp: getRelativeTime(p.timestamp || p.createdAt || 'Just now'),
        content: p.content || '',
        tags: p.tags || [],
        likes: p.likes || p.reactionsCount || 0,
        comments: p.comments || p.commentsCount || 0,
        isLiked: p.isLiked || false,
      }))
    : DUMMY_POSTS;

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
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

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
              placeholder="What is on your mind?"
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
