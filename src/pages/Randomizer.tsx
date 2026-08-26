import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Dices, Play, CheckCircle2, CalendarClock, RefreshCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCouple } from '../contexts/CoupleContext';
import { DEFAULT_CATEGORIES, Plan, PlanCategory } from '../types';

const FILTERS = ['Qualquer', ...DEFAULT_CATEGORIES] as const;
type FilterType = typeof FILTERS[number];

export function Randomizer() {
  const { couple } = useCouple();
  const navigate = useNavigate();
  
  const [activeFilter, setActiveFilter] = useState<FilterType>('Qualquer');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [displayPlan, setDisplayPlan] = useState<Plan | null>(null); // For the shuffling effect

  useEffect(() => {
    if (couple) {
      fetchPlans();
    }
  }, [couple, activeFilter]);

  const fetchPlans = async () => {
    if (!couple) return;
    setLoading(true);
    
    let query = supabase
      .from('plans')
      .select('*')
      .eq('couple_id', couple.id)
      .neq('status', 'fizemos');
      
    if (activeFilter !== 'Qualquer') {
      query = query.eq('category', activeFilter);
    }

    const { data, error } = await query;
    if (!error && data) {
      setPlans(data as Plan[]);
    }
    setLoading(false);
    setSelectedPlan(null);
    setDisplayPlan(null);
  };

  const handleSpin = () => {
    if (plans.length === 0) return;
    
    setIsSpinning(true);
    setSelectedPlan(null);
    
    const duration = 2500; // 2.5 seconds spinning
    const intervalTime = 100;
    let elapsed = 0;
    
    const interval = setInterval(() => {
      elapsed += intervalTime;
      const randomIdx = Math.floor(Math.random() * plans.length);
      setDisplayPlan(plans[randomIdx]);
      
      if (elapsed >= duration) {
        clearInterval(interval);
        const finalIdx = Math.floor(Math.random() * plans.length);
        const finalPlan = plans[finalIdx];
        setDisplayPlan(finalPlan);
        setSelectedPlan(finalPlan);
        setIsSpinning(false);
      }
    }, intervalTime);
  };

  const handleFazerAgora = async () => {
    if (!selectedPlan) return;
    const { error } = await supabase
      .from('plans')
      .update({ 
        status: 'fizemos', 
        completed_at: new Date().toISOString() 
      })
      .eq('id', selectedPlan.id);
      
    if (!error) {
      navigate(`/plans/${selectedPlan.id}`);
    }
  };

  const handlePlanejar = async () => {
    if (!selectedPlan) return;
    if (selectedPlan.status === 'quero_fazer') {
      await supabase
        .from('plans')
        .update({ status: 'planejado' })
        .eq('id', selectedPlan.id);
    }
    navigate(`/plans/${selectedPlan.id}`);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold text-stone-900 tracking-tight flex items-center justify-center gap-3">
          <Dices className="text-orange-500" size={32} />
          Escolha por Nós
        </h1>
        <p className="text-stone-500">
          Sem ideias? Deixe a sorte decidir o nosso próximo plano.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 justify-center">
        {FILTERS.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            disabled={isSpinning}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === filter 
                ? 'bg-orange-100 text-orange-700 border-2 border-orange-200'
                : 'bg-white text-stone-600 border-2 border-stone-100 hover:bg-stone-50'
            } ${isSpinning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Spin Area */}
      <div className="bg-white border-2 border-stone-100 rounded-3xl p-8 min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
        {loading ? (
          <div className="w-8 h-8 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
        ) : plans.length === 0 ? (
          <div className="text-center">
            <p className="text-stone-500 mb-2">Nenhum plano encontrado para esta categoria.</p>
            <p className="text-sm text-stone-400">Adicione novos planos para poder sortear!</p>
          </div>
        ) : (
          <>
            {!displayPlan && !selectedPlan ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSpin}
                className="w-32 h-32 bg-orange-500 rounded-full flex flex-col items-center justify-center text-white shadow-lg hover:bg-orange-600 transition-colors"
              >
                <Play size={40} className="ml-2 mb-1" />
                <span className="font-medium">Sortear</span>
              </motion.button>
            ) : (
              <div className="w-full text-center space-y-8 z-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={displayPlan?.id || 'empty'}
                    initial={isSpinning ? { opacity: 0.5, y: 20 } : { opacity: 0, scale: 0.8 }}
                    animate={isSpinning ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: isSpinning ? 0.1 : 0.4, type: isSpinning ? 'tween' : 'spring' }}
                    className="space-y-3"
                  >
                    <span className="inline-block px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-medium uppercase tracking-wider">
                      {displayPlan?.category}
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-stone-900 px-4">
                      {displayPlan?.title}
                    </h2>
                  </motion.div>
                </AnimatePresence>

                {selectedPlan && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-3 justify-center pt-6"
                  >
                    <button
                      onClick={handleFazerAgora}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                    >
                      <CheckCircle2 size={20} />
                      Fazer agora
                    </button>
                    <button
                      onClick={handlePlanejar}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
                    >
                      <CalendarClock size={20} />
                      Planejar
                    </button>
                    <button
                      onClick={handleSpin}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium transition-colors"
                    >
                      <RefreshCcw size={20} />
                      Sortear novamente
                    </button>
                  </motion.div>
                )}
              </div>
            )}
            
            {/* Background decorative elements */}
            {isSpinning && (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 pointer-events-none opacity-5"
              >
                <div className="absolute top-10 left-10"><Dices size={100} /></div>
                <div className="absolute bottom-10 right-10"><Dices size={100} /></div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
