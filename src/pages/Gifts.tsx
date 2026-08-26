import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Gift, CheckCircle2, Circle, MoreVertical, Trash2, Edit2, Link as LinkIcon, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCouple } from '../contexts/CoupleContext';
import { useAuth } from '../contexts/AuthContext';
import { GiftIdea } from '../types';
import { EmptyState } from '../components/EmptyState';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlansListSkeleton } from '../components/Skeletons';
import { GiftForm } from '../components/GiftForm';
import toast from 'react-hot-toast';

export function Gifts() {
  const { couple, members } = useCouple();
  const { user } = useAuth();
  const [gifts, setGifts] = useState<GiftIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<GiftIdea | undefined>();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'me' | 'partner'>('me');
  const partnerId = Object.keys(members).find(id => id !== user?.id);

  const fetchGifts = async () => {
    if (!couple) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('gift_ideas')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setGifts(data as GiftIdea[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGifts();

    if (!couple) return;

    const channel = supabase
      .channel('gifts-list-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gift_ideas',
          filter: `couple_id=eq.${couple.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setGifts((current) => {
              if (current.some(g => g.id === payload.new.id)) return current;
              return [payload.new as GiftIdea, ...current];
            });
          } else if (payload.eventType === 'UPDATE') {
            setGifts((current) =>
              current.map((g) => (g.id === payload.new.id ? { ...g, ...payload.new } as GiftIdea : g))
            );
          } else if (payload.eventType === 'DELETE') {
            setGifts((current) => current.filter((g) => g.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple]);

  const togglePurchased = async (gift: GiftIdea) => {
    const newStatus = !gift.is_purchased;
    
    // Optimistic update
    setGifts(gifts.map(g => g.id === gift.id ? { ...g, is_purchased: newStatus } : g));
    
    const { error } = await supabase
      .from('gift_ideas')
      .update({ is_purchased: newStatus })
      .eq('id', gift.id);

    if (error) {
      toast.error('Erro ao atualizar presente');
      setGifts(gifts.map(g => g.id === gift.id ? { ...g, is_purchased: gift.is_purchased } : g));
    }
    setOpenMenuId(null);
  };

  const deleteGift = async (id: string) => {
    setGifts(gifts.filter(g => g.id !== id));
    await supabase.from('gift_ideas').delete().eq('id', id);
    setOpenMenuId(null);
  };

  const openEdit = (gift: GiftIdea) => {
    setEditingGift(gift);
    setIsFormOpen(true);
    setOpenMenuId(null);
  };

  const filteredGifts = useMemo(() => {
    if (activeTab === 'me') {
      return gifts.filter(g => g.intended_for_id === user?.id);
    } else {
      return gifts.filter(g => g.intended_for_id !== user?.id);
    }
  }, [gifts, activeTab, user]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-24 relative">
      <header className="pt-8 pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Presentes</h1>
        <button 
          onClick={() => { setEditingGift(undefined); setIsFormOpen(true); }} 
          className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center hover:bg-orange-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
        </button>
      </header>

      <div className="flex bg-stone-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('me')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'me' 
              ? 'bg-white text-stone-900 shadow-sm' 
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Para mim
        </button>
        <button
          onClick={() => setActiveTab('partner')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'partner' 
              ? 'bg-white text-stone-900 shadow-sm' 
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Para {partnerId ? (members[partnerId]?.name?.split(' ')[0] || 'meu par') : 'meu par'}
        </button>
      </div>

      {loading ? (
        <PlansListSkeleton />
      ) : filteredGifts.length === 0 ? (
        <EmptyState
          icon={<Gift size={48} />}
          title="Nenhuma ideia de presente"
          description={activeTab === 'me' ? "Você ainda não adicionou nada que gostaria de ganhar." : "Nenhuma ideia de presente para seu par adicionada ainda."}
          action={<button onClick={() => setIsFormOpen(true)} className="px-4 py-2 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors">Adicionar Ideia</button>}
        />
      ) : (
        <div className="space-y-3">
          {filteredGifts.map(gift => (
            <div key={gift.id} className={`bg-white border ${gift.is_purchased ? 'border-green-200/60 bg-green-50/30' : 'border-stone-200/60'} rounded-2xl p-4 shadow-sm flex gap-4 relative`}>
              <button 
                onClick={() => togglePurchased(gift)} 
                className={`mt-1 shrink-0 transition-colors ${
                  gift.is_purchased ? 'text-green-500' : 'text-stone-300 hover:text-green-500'
                }`}
                title={gift.is_purchased ? 'Marcar como não comprado' : 'Marcar como comprado'}
              >
                {gift.is_purchased ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={`font-medium truncate ${gift.is_purchased ? 'text-stone-500 line-through' : 'text-stone-900'}`}>
                    {gift.title}
                  </h3>
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === gift.id ? null : gift.id)} 
                    className="p-1 text-stone-400 hover:text-stone-600 rounded-md"
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
                
                {gift.description && (
                  <p className="text-sm text-stone-500 mt-1 line-clamp-2">{gift.description}</p>
                )}
                
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {gift.price && (
                    <span className="text-xs font-medium text-stone-700 bg-stone-100 px-2 py-1 rounded-md">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gift.price)}
                    </span>
                  )}
                  {gift.link && (
                    <a 
                      href={gift.link.startsWith('http') ? gift.link : `https://${gift.link}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-md flex items-center gap-1 hover:bg-orange-100 transition-colors"
                    >
                      <LinkIcon size={12} /> Acessar Link
                    </a>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-2 text-xs text-stone-400">
                  {(() => {
                    const isMe = gift.created_by_id === user?.id;
                    const author = isMe ? 'Você' : (members[gift.created_by_id]?.name || 'Parceiro(a)');
                    const avatar = members[gift.created_by_id]?.avatar_url;
                    
                    return (
                      <>
                        {avatar ? (
                          <img loading="lazy" decoding="async" src={avatar} alt={author} className="w-4 h-4 rounded-full" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-stone-100 flex items-center justify-center text-[8px] text-stone-500">
                            <User size={10} />
                          </div>
                        )}
                        <span className="font-medium text-stone-500">Adicionado por {author}</span>
                        <span>&middot;</span>
                        <span>{formatDistanceToNow(new Date(gift.created_at), { addSuffix: true, locale: ptBR })}</span>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              {openMenuId === gift.id && (
                <div className="absolute top-12 right-4 bg-white border border-stone-200 rounded-xl shadow-lg p-1 z-10 min-w-[150px] flex flex-col">
                  <button 
                    onClick={() => togglePurchased(gift)} 
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg"
                  >
                    {gift.is_purchased ? <><Circle size={14} /> Não Comprado</> : <><CheckCircle2 size={14} /> Comprado</>}
                  </button>
                  <div className="h-px bg-stone-100 my-1"></div>
                  <button 
                    onClick={() => openEdit(gift)} 
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg"
                  >
                    <Edit2 size={14} /> Editar
                  </button>
                  <button 
                    onClick={() => deleteGift(gift.id)} 
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={14} /> Excluir
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <GiftForm 
          gift={editingGift} 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={() => { setIsFormOpen(false); fetchGifts(); }} 
        />
      )}
    </motion.div>
  );
}
