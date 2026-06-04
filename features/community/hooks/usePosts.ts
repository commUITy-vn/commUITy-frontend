import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPosts } from '@/features/community/api/get-posts';
import { createPost } from '@/features/community/api/create-post';
import { getPostComments } from '@/features/community/api/get-post-comments';
import { createPostComment } from '@/features/community/api/create-post-comment';

export const usePosts = (params?: any) => {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: () => getPosts(params),
    refetchInterval: 10000,
    staleTime: 15000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { content: string; visibility: 'PUBLIC' | 'VOLUNTEERS_ONLY'; supportRequestId?: string }) =>
      createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const usePostComments = (postId: string) => {
  return useQuery({
    queryKey: ['post-comments', postId],
    queryFn: () => getPostComments(postId),
    enabled: !!postId,
    refetchInterval: postId ? 10000 : false,
    staleTime: 10000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
};

export const useCreatePostComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      postId,
      content,
      parentCommentId,
      mediaIds,
    }: {
      postId: string;
      content: string;
      parentCommentId?: string;
      mediaIds?: string[];
    }) =>
      createPostComment(postId, { content, parentCommentId, mediaIds }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};
