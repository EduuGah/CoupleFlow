import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, Loader2, Link as LinkIcon, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCouple } from '../contexts/CoupleContext';
import { v4 as uuidv4 } from 'uuid';

export function SetupSpace() {
  const { user } = useAuth();
  const { couple, refreshCouple } = useCouple();
  
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [coupleName, setCoupleName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  // Se já tiver casal, não precisa estar aqui
  if (couple) {
    return <Navigate to="/" replace />;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Geramos o UUID no frontend para usar como Convite e ID,
      // evitando erros do RLS ao tentar dar SELECT após o INSERT
      const newCoupleId = uuidv4();
      
      const { error: coupleError } = await supabase
        .from('couples')
        .insert({ id: newCoupleId, name: coupleName || 'Nosso Espaço' });
        
      if (coupleError) throw coupleError;
      
      const { error: memberError } = await supabase
        .from('couple_members')
        .insert({ couple_id: newCoupleId, user_id: user.id });
        
      if (memberError) throw memberError;
      
      // Sucesso! Atualiza o contexto
      await refreshCouple();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar o espaço.');
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (!inviteCode || inviteCode.length < 10) {
        throw new Error('Código de convite inválido.');
      }

      const { error: memberError } = await supabase
        .from('couple_members')
        .insert({ couple_id: inviteCode.trim(), user_id: user.id });
        
      if (memberError) {
        if (memberError.message.includes('limite')) {
          throw new Error('Este espaço já possui 2 membros e não aceita mais ninguém.');
        }
        if (memberError.code === '23503') { // Foreign key violation
          throw new Error('Código de convite não encontrado.');
        }
        if (memberError.code === '23505') { // Unique violation
          throw new Error('Você já faz parte deste espaço.');
        }
        throw memberError;
      }
      
      // Sucesso!
      await refreshCouple();
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar no espaço.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl p-8 border border-stone-200/60 shadow-xl shadow-stone-200/20"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
            <Heart size={32} className="fill-orange-500 text-orange-500" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Seu Espaço</h1>
          <p className="text-stone-500 mt-2 text-sm">
            Para começar a usar o CoupleFlow, você precisa criar um espaço novo ou entrar no espaço do seu parceiro(a).
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {mode === 'choose' && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('create')}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-stone-200 hover:border-orange-500 hover:bg-orange-50 transition-all text-left"
            >
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 shrink-0">
                <Plus size={20} />
              </div>
              <div>
                <h3 className="font-medium text-stone-900">Criar novo espaço</h3>
                <p className="text-xs text-stone-500 mt-0.5">Serei o primeiro a entrar e gerarei o convite.</p>
              </div>
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-stone-200 hover:border-stone-800 hover:bg-stone-50 transition-all text-left"
            >
              <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 shrink-0">
                <LinkIcon size={20} />
              </div>
              <div>
                <h3 className="font-medium text-stone-900">Já tenho um convite</h3>
                <p className="text-xs text-stone-500 mt-0.5">Meu parceiro(a) já criou e me mandou o código.</p>
              </div>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Nome do Espaço (Opcional)</label>
              <input
                type="text"
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                placeholder="Ex: Nós Dois"
              />
            </div>
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setMode('choose')}
                disabled={loading}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium py-3 rounded-xl transition-colors"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar'}
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Código de Convite</label>
              <input
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors font-mono text-sm"
                placeholder="Cole o código aqui..."
              />
            </div>
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setMode('choose')}
                disabled={loading}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium py-3 rounded-xl transition-colors"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-stone-800 hover:bg-stone-900 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
