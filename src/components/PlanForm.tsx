import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCouple } from '../contexts/CoupleContext';
import { useAuth } from '../contexts/AuthContext';
import { Plan, PlanCategory, PlanPriority, DEFAULT_CATEGORIES } from '../types';

interface PlanFormProps {
  plan?: Plan;
  onClose: () => void;
  onSuccess: () => void;
}

const PRIORITIES: PlanPriority[] = ['baixa', 'media', 'alta'];

export function PlanForm({ plan, onClose, onSuccess }: PlanFormProps) {
  const { couple } = useCouple();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(plan?.title || '');
  const [description, setDescription] = useState(plan?.description || '');
  const [category, setCategory] = useState<PlanCategory>(plan?.category || 'Outros');
  const [priority, setPriority] = useState<PlanPriority>(plan?.priority || 'media');

  const formatForInput = (isoString?: string | null) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day}T${h}:${min}`;
  };
  const [plannedDate, setPlannedDate] = useState(formatForInput(plan?.planned_date));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couple || !user) return;
    setLoading(true);
    setError(null);

    try {
      const payload = {
        title,
        description: description || null,
        category,
        priority,
        planned_date: plannedDate ? new Date(plannedDate).toISOString() : null,
      };

      if (plan) {
        const { error: updateError } = await supabase
          .from('plans')
          .update(payload)
          .eq('id', plan.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('plans')
          .insert({
            ...payload,
            couple_id: couple.id,
            created_by_id: user.id,
            status: 'quero_fazer'
          });
        if (insertError) throw insertError;
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar o plano.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-stone-100 shrink-0">
          <h2 className="font-semibold text-lg text-stone-900">{plan ? 'Editar Plano' : 'Novo Plano'}</h2>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-700 bg-stone-50 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">O que vamos fazer?</label>
            <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Jantar no italiano" className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Detalhes (Opcional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Adicione notas, links, etc..." rows={3} className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Data e Hora Planejada (Opcional)</label>
            <div className="flex gap-2">
              <input 
                type="datetime-local" 
                value={plannedDate}
                onChange={e => setPlannedDate(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />
              {plannedDate && (
                <button 
                  type="button" 
                  onClick={() => setPlannedDate('')}
                  className="px-4 py-3 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
                >
                  Remover
                </button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Categoria</label>
              <select value={category} onChange={e => setCategory(e.target.value as PlanCategory)} className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors appearance-none">
                {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Prioridade</label>
              <select value={priority} onChange={e => setPriority(e.target.value as PlanPriority)} className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors appearance-none">
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-xl transition-colors shadow-sm shadow-orange-600/20 flex items-center justify-center">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Plano'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
