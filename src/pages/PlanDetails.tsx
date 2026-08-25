import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Edit2, Trash2, CalendarClock, MessageCircle, ImageIcon, Star, User, Circle, CheckCircle2, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCouple } from '../contexts/CoupleContext';
import { useAuth } from '../contexts/AuthContext';
import { Plan } from '../types';
import { PlanForm } from '../components/PlanForm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function PlanDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { couple, members } = useCouple();
  const { user } = useAuth();
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchPlan();

    if (!couple || !id) return;

    const channel = supabase
      .channel(`plan-details-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plans',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            navigate('/plans');
          } else if (payload.eventType === 'UPDATE') {
            setPlan(p => ({ ...p, ...payload.new } as Plan));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, couple]);

  const fetchPlan = async () => {
    if (!id || !couple) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .eq('couple_id', couple.id)
      .single();

    if (!error && data) {
      setPlan(data as Plan);
    } else {
      navigate('/plans');
    }
    
    setLoading(false);
  };

  const changeStatus = async (newStatus: string) => {
    if (!plan) return;
    const payload: any = { status: newStatus };
    if (newStatus === 'fizemos' && plan.status !== 'fizemos') {
      payload.completed_at = new Date().toISOString();
    } else if (newStatus !== 'fizemos' && plan.status === 'fizemos') {
      payload.completed_at = null;
    }
    
    // Optimistic update
    setPlan({ ...plan, ...payload });

    await supabase
      .from('plans')
      .update(payload)
      .eq('id', plan.id);
  };

  const deletePlan = async () => {
    if (!plan) return;
    if (confirm('Tem certeza que deseja excluir este plano?')) {
      await supabase.from('plans').delete().eq('id', plan.id);
      navigate('/plans');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!plan) return null;

  const isMe = plan.created_by_id === user?.id;
  const authorName = isMe ? 'Você' : (members[plan.created_by_id]?.name || members[plan.created_by_id]?.email?.split('@')[0] || 'Parceiro(a)');
  const authorAvatar = members[plan.created_by_id]?.avatar_url;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-24">
      <header className="flex items-center justify-between mb-4">
        <button 
          onClick={() => navigate('/plans')}
          className="p-2 -ml-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsEditing(true)} className="p-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors">
            <Edit2 size={18} />
          </button>
          <button onClick={deletePlan} className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors">
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-medium flex items-center gap-1">
              <Tag size={12} /> {plan.category}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              plan.priority === 'alta' ? 'bg-red-50 text-red-600 border border-red-100' :
              plan.priority === 'media' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
              'bg-blue-50 text-blue-600 border border-blue-100'
            }`}>
              Prioridade {plan.priority}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
              plan.status === 'fizemos' ? 'bg-green-50 text-green-700 border-green-200' :
              plan.status === 'planejado' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              'bg-stone-50 text-stone-700 border-stone-200'
            }`}>
              {plan.status === 'fizemos' ? 'Fizemos' : plan.status === 'planejado' ? 'Planejado' : 'Quero Fazer'}
            </span>
          </div>

          <h1 className="text-3xl font-semibold text-stone-900 tracking-tight leading-tight">
            {plan.title}
          </h1>

          {plan.description && (
            <p className="text-stone-600 whitespace-pre-wrap leading-relaxed text-sm">
              {plan.description}
            </p>
          )}
        </div>

        <div className="bg-white border border-stone-200/60 rounded-3xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-medium text-stone-900 mb-2">Detalhes</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                <User size={16} className="text-stone-500" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Adicionado por</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {authorAvatar && <img src={authorAvatar} alt={authorName} className="w-4 h-4 rounded-full" />}
                  <p className="text-sm font-medium text-stone-900">{authorName}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                <CalendarClock size={16} className="text-stone-500" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Criado em</p>
                <p className="text-sm font-medium text-stone-900 mt-0.5">
                  {format(new Date(plan.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {plan.planned_date && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <CalendarClock size={16} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Data planejada</p>
                  <p className="text-sm font-medium text-stone-900 mt-0.5">
                    {format(new Date(plan.planned_date), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}

            {plan.completed_at && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} className="text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Concluído em</p>
                  <p className="text-sm font-medium text-stone-900 mt-0.5">
                    {format(new Date(plan.completed_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Change Status Action */}
        <div className="bg-stone-50 border border-stone-200/60 rounded-3xl p-2 flex items-center p-1">
          <button 
            onClick={() => changeStatus('quero_fazer')}
            className={`flex-1 py-3 px-2 rounded-2xl flex flex-col items-center gap-1 transition-colors ${plan.status === 'quero_fazer' ? 'bg-white shadow-sm border border-stone-200/50 text-stone-900' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100/50'}`}
          >
            <Circle size={20} />
            <span className="text-xs font-medium">Quero Fazer</span>
          </button>
          <button 
            onClick={() => changeStatus('planejado')}
            className={`flex-1 py-3 px-2 rounded-2xl flex flex-col items-center gap-1 transition-colors ${plan.status === 'planejado' ? 'bg-white shadow-sm border border-stone-200/50 text-blue-600' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100/50'}`}
          >
            <CalendarClock size={20} />
            <span className="text-xs font-medium">Planejado</span>
          </button>
          <button 
            onClick={() => changeStatus('fizemos')}
            className={`flex-1 py-3 px-2 rounded-2xl flex flex-col items-center gap-1 transition-colors ${plan.status === 'fizemos' ? 'bg-white shadow-sm border border-stone-200/50 text-green-600' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100/50'}`}
          >
            <CheckCircle2 size={20} />
            <span className="text-xs font-medium">Fizemos</span>
          </button>
        </div>

        {/* Future Extensions Placeholders */}
        <div className="space-y-3 pt-6">
          <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider px-2">Memórias & Notas</h3>
          
          <div className="bg-white border border-stone-200/60 rounded-3xl p-4 flex items-center gap-4 text-stone-400 hover:bg-stone-50 transition-colors cursor-not-allowed group">
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center shrink-0 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
              <ImageIcon size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-700">Adicionar Fotos</p>
              <p className="text-xs text-stone-500">Em breve: Registre momentos</p>
            </div>
          </div>

          <div className="bg-white border border-stone-200/60 rounded-3xl p-4 flex items-center gap-4 text-stone-400 hover:bg-stone-50 transition-colors cursor-not-allowed group">
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center shrink-0 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
              <MessageCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-700">Comentários</p>
              <p className="text-xs text-stone-500">Em breve: Deixe notas e comentários</p>
            </div>
          </div>

          <div className="bg-white border border-stone-200/60 rounded-3xl p-4 flex items-center gap-4 text-stone-400 hover:bg-stone-50 transition-colors cursor-not-allowed group">
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center shrink-0 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
              <Star size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-700">Avaliação</p>
              <p className="text-xs text-stone-500">Em breve: Avalie a experiência</p>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <PlanForm
          plan={plan}
          onClose={() => setIsEditing(false)}
          onSuccess={() => setIsEditing(false)}
        />
      )}
    </motion.div>
  );
}
