import React, { useState } from 'react';
import { Star, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Plan } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PlanEvaluationProps {
  plan: Plan;
  onUpdate: (plan: Plan) => void;
}

export function PlanEvaluation({ plan, onUpdate }: PlanEvaluationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState<number>(plan.rating || 0);
  const [evaluation, setEvaluation] = useState(plan.evaluation || '');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Só exibe se o plano estiver marcado como 'fizemos'
  if (plan.status !== 'fizemos') return null;

  const handleSave = async () => {
    if (rating === 0) {
      setErrorMsg("Por favor, selecione uma nota de 1 a 5 estrelas.");
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }
    
    setSaving(true);
    const updates = {
      rating,
      evaluation: evaluation.trim() || null,
      evaluated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('plans')
      .update(updates)
      .eq('id', plan.id);
      
    setSaving(false);
    
    if (error) {
      setErrorMsg("Erro ao salvar avaliação. Tente novamente.");
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }
    
    onUpdate({ ...plan, ...updates });
    setIsEditing(false);
  };

  const hasEvaluation = plan.rating !== null && plan.rating > 0;

  if (!isEditing && hasEvaluation) {
    return (
      <div className="bg-white border border-stone-200/60 rounded-3xl p-6 shadow-sm relative group flex flex-col items-center text-center">
        <button 
          onClick={() => setIsEditing(true)}
          className="absolute top-4 right-4 p-2 text-stone-300 hover:text-orange-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          title="Editar Avaliação"
          aria-label="Editar Avaliação"
        >
          <Edit2 size={16} />
        </button>
        
        <div className="flex gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star 
              key={star} 
              size={24} 
              className={`${star <= (plan.rating || 0) ? 'fill-orange-400 text-orange-400' : 'text-stone-200 fill-stone-50'}`} 
            />
          ))}
        </div>
        
        {plan.evaluation && (
          <p className="text-stone-700 italic mb-4">
            "{plan.evaluation}"
          </p>
        )}
        
        <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">
          Avaliado em {format(new Date(plan.evaluated_at || plan.updated_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm bg-orange-50/30 relative">
      <h3 className="text-sm font-medium text-stone-900 mb-4 text-center">
        {hasEvaluation ? 'Editar Avaliação' : 'Como foi a experiência?'}
      </h3>

      {errorMsg && (
        <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-xl z-10 shadow-sm text-center">
          {errorMsg}
        </div>
      )}
      
      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="transition-transform hover:scale-110 focus:outline-none"
            aria-label={`Dar ${star} estrela${star > 1 ? 's' : ''}`}
            title={`${star} estrela${star > 1 ? 's' : ''}`}
          >
            <Star 
              size={32} 
              className={`${star <= rating ? 'fill-orange-400 text-orange-400' : 'text-stone-300 fill-white'} transition-colors`} 
            />
          </button>
        ))}
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
            Comentário / Opinião
          </label>
          <textarea
            value={evaluation}
            onChange={(e) => setEvaluation(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-shadow min-h-[100px] resize-none"
            placeholder="O que acharam? Ex: Foi muito melhor do que esperávamos..."
          />
        </div>
        
        <div className="flex gap-3">
          {hasEvaluation && (
            <button
              onClick={() => {
                setIsEditing(false);
                setRating(plan.rating || 0);
                setEvaluation(plan.evaluation || '');
              }}
              className="flex-1 py-3 px-4 rounded-xl font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition-colors text-sm"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-white transition-colors text-sm ${
              saving ? 'bg-orange-300' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {saving ? 'Salvando...' : 'Salvar Avaliação'}
          </button>
        </div>
      </div>
    </div>
  );
}
