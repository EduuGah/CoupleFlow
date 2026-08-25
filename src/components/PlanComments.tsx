import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Send, Trash2, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCouple } from '../contexts/CoupleContext';
import { PlanComment } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PlanCommentsProps {
  planId: string;
}

export function PlanComments({ planId }: PlanCommentsProps) {
  const [comments, setComments] = useState<PlanComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const { user } = useAuth();
  const { members } = useCouple();
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setComments(data as PlanComment[]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
    }
  }, [planId]);

  useEffect(() => {
    setLoading(true);
    fetchComments().finally(() => setLoading(false));

    const channel = supabase
      .channel(`comments-${planId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `plan_id=eq.${planId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [planId, fetchComments]);

  const formatCommentTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return format(d, "HH:mm", { locale: ptBR });
    } catch {
      return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content || !user || sending) return;

    setSending(true);

    const payload = {
      plan_id: planId,
      user_id: user.id,
      content,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('comments')
      .insert([payload])
      .select();
    
    if (error) {
      alert(`Erro ao salvar comentário: ${error.message}`);
    } else {
      setNewComment('');
      if (data && data[0]) {
        setComments(prev => {
          if (prev.some(c => c.id === data[0].id)) return prev;
          return [...prev, data[0] as PlanComment];
        });
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
        fetchComments();
      }
    }
    
    setSending(false);
  };

  const handleDelete = async (commentId: string) => {
    if (confirm('Excluir este comentário?')) {
      setComments(prev => prev.filter(c => c.id !== commentId));
      await supabase.from('comments').delete().eq('id', commentId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Messages List */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto px-1 py-2">
        {comments.length === 0 ? (
          <p className="text-center text-sm text-stone-400 py-4">
            Nenhum comentário ainda. Comece a planejar!
          </p>
        ) : (
          comments.map((comment) => {
            const isMe = comment.user_id === user?.id;
            const author = members[comment.user_id];
            const authorName = isMe ? 'Você' : (author?.name || author?.email?.split('@')[0] || 'Parceiro(a)');
            
            return (
              <div key={comment.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {author?.avatar_url ? (
                    <img src={author.avatar_url} alt={authorName} className="w-full h-full object-cover" />
                  ) : (
                    <User size={14} className="text-stone-400" />
                  )}
                </div>
                
                {/* Bubble */}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  <div className="flex items-baseline gap-2 mb-1 mx-1">
                    <span className="text-[11px] font-medium text-stone-500">{authorName}</span>
                    <span className="text-[10px] text-stone-400">
                      {formatCommentTime(comment.created_at)}
                    </span>
                  </div>
                  
                  <div className={`relative group px-4 py-2.5 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-orange-500 text-white rounded-tr-sm' 
                      : 'bg-white border border-stone-200 text-stone-700 rounded-tl-sm shadow-sm'
                  }`}>
                    <p className="whitespace-pre-wrap break-words">{comment.content}</p>
                    
                    {/* Delete button (only for author) */}
                    {isMe && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Excluir comentário"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escreva um comentário..."
          className="w-full px-4 py-3 pr-12 rounded-2xl bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors resize-none overflow-hidden min-h-[50px] max-h-[120px]"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || sending}
          className="absolute right-2 bottom-2 p-2 rounded-xl bg-orange-500 text-white disabled:opacity-50 disabled:bg-stone-200 hover:bg-orange-600 transition-colors flex items-center justify-center"
        >
          <Send size={16} className={sending ? "animate-pulse" : ""} />
        </button>
      </form>
    </div>
  );
}
