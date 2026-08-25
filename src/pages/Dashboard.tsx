import { mockCouple, mockPlans } from '../data';
import { motion } from 'motion/react';

export function Dashboard() {
  const pendingPlans = mockPlans.filter(p => p.status === 'pendente').length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
          Olá, {mockCouple.partner1Name} & {mockCouple.partner2Name}
        </h1>
        <p className="text-stone-500">O que vamos fazer juntos hoje?</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
          <h2 className="text-orange-800 text-sm font-medium mb-1">Planos Pendentes</h2>
          <p className="text-3xl font-semibold text-orange-600">{pendingPlans}</p>
        </div>
        <div className="bg-stone-50 rounded-2xl p-5 border border-stone-100">
          <h2 className="text-stone-600 text-sm font-medium mb-1">Memórias</h2>
          <p className="text-3xl font-semibold text-stone-800">
            {mockPlans.filter(p => p.status === 'concluido').length}
          </p>
        </div>
      </div>

      {/* Quick Action / Next up */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-stone-800">Próximo Plano</h2>
        </div>
        
        {mockPlans.length > 0 ? (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/60">
            <div className="flex justify-between items-start mb-2">
              <span className="inline-flex px-2 py-1 bg-stone-100 text-stone-600 text-xs font-medium rounded-md">
                {mockPlans[0].category}
              </span>
            </div>
            <h3 className="text-xl font-medium text-stone-900 mb-1">{mockPlans[0].title}</h3>
            {mockPlans[0].description && (
              <p className="text-stone-500 text-sm line-clamp-2">{mockPlans[0].description}</p>
            )}
          </div>
        ) : (
          <p className="text-stone-500">Nenhum plano cadastrado ainda.</p>
        )}
      </section>
    </motion.div>
  );
}
