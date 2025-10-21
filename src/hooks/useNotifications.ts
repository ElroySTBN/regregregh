import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      try {
        const permission = await Notification.requestPermission();
        setPermission(permission);
        
        if (permission === 'granted') {
          // Subscribe to push notifications for new messages and orders
          const registration = await navigator.serviceWorker.ready;
          
          // Listen for new messages
          supabase
            .channel('messages-notifications')
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
              },
              (payload) => {
                if (payload.new && !payload.new.is_from_admin) {
                  registration.showNotification('Nouveau message - FlashGrade', {
                    body: `Message de ${payload.new.telegram_username || 'un utilisateur'}`,
                    icon: '/pwa-192x192.png',
                    badge: '/pwa-192x192.png',
                    tag: 'new-message',
                    requireInteraction: false,
                    data: { url: '/admin' }
                  });
                }
              }
            )
            .subscribe();

          // Listen for new orders
          supabase
            .channel('orders-notifications')
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'orders'
              },
              (payload) => {
                if (payload.new) {
                  registration.showNotification('Nouvelle commande - FlashGrade', {
                    body: `Commande ${payload.new.work_type} - ${payload.new.pages} pages`,
                    icon: '/pwa-192x192.png',
                    badge: '/pwa-192x192.png',
                    tag: 'new-order',
                    requireInteraction: true,
                    data: { url: '/admin' }
                  });
                }
              }
            )
            .subscribe();
        }
        
        return permission;
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return 'denied';
      }
    }
    return 'default';
  };

  return {
    permission,
    requestPermission,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator
  };
};
