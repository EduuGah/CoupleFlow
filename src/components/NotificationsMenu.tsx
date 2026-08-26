import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Circle } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationsContext';
import { useCouple } from '../contexts/CoupleContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export function NotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { members } = useCouple();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (id: string, planId: string) => {
    markAsRead(id);
    setIsOpen(false);
    navigate(`/plans/${planId}`);
  };

  const getNotificationText = (type: string, actorName: string) => {
    const firstName = (actorName && actorName !== 'Seu amor' && actorName !== 'Alguém') ? actorName.split(' ')[0] : 'Seu amor';
    switch (type) {
      case 'plan_added': return `${firstName} adicionou um novo plano`;
      case 'plan_scheduled': return `${firstName} planejou uma data`;
      case 'plan_completed': return `${firstName} marcou um plano como concluído`;
      case 'comment_added': return `${firstName} comentou num plano`;
      case 'photo_added': return `${firstName} adicionou uma foto`;
      default: return `Nova notificação de ${firstName}`;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 transition-all rounded-full ${
          isOpen 
            ? 'bg-stone-100 text-stone-900 shadow-inner' 
            : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 shadow-sm border border-stone-200/60'
        }`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 md:right-auto md:left-0 mt-2 w-80 bg-white border border-stone-200 shadow-xl rounded-2xl overflow-hidden z-50 origin-top-right md:origin-top-left"
          >
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <h3 className="font-semibold text-stone-900">Notificações</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <Check size={14} /> Marcar lidas
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-stone-500 text-sm">
                  <Bell size={24} className="mx-auto mb-2 text-stone-300" />
                  Nenhuma notificação por enquanto
                </div>
              ) : (
                <div className="divide-y divide-stone-50">
                  {notifications.map(notif => {
                    const actorName = members[notif.actor_id]?.name || 'Seu amor';
                    const avatar = members[notif.actor_id]?.avatar_url;
                    const date = new Date(notif.created_at);

                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.id, notif.plan_id)}
                        className={`w-full text-left p-4 hover:bg-stone-100 transition-colors flex gap-3 ${!notif.is_read ? 'bg-orange-50' : ''}`}
                      >
                        <div className="shrink-0 relative mt-1">
                          {avatar ? (
                            <img loading="lazy" decoding="async" src={avatar} alt={actorName} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                              {actorName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {!notif.is_read && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notif.is_read ? 'font-medium text-stone-900' : 'text-stone-700'}`}>
                            {getNotificationText(notif.type, actorName)}
                          </p>
                          <span className="text-xs text-stone-500 mt-1 block">
                            {format(date, "dd MMM 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
