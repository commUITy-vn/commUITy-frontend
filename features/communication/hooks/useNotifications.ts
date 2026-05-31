import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications } from '../api/get-notifications';
import { readNotification } from '../api/read-notification';
import { readAllNotifications } from '../api/read-all-notifications';
import { stompClient } from '../api/websocket-client';
import { getAccessToken } from '@/lib/api-client';

export interface NotificationResponse {
  id: string;
  content: string;
  referenceType?: string;
  referenceId?: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const query = useQuery<any, Error>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response: any = await getNotifications();
      // Since backend controller returns ApiResponse<List<NotificationResponse>>, we extract response.data
      return response?.data || response;
    },
  });

  useEffect(() => {
    let subId: string | null = null;

    const setupWS = async () => {
      const token = await getAccessToken();
      if (!token) return;

      const handleMessage = (frame: any) => {
        try {
          const payload = JSON.parse(frame.body);
          if (payload.eventType === 'NOTIFICATION_CREATED') {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        } catch (e) {
          console.error('[WS] Notification parse error:', e);
        }
      };

      if (!stompClient.isConnected()) {
        stompClient.connect(token, () => {
          subId = stompClient.subscribe('/user/queue/notifications', handleMessage);
        });
      } else {
        subId = stompClient.subscribe('/user/queue/notifications', handleMessage);
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

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => readNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => readAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
