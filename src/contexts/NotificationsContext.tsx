import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useCouple } from './CoupleContext';
import { AppNotification } from '../types';
import toast from 'react-hot-toast';

interface NotificationsContextData {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextData>({} as NotificationsContextData);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { couple, members } = useCouple();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user || !couple) {
      setNotifications([]);
      return;
    }

    fetchNotifications();

    // Request native notification permission if supported
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as AppNotification;
          setNotifications(prev => [newNotif, ...prev]);
          
          // Optionally show a toast for new notifications if actor exists in members
          const rawName = members[newNotif.actor_id]?.name;
          const actorName = (rawName && rawName !== 'Seu par' && rawName !== 'Alguém') ? rawName.split(' ')[0] : 'Seu par';
          let message = '';
          switch (newNotif.type) {
            case 'plan_added': message = `${actorName} adicionou um novo plano!`; break;
            case 'plan_scheduled': message = `${actorName} agendou um plano!`; break;
            case 'plan_completed': message = `${actorName} concluiu um plano!`; break;
            case 'comment_added': message = `${actorName} comentou em um plano!`; break;
            default: message = `Nova notificação de ${actorName}`;
          }
          toast(message, { icon: '🔔' });

          // Also trigger a native browser notification if granted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Together', {
              body: message,
              icon: '/icon.svg',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications(prev => 
            prev.map(n => n.id === payload.new.id ? { ...n, ...payload.new } : n)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, couple, members]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    // Fallback: don't break if table doesn't exist yet
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (!error && data) {
        setNotifications(data);
      }
    } catch (err) {
    }
  };

  const markAsRead = async (id: string) => {
    // Optimistic UI
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
