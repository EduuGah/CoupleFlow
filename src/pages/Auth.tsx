import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, KeyRound, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { DEMO_ACCOUNTS, resolveLoginEmail } from '../lib/demo';

export function Auth() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Se já estiver logado, redireciona para a home
  if (session) {
    return <Navigate to="/" replace />;
  }

  const signIn = async (identifier: string, secret: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: resolveLoginEmail(identifier),
        password: secret,
      });
      if (error) throw error;
    } catch (err: any) {
      setError(
        err?.message === 'Invalid login credentials'
          ? 'Usuário ou senha incorretos.'
          : err?.message || 'Ocorreu um erro na autenticação.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(email, password);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl p-8 border border-stone-200/60 shadow-xl shadow-stone-200/20"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 mb-4 relative">
            <img src="/icon.svg" alt="CoupleFlow Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">CoupleFlow</h1>
          <p className="text-stone-500 mt-1 text-sm">
            Bem-vindo de volta!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login" className="block text-sm font-medium text-stone-700 mb-1">E-mail ou usuário</label>
            <input
              id="login"
              type="text"
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-stone-700 mb-1">Senha</label>
            <input
              id="senha"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-xl transition-colors shadow-sm shadow-orange-600/20 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
          </button>
        </form>

        <section
          aria-labelledby="demo-titulo"
          className="mt-6 rounded-2xl border border-dashed border-orange-300 bg-orange-50/60 p-4"
        >
          <h2 id="demo-titulo" className="flex items-center gap-2 text-sm font-semibold text-stone-800">
            <KeyRound className="w-4 h-4 text-orange-600" aria-hidden="true" />
            Testar sem criar conta
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Entre como uma das duas pessoas do casal. Abra a outra numa aba anônima para ver os
            planos e as notificações chegando para os dois.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.username}
                type="button"
                disabled={loading}
                onClick={() => signIn(account.username, account.password)}
                className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-medium text-stone-800 hover:border-orange-400 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Entrar como {account.name}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-stone-500">
            Ou digite usuário <strong>admin</strong> e senha <strong>admin</strong> (a outra pessoa é{' '}
            <strong>parceiro</strong> / <strong>parceiro</strong>).
          </p>
        </section>
      </motion.div>
    </div>
  );
}
