import { useEffect, useMemo, useRef } from 'react';
import { useSegments, useGlobalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores/useToastStore';
import { stompClient } from '../api/websocket-client';
import { getAccessToken } from '@/lib/api-client';
import { useConversations } from './useConversations';

type GlobalWebSocketsOptions = {
  isAuthenticated: boolean;
  userId?: string | null;
};

export const useGlobalWebSockets = ({ isAuthenticated, userId }: GlobalWebSocketsOptions) => {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();
  const segments = useSegments();
  const params = useGlobalSearchParams();
  const { data: conversations } = useConversations(isAuthenticated && !!userId);
  const conversationIds = useMemo(() => {
    if (!Array.isArray(conversations)) return [];
    return conversations
      .map((conversation: any) => String(conversation.id))
      .filter(Boolean)
      .sort();
  }, [conversations]);
  const conversationIdsKey = conversationIds.join(',');
  const messageHandlerRef = useRef<(frame: any) => void>(() => {});
  const notificationHandlerRef = useRef<(frame: any) => void>(() => {});
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

  // Cache route navigation objects in mutable references to avoid WebSocket subscription thrashing on every page transition
  const segmentsRef = useRef(segments);
  const paramsRef = useRef(params);

  useEffect(() => {
    segmentsRef.current = segments;
    paramsRef.current = params;
  }, [segments, params]);

  useEffect(() => {
    messageHandlerRef.current = (frame: any) => {
        try {
          const payload = JSON.parse(frame.body);
          if (payload.eventType === 'MESSAGE_CREATED' && payload.message) {
            const message = payload.message;
            const messageId = String(message.id);
            if (seenMessageIdsRef.current.has(messageId)) return;

            seenMessageIdsRef.current.add(messageId);
            if (seenMessageIdsRef.current.size > 500) {
              const first = seenMessageIdsRef.current.values().next().value;
              if (first) seenMessageIdsRef.current.delete(first);
            }

            const conversationId = String(message.conversationId);
            const isOwnMessage = String(message.senderId) === String(userId);
            const currentSegments = segmentsRef.current;
            const currentParams = paramsRef.current;

            // Dynamically check if the user is already inside the active chat room for this message using stable cached refs
            const inActiveChatRoom =
              currentSegments.length >= 2 &&
              currentSegments[0] === 'messages' &&
              String(currentParams.id) === conversationId;

            queryClient.setQueryData(['messages', conversationId], (old: any) => {
              if (!old && !inActiveChatRoom) return old;
              const list = old || [];
              if (list.some((msg: any) => msg.id === message.id)) return list;
              return [...list, message];
            });

            queryClient.setQueryData(['conversations'], (old: any) => {
              if (!Array.isArray(old)) return old;

              const updated = old.map((conversation: any) => {
                if (String(conversation.id) !== conversationId) return conversation;

                const nextUnreadCount = isOwnMessage || inActiveChatRoom
                  ? 0
                  : (conversation.unreadCount || 0) + 1;

                return {
                  ...conversation,
                  lastMessageId: message.id,
                  lastMessageContent: message.content,
                  lastMessageCreatedAt: message.createdAt,
                  updatedAt: message.createdAt || conversation.updatedAt,
                  unreadCount: nextUnreadCount,
                };
              });

              return updated.sort((a: any, b: any) => {
                const aTime = new Date(a.lastMessageCreatedAt || a.updatedAt || a.createdAt || 0).getTime();
                const bTime = new Date(b.lastMessageCreatedAt || b.updatedAt || b.createdAt || 0).getTime();
                return bTime - aTime;
              });
            });

            // Refetch in the background after the optimistic cache patch to pick up server-derived fields.
            queryClient.invalidateQueries({ queryKey: ['conversations'] });

            if (inActiveChatRoom) {
              queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
            } else if (!isOwnMessage) {
              // Trigger in-app Toast notification alert
              showToast({
                title: message.senderName || 'New Message',
                description: message.content || 'Sent an attachment',
                type: 'message',
                referenceType: 'CONVERSATION',
                referenceId: conversationId,
                actionUrl: `/messages/${conversationId}`,
              });
            }
          }
        } catch (err) {
          console.error('[WS-Global] Failed to parse message frame body:', err);
        }
      };

    notificationHandlerRef.current = (frame: any) => {
        try {
          const payload = JSON.parse(frame.body);
          if (payload.eventType === 'NOTIFICATION_CREATED' && payload.notification) {
            const notification = payload.notification;

            // Always update the notifications list background cache
            queryClient.invalidateQueries({ queryKey: ['notifications'] });

            // Display in-app Toast notification alert
            showToast({
              title: 'New Notification',
              description: notification.content || 'You have a new update',
              type: 'notification',
              referenceType: notification.referenceType,
              referenceId: notification.referenceId,
              actionUrl: notification.actionUrl,
            });
          }
        } catch (err) {
          console.error('[WS-Global] Failed to parse notification frame body:', err);
        }
      };
  }, [queryClient, showToast, userId]);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      stompClient.disconnect();
      return;
    }

    let messageSubId: string | null = null;
    let notificationSubId: string | null = null;

    const setupGlobalWS = async () => {
      const token = await getAccessToken();
      if (!token) return;

      // Connect STOMP client (supports multiple queueing gracefully)
      stompClient.connect(
        token,
        () => {
          messageSubId = stompClient.subscribe('/user/queue/messages', (frame) => messageHandlerRef.current(frame));
          notificationSubId = stompClient.subscribe('/user/queue/notifications', (frame) => notificationHandlerRef.current(frame));
        },
        (err) => {
          console.error('[WS-Global] Stomp Client handshake failed:', err);
        }
      );
    };

    setupGlobalWS();

    return () => {
      if (messageSubId) stompClient.unsubscribe(messageSubId);
      if (notificationSubId) stompClient.unsubscribe(notificationSubId);
    };
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (!isAuthenticated || !userId || conversationIds.length === 0) return;

    let topicSubIds: string[] = [];
    const setupTopicSubscriptions = async () => {
      const token = await getAccessToken();
      if (!token) return;

      const subscribeToConversationTopics = () => {
        topicSubIds = conversationIds.map((conversationId) => {
          const destination = `/topic/conversations/${conversationId}/messages`;
          return stompClient.subscribe(destination, (frame) => messageHandlerRef.current(frame));
        });
      };

      if (!stompClient.isConnected()) {
        stompClient.connect(token, subscribeToConversationTopics);
      } else {
        subscribeToConversationTopics();
      }
    };

    setupTopicSubscriptions();

    return () => {
      topicSubIds.forEach((subId) => stompClient.unsubscribe(subId));
    };
  }, [isAuthenticated, userId, conversationIdsKey]);
};
