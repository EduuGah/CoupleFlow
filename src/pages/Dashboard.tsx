import { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useCouple } from '../contexts/CoupleContext';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Plan } from '../types';
import { EmptyState } from '../components/EmptyState';
import { format, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, Plus, Clock, Dices, Star, ArrowRight
} from 'lucide-react';

export function Dashboard() {
  const { couple } = useCouple();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!couple) return;
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('couple_id', couple.id);
        
      if (!error && data) {
        setPlans(data as Plan[]);
      }
      setLoading(false);
    }
    
    fetchData();

    if (!couple) return;

    const channel = supabase
      .channel('dashboard-plans-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plans',
          filter: `couple_id=eq.${couple.id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple]);

  // Derived Metrics
  const metrics = useMemo(() => {
    const pendentes = plans.filter(p => p.status === 'quero_fazer').length;
    const planejados = plans.filter(p => p.status === 'planejado').length;
    const concluidos = plans.filter(p => p.status === 'fizemos').length;
    return { pendentes, planejados, concluidos };
  }, [plans]);

  // Category Distribution
  const topCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    plans.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [plans]);

  // Lists
  const upcomingPlans = useMemo(() => {
    return plans
      .filter(p => p.status === 'planejado' && p.planned_date)
      .sort((a, b) => new Date(a.planned_date!).getTime() - new Date(b.planned_date!).getTime())
      .slice(0, 3);
  }, [plans]);

  const recentCompleted = useMemo(() => {
    return plans
      .filter(p => p.status === 'fizemos')
      .sort((a, b) => new Date(b.completed_at || b.updated_at).getTime() - new Date(a.completed_at || a.updated_at).getTime())
      .slice(0, 5);
  }, [plans]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-24"
    >
      <header className="pt-8">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
          Olá, {user?.user_metadata?.name?.split(' ')[0] || 'Amor'}
        </h1>
        <p className="text-stone-500 mt-1">
          O que vamos fazer no espaço <span className="font-medium text-stone-700">{couple?.name}</span>?
        </p>
      </header>

      {/* Quick Stats & Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        {/* Action 1: Add */}
        <button
          onClick={() => navigate('/plans', { state: { openAddForm: true } })}
          className="bg-stone-900 text-white p-4 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-stone-800 transition-colors shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <Plus size={20} className="text-white" />
          </div>
          <span className="text-sm font-medium">Novo Plano</span>
        </button>

        {/* Action 2: Random */}
        <button
          onClick={() => navigate('/random')}
          className="bg-orange-100 text-orange-700 p-4 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-orange-200 transition-colors shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-orange-200/50 flex items-center justify-center">
            <Dices size={20} className="text-orange-600" />
          </div>
          <span className="text-sm font-medium">Sorteio</span>
        </button>

        {/* Action 3: Queue */}
        <button
          onClick={() => navigate('/plans')}
          className="bg-blue-50 border border-blue-100/50 text-blue-700 p-4 rounded-3xl flex flex-col items-center justify-center gap-1 hover:bg-blue-100 transition-colors shadow-sm"
        >
          <span className="text-3xl font-semibold">{metrics.pendentes + metrics.planejados}</span>
          <span className="text-xs font-semibold uppercase tracking-wider opacity-80 mt-1">Na fila</span>
        </button>

        {/* Action 4: History */}
        <button
          onClick={() => navigate('/history')}
          className="bg-emerald-50 border border-emerald-100/50 text-emerald-700 p-4 rounded-3xl flex flex-col items-center justify-center gap-1 hover:bg-emerald-100 transition-colors shadow-sm"
        >
          <span className="text-3xl font-semibold">{metrics.concluidos}</span>
          <span className="text-xs font-semibold uppercase tracking-wider opacity-80 mt-1">Memórias</span>
        </button>
      </div>

      {/* Categories Pills */}
      {topCategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider pr-1">Favoritos</span>
          {topCategories.map(([cat, count]) => (
            <div key={cat} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-full text-xs font-medium text-stone-600 shadow-sm">
              <span>{cat}</span>
              <span className="text-stone-400 font-normal">({count})</span>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Plans */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-stone-900 tracking-tight">Agendados</h2>
          <button onClick={() => navigate('/plans', { state: { statusFilter: 'planejado' } })} className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1">
            Ver calendário <ArrowRight size={16} />
          </button>
        </div>

        {upcomingPlans.length === 0 ? (
          <EmptyState
            icon={<Calendar size={32} />}
            title="Agenda livre"
            description="Vocês ainda não possuem planos com datas marcadas para os próximos dias."
          />
        ) : (
          <div className="space-y-3">
            {upcomingPlans.map(plan => {
              const date = new Date(plan.planned_date!);
              const overdue = isBefore(date, new Date());
              return (
                <Link 
                  key={plan.id}
                  to={`/plans/${plan.id}`}
                  className={`block border rounded-[2rem] p-5 transition-colors ${
                    overdue ? 'bg-orange-50/50 border-orange-200 hover:bg-orange-50' : 'bg-white border-stone-200/60 hover:border-stone-300 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-lg text-[10px] font-semibold uppercase tracking-wider">
                          {plan.category}
                        </span>
                        <div className={`flex items-center gap-1.5 text-xs font-medium ${overdue ? 'text-orange-600' : 'text-stone-500'}`}>
                          <Clock size={14} />
                          <span>{format(date, "dd 'de' MMM, HH:mm", { locale: ptBR })}</span>
                        </div>
                      </div>
                      <h3 className="text-lg font-medium text-stone-900 truncate">{plan.title}</h3>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Completed - Horizontal Scroll */}
      {recentCompleted.length > 0 && (
        <div className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-stone-900 tracking-tight">Últimas memórias</h2>
            <button onClick={() => navigate('/history')} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              Ver todas <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 snap-x">
            {recentCompleted.map(plan => (
              <Link 
                key={plan.id}
                to={`/plans/${plan.id}`}
                className="block min-w-[240px] max-w-[280px] bg-white border border-stone-200/60 rounded-[2rem] p-5 hover:border-stone-300 transition-colors shadow-sm snap-start flex-shrink-0"
              >
                <div className="flex flex-col h-full justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-lg text-[10px] font-semibold uppercase tracking-wider">
                        {plan.category}
                      </span>
                      {plan.rating && (
                        <div className="flex items-center gap-1">
                          <Star size={14} className="fill-orange-400 text-orange-400" />
                          <span className="text-xs font-semibold text-stone-700">{plan.rating}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-stone-900 text-lg leading-tight line-clamp-2">{plan.title}</h3>
                  </div>
                  <div className="text-xs font-medium text-stone-400">
                    {plan.completed_at ? format(new Date(plan.completed_at), "dd MMM yyyy", { locale: ptBR }) : ''}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </motion.div>
  );
}
