import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, DollarSign, Link as LinkIcon, Gift } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCouple } from '../contexts/CoupleContext';
import { useAuth } from '../contexts/AuthContext';
import { GiftIdea } from '../types';
import toast from 'react-hot-toast';

interface GiftFormProps {
  gift?: GiftIdea;
  onClose: () => void;
  onSuccess: () => void;
}

export function GiftForm({ gift, onClose, onSuccess }: GiftFormProps) {
  const { couple, members } = useCouple();
  const { user } = useAuth();
  
  const partnerId = Object.keys(members).find(id => id !== user?.id);

  const [title, setTitle] = useState(gift?.title || '');
  const [description, setDescription] = useState(gift?.description || '');
  const [price, setPrice] = useState(gift?.price?.toString() || '');
  const [link, setLink] = useState(gift?.link || '');
  const [intendedForId, setIntendedForId] = useState(gift?.intended_for_id || user?.id || '');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!intendedForId && user) {
      setIntendedForId(user.id);
    }
  }, [user, intendedForId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !couple || !user) return;
    
    setLoading(true);

    const giftData = {
      couple_id: couple.id,
      title: title.trim(),
      description: description.trim() || null,
      price: price ? parseFloat(price.replace(',', '.')) : null,
      link: link.trim() || null,
      intended_for_id: intendedForId,
    };

    try {
      if (gift) {
        const { error } = await supabase
          .from('gift_ideas')
          .update({ ...giftData, updated_at: new Date().toISOString() })
          .eq('id', gift.id);
          
        if (error) throw error;
        toast.success('Presente atualizado!');
      } else {
        const { error } = await supabase
          .from('gift_ideas')
          .insert([{
            ...giftData,
            created_by_id: user.id,
            is_purchased: false
          }]);
          
        if (error) throw error;
        toast.success('Ideia de presente adicionada!');
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar presente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
          className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, y: 100, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-stone-100 shrink-0">
            <h2 className="text-xl font-semibold text-stone-900 flex items-center gap-2">
              <Gift size={20} className="text-orange-500" />
              {gift ? 'Editar Ideia de Presente' : 'Nova Ideia de Presente'}
            </h2>
            <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto p-4 sm:p-6">
            <form id="gift-form" onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-4">
                <label className="text-sm font-semibold text-stone-900 block">Para quem é este presente?</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIntendedForId(user?.id || '')}
                    className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all ${
                      intendedForId === user?.id
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    Para mim
                  </button>
                  <button
                    type="button"
                    onClick={() => setIntendedForId(partnerId || '')}
                    disabled={!partnerId}
                    className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all ${
                      intendedForId === partnerId
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : !partnerId 
                        ? 'border-stone-100 bg-stone-50 text-stone-400 cursor-not-allowed opacity-50'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    Para {partnerId ? (members[partnerId]?.name?.split(' ')[0] || 'Meu par') : 'Meu par'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700 mb-1 block">O que é?</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Fone de ouvido, Livro de receitas..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700 mb-1 block">Descrição (opcional)</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Tamanho, cor, onde encontrar..."
                  rows={3}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-1 block">Preço Aproximado (opcional)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <input 
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700 mb-1 block">Link (opcional)</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <input 
                      type="url"
                      value={link}
                      onChange={e => setLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="p-4 sm:p-6 border-t border-stone-100 bg-stone-50/50 shrink-0">
            <button 
              type="submit"
              form="gift-form"
              disabled={loading || !title.trim()}
              className="w-full bg-stone-900 text-white rounded-xl py-3.5 font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : gift ? 'Atualizar Presente' : 'Salvar Presente'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
