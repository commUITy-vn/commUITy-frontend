import { View, Text, FlatList, Image, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
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

  const handleLike = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleComment = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
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
            name={post.isLiked ? 'favorite' : 'favorite-border'}
            size={20}
            color={post.isLiked ? theme.danger : theme.icon}
          />
          <Text style={[styles.actionText, { color: theme.textSupporting }]}>{post.likes}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.7 }]}
          onPress={handleComment}
        >
          <MaterialIcons name="chat-bubble-outline" size={20} color={theme.icon} />
          <Text style={[styles.actionText, { color: theme.textSupporting }]}>{post.comments}</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default function ExploreScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.appBG }]}>
      <FlatList
        data={DUMMY_POSTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    gap: Spacing.xl,
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
});
