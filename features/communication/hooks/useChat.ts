import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMessages } from '../api/get-messages';
import { sendMessage as apiSendMessage } from '../api/send-message';
import { stompClient } from '../api/websocket-client';
import { getAccessToken } from '@/lib/api-client';

export const useChat = (conversationId: string) => {
  const queryClient = useQueryClient();

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

  // Connect & subscribe to WS
  useEffect(() => {
    if (!conversationId) return;

    let subId: string | null = null;

    const setupWS = async () => {
      const token = await getAccessToken();
      if (!token) return;

      const handleMessage = (frame: any) => {
        try {
          const payload = JSON.parse(frame.body);
          if (payload.eventType === 'MESSAGE_CREATED' && payload.message) {
            const message = payload.message;
            if (String(message.conversationId) === String(conversationId)) {
              queryClient.setQueryData(queryKey, (old: any) => {
                const list = old || [];
                if (list.some((msg: any) => msg.id === message.id)) return list;
                return [...list, message];
              });
              queryClient.invalidateQueries({ queryKey: ['conversations'] });
            }
          }
        } catch (e) {
          console.error('[WS] Failed to parse realtime message frame body:', e);
        }
      };

      if (!stompClient.isConnected()) {
        stompClient.connect(
          token,
          () => {
            console.log('[WS] Connected successfully, subscribing to /user/queue/messages');
            subId = stompClient.subscribe('/user/queue/messages', handleMessage);
          },
          (err) => {
            console.error('[WS] STOMP Client connection error:', err);
          }
        );
      } else {
        console.log('[WS] Already connected, subscribing to /user/queue/messages');
        subId = stompClient.subscribe('/user/queue/messages', handleMessage);
      }
    };

    setupWS();

    return () => {
      if (subId) {
        stompClient.unsubscribe(subId);
      }
    };
  }, [conversationId, queryClient]);

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
