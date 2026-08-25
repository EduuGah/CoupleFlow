import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { testConnection, supabase } from '../lib/supabase';
import { useCouple } from '../contexts/CoupleContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { couple } = useCouple();
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [dbStatus, setDbStatus] = useState<'testando' | 'conectado' | 'erro'>('testando');

  useEffect(() => {
    async function checkDb() {
      const isConnected = await testConnection();
      setDbStatus(isConnected ? 'conectado' : 'erro');
    }
    checkDb();
  }, []);

  useEffect(() => {
    async function fetchStats() {
      if (!couple) return;
      const { count, error } = await supabase
        .from('plans')
        .select('*', { count: 'exact', head: true })
        .eq('couple_id', couple.id)
        .in('status', ['quero_fazer', 'planejado']);
        
      if (!error && count !== null) {
        setPendingCount(count);
      }
    }
    fetchStats();
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
    </motion.div>
  );
}
