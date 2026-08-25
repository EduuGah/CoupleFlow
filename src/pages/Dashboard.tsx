import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { testConnection, supabase } from '../lib/supabase';
import { useCouple } from '../contexts/CoupleContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Plan } from '../types';
import { format, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarClock, AlertCircle, Calendar } from 'lucide-react';

export function Dashboard() {
  const { couple } = useCouple();
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [upcomingPlans, setUpcomingPlans] = useState<Plan[]>([]);
  const [dbStatus, setDbStatus] = useState<'testando' | 'conectado' | 'erro'>('testando');

  useEffect(() => {
    async function checkDb() {
      const isConnected = await testConnection();
      setDbStatus(isConnected ? 'conectado' : 'erro');
    }
    checkDb();
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!couple) return;
      
      // Get Count
      const { count, error: countError } = await supabase
        .from('plans')
        .select('*', { count: 'exact', head: true })
        .eq('couple_id', couple.id)
        .in('status', ['quero_fazer', 'planejado']);
        
      if (!countError && count !== null) {
        setPendingCount(count);
      }

      // Get Upcoming Plans
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('couple_id', couple.id)
        .neq('status', 'fizemos')
        .not('planned_date', 'is', null);

      if (!plansError && plansData) {
        // Sort chronologically (earliest first)
        const sorted = (plansData as Plan[]).sort((a, b) => {
          return new Date(a.planned_date!).getTime() - new Date(b.planned_date!).getTime();
        });
        setUpcomingPlans(sorted);
      }
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-24"
    >
      <header className="pt-8 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          Olá, {user?.user_metadata?.name || 'Amor'}
        </h1>
        <p className="text-stone-500">O que vamos fazer juntos hoje no espaço {couple?.name}?</p>
        
        <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 rounded-md bg-stone-100 text-xs font-medium text-stone-600">
          <div className={`w-2 h-2 rounded-full ${
            dbStatus === 'conectado' ? 'bg-green-500' : 
            dbStatus === 'erro' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
          }`} />
          Supabase: {dbStatus === 'conectado' ? 'Conectado' : dbStatus === 'erro' ? 'Erro de Conexão' : 'Testando...'}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-100/50 border border-orange-200/50 rounded-3xl p-5">
          <div className="text-4xl font-light text-orange-600 mb-1">{pendingCount}</div>
          <div className="text-sm font-medium text-orange-800">Planos na lista</div>
        </div>
        
        <Link to="/plans" className="bg-stone-100 border border-stone-200/60 rounded-3xl p-5 flex flex-col justify-center items-center text-center hover:bg-stone-200 transition-colors">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-stone-900 mb-2 shadow-sm">
            +
          </div>
          <div className="text-sm font-medium text-stone-700">Novo Plano</div>
        </Link>
      </div>

      <div className="pt-4">
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock size={20} className="text-stone-900" />
          <h2 className="text-lg font-semibold text-stone-900 tracking-tight">Próximos planos</h2>
        </div>

        {upcomingPlans.length === 0 ? (
          <div className="bg-stone-50 border border-stone-200/60 rounded-3xl p-8 text-center">
            <Calendar size={32} className="mx-auto text-stone-400 mb-3" />
            <h3 className="text-sm font-medium text-stone-900 mb-1">Nada agendado</h3>
            <p className="text-sm text-stone-500">
              Vocês não têm nenhum plano com data marcada.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingPlans.map(plan => {
              const date = new Date(plan.planned_date!);
              const overdue = isBefore(date, new Date());
              
              return (
                <Link 
                  key={plan.id}
                  to={`/plans/${plan.id}`}
                  className={`block border rounded-2xl p-4 transition-colors ${
                    overdue 
                      ? 'bg-orange-50/50 border-orange-200 hover:bg-orange-50' 
                      : 'bg-white border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-stone-900 truncate">
                        {plan.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[10px] font-medium uppercase tracking-wider">
                          {plan.category}
                        </span>
                        <div className={`flex items-center gap-1 text-xs font-medium ${overdue ? 'text-orange-600' : 'text-stone-500'}`}>
                          {overdue ? <AlertCircle size={12} /> : <CalendarClock size={12} />}
                          <span>{format(date, "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </motion.div>
  );
}
