import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, CheckCircle2, Circle, MoreVertical, Trash2, Edit2, Loader2, Tag, CalendarClock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCouple } from '../contexts/CoupleContext';
import { Plan, DEFAULT_CATEGORIES } from '../types';
import { PlanForm } from '../components/PlanForm';

export function PlansList() {
  const { couple } = useCouple();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | undefined>();
  const [activeTab, setActiveTab] = useState<'quero_fazer' | 'planejado' | 'fizemos'>('quero_fazer');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchPlans = async () => {
    if (!couple) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setPlans(data as Plan[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();

    if (!couple) return;

    const channel = supabase
      .channel('plans-list-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plans',
          filter: `couple_id=eq.${couple.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPlans((current) => {
              if (current.some(p => p.id === payload.new.id)) return current;
              return [payload.new as Plan, ...current];
            });
          } else if (payload.eventType === 'UPDATE') {
            setPlans((current) =>
              current.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } as Plan : p))
            );
          } else if (payload.eventType === 'DELETE') {
            setPlans((current) => current.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple]);

  const changeStatus = async (plan: Plan, newStatus: string) => {
    const payload: any = { status: newStatus };
    if (newStatus === 'fizemos' && plan.status !== 'fizemos') {
      payload.completed_at = new Date().toISOString();
    } else if (newStatus !== 'fizemos' && plan.status === 'fizemos') {
      payload.completed_at = null;
    }

    // Optimistic update
    setPlans(plans.map(p => p.id === plan.id ? { ...p, ...payload } : p));
    
    await supabase
      .from('plans')
      .update(payload)
      .eq('id', plan.id);
    setOpenMenuId(null);
  };

  const deletePlan = async (id: string) => {
    // Otimistic update
    setPlans(plans.filter(p => p.id !== id));
    await supabase.from('plans').delete().eq('id', id);
    setOpenMenuId(null);
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setIsFormOpen(true);
    setOpenMenuId(null);
  };

  const currentTabPlans = plans.filter(p => p.status === activeTab);
  
  // Counts per category (for the current tab)
  const categoryCounts = currentTabPlans.reduce((acc, plan) => {
    acc[plan.category] = (acc[plan.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredPlans = currentTabPlans.filter(p => selectedCategory === 'Todas' || p.category === selectedCategory);
  
  // Show only categories that have at least one item, plus the 'Todas' option
  const activeCategories = DEFAULT_CATEGORIES.filter(c => categoryCounts[c] > 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-24 relative">
      <header className="pt-8 pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Planos</h1>
        <button 
          onClick={() => { setEditingPlan(undefined); setIsFormOpen(true); }} 
          className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center hover:bg-orange-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
        </button>
      </header>

      <div className="flex gap-2 p-1 bg-stone-100 rounded-xl">
        <button 
          onClick={() => setActiveTab('quero_fazer')} 
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'quero_fazer' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
        >
          Quero Fazer
        </button>
        <button 
          onClick={() => setActiveTab('planejado')} 
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'planejado' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
        >
          Planejado
        </button>
        <button 
          onClick={() => setActiveTab('fizemos')} 
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'fizemos' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
        >
          Fizemos
        </button>
      </div>

      {currentTabPlans.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setSelectedCategory('Todas')}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === 'Todas' 
                ? 'bg-stone-800 text-white' 
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Todas ({currentTabPlans.length})
          </button>
          
          {activeCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat} ({categoryCounts[cat]})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
        </div>
      ) : currentTabPlans.length === 0 ? (
        <div className="text-center py-12 text-stone-500">
          Nenhum plano {activeTab} por aqui.
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-12 text-stone-500">
          Nenhum plano na categoria {selectedCategory}.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPlans.map(plan => (
            <div key={plan.id} className="bg-white border border-stone-200/60 rounded-2xl p-4 shadow-sm flex gap-4 relative">
              <button 
                onClick={() => changeStatus(plan, plan.status === 'fizemos' ? 'quero_fazer' : 'fizemos')} 
                className={`mt-1 shrink-0 transition-colors ${
                  plan.status === 'fizemos' ? 'text-green-500' :
                  plan.status === 'planejado' ? 'text-blue-500 hover:text-green-500' :
                  'text-stone-300 hover:text-green-500'
                }`}
              >
                {plan.status === 'fizemos' ? <CheckCircle2 size={24} /> : 
                 plan.status === 'planejado' ? <CalendarClock size={24} /> : 
                 <Circle size={24} />}
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={`font-medium truncate ${plan.status === 'fizemos' ? 'text-stone-400 line-through' : 'text-stone-900'}`}>
                    {plan.title}
                  </h3>
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === plan.id ? null : plan.id)} 
                    className="p-1 text-stone-400 hover:text-stone-600 rounded-md"
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
                
                {plan.description && (
                  <p className="text-sm text-stone-500 mt-1 line-clamp-2">{plan.description}</p>
                )}
                
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-1 bg-stone-100 text-stone-600 rounded-md">
                    {plan.category}
                  </span>
                  <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-md ${
                    plan.priority === 'alta' ? 'bg-red-50 text-red-600' :
                    plan.priority === 'media' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-stone-50 text-stone-500'
                  }`}>
                    {plan.priority}
                  </span>
                </div>
              </div>
              
              {openMenuId === plan.id && (
                <div className="absolute top-12 right-4 bg-white border border-stone-200 rounded-xl shadow-lg p-1 z-10 min-w-[150px] flex flex-col">
                  {plan.status !== 'quero_fazer' && (
                    <button onClick={() => changeStatus(plan, 'quero_fazer')} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg">
                      <Circle size={14} /> Quero Fazer
                    </button>
                  )}
                  {plan.status !== 'planejado' && (
                    <button onClick={() => changeStatus(plan, 'planejado')} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg">
                      <CalendarClock size={14} /> Planejado
                    </button>
                  )}
                  {plan.status !== 'fizemos' && (
                    <button onClick={() => changeStatus(plan, 'fizemos')} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg">
                      <CheckCircle2 size={14} /> Fizemos
                    </button>
                  )}
                  <div className="h-px bg-stone-100 my-1"></div>
                  <button 
                    onClick={() => openEdit(plan)} 
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg"
                  >
                    <Edit2 size={14} /> Editar
                  </button>
                  <button 
                    onClick={() => deletePlan(plan.id)} 
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
        <PlanForm 
          plan={editingPlan} 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={() => { setIsFormOpen(false); fetchPlans(); }} 
        />
      )}
    </motion.div>
  );
}
