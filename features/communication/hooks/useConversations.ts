import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getConversations } from '@/features/communication/api/get-conversations';
import { stompClient } from '@/features/communication/api/websocket-client';
import { getAccessToken } from '@/lib/api-client';

export const useConversations = () => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations(),
  });

  useEffect(() => {
    let subId: string | null = null;

    const setupWS = async () => {
      const token = await getAccessToken();
      if (!token) return;

      const handleMessage = (frame: any) => {
        try {
          const payload = JSON.parse(frame.body);
          if (payload.eventType === 'MESSAGE_CREATED') {
            console.log('[WS] Inbox received new message event, invalidating cache...');
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
          }
        } catch (e) {
          console.error('[WS] Inbox realtime parse error:', e);
        }
      };

      if (!stompClient.isConnected()) {
        stompClient.connect(token, () => {
          subId = stompClient.subscribe('/user/queue/messages', handleMessage);
        });
      } else {
        subId = stompClient.subscribe('/user/queue/messages', handleMessage);
      }
    };

    setupWS();

    return () => {
      if (subId) {
        stompClient.unsubscribe(subId);
      }
    };
  }, [queryClient]);

  return query;
};
