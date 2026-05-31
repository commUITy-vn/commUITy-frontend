import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as mediaApi from '../api';
import { CreateMediaRequest, UpdateMediaRequest, AttachMediaToPostRequest } from '../types';

export const useCreateMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMediaRequest) => mediaApi.createMedia(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-media'] });
    },
  });
};

export const useMediaDetails = (id: string) => {
  return useQuery({
    queryKey: ['media', id],
    queryFn: () => mediaApi.getMedia(id),
    enabled: !!id,
  });
};

export const useMyMedia = () => {
  return useQuery({
    queryKey: ['my-media'],
    queryFn: () => mediaApi.getMyMedia(),
  });
};

export const useUpdateMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMediaRequest }) =>
      mediaApi.updateMedia(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['media', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['my-media'] });
    },
  });
};

export const useDeleteMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mediaApi.deleteMedia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-media'] });
    },
  });
};

export const useAttachPostMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: AttachMediaToPostRequest }) =>
      mediaApi.attachPostMedia(postId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post-media', variables.postId] });
    },
  });
};

export const usePostMedia = (postId: string) => {
  return useQuery({
    queryKey: ['post-media', postId],
    queryFn: () => mediaApi.getPostMedia(postId),
    enabled: !!postId,
  });
};

export const useRemovePostMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, mediaId }: { postId: string; mediaId: string }) =>
      mediaApi.removePostMedia(postId, mediaId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post-media', variables.postId] });
    },
  });
};
