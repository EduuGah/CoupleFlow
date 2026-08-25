import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, CheckCircle2, Circle, MoreVertical, Trash2, Edit2, Loader2, Tag, CalendarClock, User, Search, Filter as FilterIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCouple } from '../contexts/CoupleContext';
import { useAuth } from '../contexts/AuthContext';
import { Plan, DEFAULT_CATEGORIES } from '../types';
import { PlanForm } from '../components/PlanForm';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function PlansList() {
  const { couple, members } = useCouple();
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | undefined>();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'quero_fazer' | 'planejado'>('todos');
  const [priorityFilter, setPriorityFilter] = useState<'todas' | 'baixa' | 'media' | 'alta'>('todas');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az'>('newest');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = statusFilter !== 'todos' || priorityFilter !== 'todas' || sortBy !== 'newest' || showCompleted;

  const clearFilters = () => {
    setStatusFilter('todos');
    setPriorityFilter('todas');
    setSortBy('newest');
    setShowCompleted(false);
  };

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

  // Computed data
  const { filteredPlans, categoryCounts, activeCategories } = useMemo(() => {
    let result = plans;

    // 1. Ocultar/Mostrar Concluídos
    if (!showCompleted) {
      result = result.filter(p => p.status !== 'fizemos');
    }

    // 2. Filtro de Status
    if (statusFilter !== 'todos') {
      result = result.filter(p => p.status === statusFilter);
    }

    // 3. Filtro de Prioridade
    if (priorityFilter !== 'todas') {
      result = result.filter(p => p.priority === priorityFilter);
    }

    // 4. Busca por Título ou Descrição
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Calcular as categorias DOS ITENS JÁ FILTRADOS (para a barra horizontal ser coerente)
    const counts = result.reduce((acc, plan) => {
      acc[plan.category] = (acc[plan.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 5. Aplicar o Filtro de Categoria
    if (selectedCategory !== 'Todas') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // 6. Ordenação
    result = [...result].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'az') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    const activeCats = DEFAULT_CATEGORIES.filter(c => counts[c] > 0);

    return { filteredPlans: result, categoryCounts: counts, activeCategories: activeCats };
  }, [plans, showCompleted, statusFilter, priorityFilter, searchQuery, selectedCategory, sortBy]);

  // Contagem total para a pílula "Todas" na barra de categorias (antes do filtro de categoria)
  const totalInCurrentFilters = useMemo(() => {
    return Object.values(categoryCounts).reduce((a, b) => a + b, 0);
  }, [categoryCounts]);

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

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar planos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none text-stone-700 placeholder-stone-400"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl flex items-center justify-center transition-colors border ${showFilters || hasActiveFilters ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'}`}
          >
            <FilterIcon size={20} />
            {hasActiveFilters && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 border border-white" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-stone-900">Filtros</span>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-xs text-orange-600 font-medium hover:text-orange-700">Limpar tudo</button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-stone-500 font-medium mb-2 block uppercase tracking-wider">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {['todos', 'quero_fazer', 'planejado'].map(s => (
                        <button 
                          key={s} 
                          onClick={() => setStatusFilter(s as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${statusFilter === s ? 'bg-stone-800 border-stone-800 text-white' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                        >
                          {s === 'todos' ? 'Todos' : s === 'quero_fazer' ? 'Quero Fazer' : 'Planejado'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-stone-500 font-medium mb-2 block uppercase tracking-wider">Prioridade</label>
                    <div className="flex flex-wrap gap-2">
                      {['todas', 'baixa', 'media', 'alta'].map(p => (
                        <button 
                          key={p}
                          onClick={() => setPriorityFilter(p as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${priorityFilter === p ? 'bg-stone-800 border-stone-800 text-white' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-stone-500 font-medium mb-2 block uppercase tracking-wider">Ordenação</label>
                    <select 
                      value={sortBy} 
                      onChange={e => setSortBy(e.target.value as any)}
                      className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    >
                      <option value="newest">Mais recentes primeiro</option>
                      <option value="oldest">Mais antigos primeiro</option>
                      <option value="az">Ordem alfabética (A-Z)</option>
                    </select>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <label className="text-sm text-stone-900 font-medium block">Mostrar concluídos</label>
                      <span className="text-xs text-stone-500">Exibir planos que já fizemos</span>
                    </div>
                    <button 
                      onClick={() => setShowCompleted(!showCompleted)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${showCompleted ? 'bg-green-500' : 'bg-stone-300'}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${showCompleted ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {totalInCurrentFilters > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              onClick={() => setSelectedCategory('Todas')}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === 'Todas' 
                  ? 'bg-stone-800 text-white' 
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Todas ({totalInCurrentFilters})
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
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 text-stone-500">
          Você ainda não adicionou nenhum plano.
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-12 text-stone-500">
          Nenhum plano encontrado com os filtros atuais.
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

                <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-2 text-xs text-stone-400">
                  {(() => {
                    const isMe = plan.created_by_id === user?.id;
                    const author = isMe ? 'Você' : (members[plan.created_by_id]?.name || members[plan.created_by_id]?.email?.split('@')[0] || 'Parceiro(a)');
                    const avatar = members[plan.created_by_id]?.avatar_url;
                    
                    return (
                      <>
                        {avatar ? (
                          <img src={avatar} alt={author} className="w-4 h-4 rounded-full" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-stone-100 flex items-center justify-center text-[8px] text-stone-500">
                            <User size={10} />
                          </div>
                        )}
                        <span className="font-medium text-stone-500">{author}</span>
                        <span>&middot;</span>
                        <span>{formatDistanceToNow(new Date(plan.created_at), { addSuffix: true, locale: ptBR })}</span>
                      </>
                    );
                  })()}
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

