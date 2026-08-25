import { useState } from 'react';
import { mockCouple } from '../data';
import { motion } from 'motion/react';
import { Heart, Settings, LogOut, Copy, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCouple } from '../contexts/CoupleContext';

export function Profile() {
  const { signOut, user } = useAuth();
  const { couple } = useCouple();
  const [copied, setCopied] = useState(false);

  const copyInviteCode = () => {
    if (couple?.id) {
      navigator.clipboard.writeText(couple.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Nosso Perfil</h1>
      </header>

      <section className="bg-white rounded-3xl p-6 border border-stone-200/60 shadow-sm text-center relative overflow-hidden">
        <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart size={32} className="fill-orange-500 text-orange-500" />
        </div>
        <h2 className="text-xl font-medium text-stone-900">
          {couple?.name || 'Nosso Espaço'}
        </h2>
        <p className="text-stone-500 mt-1 text-sm">
          {user?.user_metadata?.name || user?.email}
        </p>

        {/* Invite Code Area */}
        <div className="mt-6 pt-6 border-t border-stone-100">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Código de Convite</p>
          <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl p-2 pl-4">
            <code className="text-stone-600 font-mono text-xs truncate max-w-[200px]">
              {couple?.id || 'Carregando...'}
            </code>
            <button
              onClick={copyInviteCode}
              className="p-2 bg-white rounded-lg border border-stone-200 hover:border-orange-500 hover:text-orange-600 transition-colors text-stone-400"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider px-2">Configurações</h3>
        
        <div className="bg-white rounded-2xl border border-stone-200/60 overflow-hidden shadow-sm">
          <button className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors border-b border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                <Settings size={18} />
              </div>
              <span className="font-medium text-stone-800">Preferências</span>
            </div>
            <span className="text-stone-400">›</span>
          </button>
          
          <button 
            onClick={signOut}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <LogOut size={18} />
              </div>
              <span className="font-medium text-red-600">Sair da conta</span>
            </div>
          </button>
        </div>
      </section>
    </motion.div>
  );
}
