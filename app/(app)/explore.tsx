import { View, Text, FlatList, Image, Pressable, StyleSheet, Modal, TextInput } from 'react-native';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { BorderRadius, Spacing } from '@/constants/theme';

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

const PostCard = ({ post }: { post: Post }) => {
  const theme = useTheme();
  const themeStyles = useThemeStyles();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleLike = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLiked(!isLiked);
    setLikeCount(prevCount => (isLiked ? prevCount - 1 : prevCount + 1));
  };

  const handleComment = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowComments(true);
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
            <Text style={[styles.actionText, { color: theme.textSupporting }]}>{post.comments}</Text>
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
          <View style={{ flex: 1, padding: Spacing.base, justifyContent: 'center', alignItems: 'center' }}>
            <MaterialIcons name="chat-bubble-outline" size={48} color={theme.textSupporting} />
            <Text style={{ color: theme.textSupporting, fontSize: 16, marginTop: 12, textAlign: 'center' }}>
              Comments functionality coming soon!
            </Text>
          </View>
          <View style={[styles.modalInputBar, { borderTopColor: theme.border, backgroundColor: theme.appBG }]}>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.highlightBG, color: theme.text, borderColor: theme.border }]}
              placeholder="Add a comment..."
              placeholderTextColor={theme.placeholderText}
              value={commentText}
              onChangeText={setCommentText}
            />
            <Pressable
              onPress={async () => {
                if (commentText.trim()) {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCommentText('');
                }
              }}
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

import { usePosts } from '@/features/community/hooks/usePosts';
import { ActivityIndicator } from 'react-native';

export default function ExploreScreen() {
  const theme = useTheme();
  const { data: posts, isLoading } = usePosts();

  // Temporary adapter if backend data is not perfectly matching Post type
  const displayPosts = posts && Array.isArray(posts) && posts.length > 0 
    ? posts.map((p: any) => ({
        id: p.id || String(Math.random()),
        author: p.author || p.userName || 'Unknown User',
        avatar: p.avatar || p.userAvatar || 'https://i.pravatar.cc/150',
        timestamp: p.timestamp || p.createdAt || 'Just now',
        content: p.content || '',
        tags: p.tags || [],
        likes: p.likes || p.reactionsCount || 0,
        comments: p.comments || p.commentsCount || 0,
        isLiked: p.isLiked || false,
      }))
    : DUMMY_POSTS;

  return (
    <View style={[styles.container, { backgroundColor: theme.appBG }]}>
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
