import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMessages } from '../api/get-messages';
import { sendMessage as apiSendMessage } from '../api/send-message';
import { markMessageRead } from '../api/mark-message-read';

export const useChat = (conversationId: string, currentUserId?: string) => {
  const queryClient = useQueryClient();
  const lastMarkedReadMessageRef = useRef<string | null>(null);

  const queryKey = ['messages', conversationId];

  // Fetch messages
  const { data: historyMessages, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getMessages(conversationId),
    enabled: !!conversationId,
  });

  // Mutate message sending
  const sendMutation = useMutation({
    mutationFn: (data: { content: string; mediaIds?: string[] }) => apiSendMessage(conversationId, data),
    onSuccess: (newMessage: any) => {
      // Optimistically append the new sent message if not already done by websocket
      queryClient.setQueryData(queryKey, (old: any) => {
        const list = old || [];
        if (list.some((msg: any) => msg.id === newMessage.id)) return list;
        return [...list, newMessage];
      });
      // Invalidate conversations list so the last message is updated
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Mutate message read status
  const readMutation = useMutation({
    mutationFn: (messageId: string) => markMessageRead(conversationId, messageId),
    onSuccess: () => {
      queryClient.setQueryData(['conversations'], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((conversation: any) => (
          String(conversation.id) === String(conversationId)
            ? { ...conversation, unreadCount: 0 }
            : conversation
        ));
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Automatically mark last message as read if it is from another user
  useEffect(() => {
    if (!historyMessages || historyMessages.length === 0 || !currentUserId) return;

    const lastMsg = historyMessages[historyMessages.length - 1];
    if (lastMsg.senderId !== currentUserId && lastMarkedReadMessageRef.current !== lastMsg.id) {
      lastMarkedReadMessageRef.current = lastMsg.id;
      readMutation.mutate(lastMsg.id);
    }
  }, [historyMessages, currentUserId, readMutation]);


  const sendMessage = async (content: string, mediaIds?: string[]) => {
    await sendMutation.mutateAsync({ content, mediaIds });
  };

  return {
    messages: historyMessages || [],
    isLoading,
    error,
    sendMessage,
    isSending: sendMutation.isPending,
  };
};
