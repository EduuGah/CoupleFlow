import { useState } from 'react';
import { mockPlans } from '../data';
import { EmptyState } from '../components/EmptyState';
import { Plus, ListTodo } from 'lucide-react';
import { motion } from 'motion/react';
import type { Category } from '../types';

const CATEGORIES: ('Todos' | Category)[] = ['Todos', 'Filmes', 'Restaurantes', 'Viagens', 'Tarefas', 'Outros'];

export function PlansList() {
  const [activeCategory, setActiveCategory] = useState<'Todos' | Category>('Todos');

  const filteredPlans = mockPlans.filter(
    (plan) => activeCategory === 'Todos' || plan.category === activeCategory
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-24 md:pb-0"
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Nossos Planos</h1>
          <p className="text-stone-500 text-sm mt-1">Organize o que vocês querem fazer.</p>
        </div>
        <button className="hidden md:flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-full font-medium transition-colors shadow-sm shadow-orange-600/20">
          <Plus size={20} />
          <span>Novo Plano</span>
        </button>
      </header>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat
                ? 'bg-stone-800 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Plans List */}
      <div className="space-y-3">
        {filteredPlans.length > 0 ? (
          filteredPlans.map((plan) => (
            <div 
              key={plan.id}
              className="bg-white p-4 rounded-2xl border border-stone-200/60 shadow-sm flex items-start gap-4"
            >
              <div className={`mt-1 w-5 h-5 rounded-full flex-shrink-0 border-2 flex items-center justify-center ${
                plan.status === 'concluido' ? 'border-green-500 bg-green-500 text-white' : 'border-stone-300'
              }`}>
                {plan.status === 'concluido' && (
                  <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 stroke-current stroke-[3] stroke-linecap-round stroke-linejoin-round">
                    <path d="M2.75 7.5L5.5 10.25L11.25 3.5" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-base font-medium ${plan.status === 'concluido' ? 'text-stone-400 line-through' : 'text-stone-900'}`}>
                  {plan.title}
                </h3>
                {plan.description && (
                  <p className="text-sm text-stone-500 mt-0.5 line-clamp-1">{plan.description}</p>
                )}
                <div className="mt-2">
                  <span className="inline-flex px-2 py-1 bg-stone-100 text-stone-600 text-[10px] font-medium rounded-md uppercase tracking-wide">
                    {plan.category}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={<ListTodo size={48} />}
            title="Nenhum plano encontrado"
            description={
              activeCategory === 'Todos' 
                ? 'Vocês ainda não adicionaram nada para fazer. Que tal criar o primeiro plano?'
                : `Vocês ainda não têm planos na categoria ${activeCategory}.`
            }
          />
        )}
      </div>

      {/* Mobile FAB */}
      <button className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-600/30 active:scale-95 transition-transform z-40">
        <Plus size={24} />
      </button>
    </motion.div>
  );
}
