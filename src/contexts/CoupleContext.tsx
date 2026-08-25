import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Couple {
  id: string;
  name: string | null;
  anniversary_date: string | null;
}

interface CoupleContextType {
  couple: Couple | null;
  loadingCouple: boolean;
  refreshCouple: () => Promise<void>;
}

const CoupleContext = createContext<CoupleContextType | undefined>(undefined);

export function CoupleProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loadingCouple, setLoadingCouple] = useState(true);

  const fetchCouple = async () => {
    if (!session?.user) {
      setCouple(null);
      setLoadingCouple(false);
      return;
    }

    try {
      // Como o RLS só permite ver o casal se o usuário estiver em couple_members,
      // basta tentarmos buscar qualquer casal. Se retornar algo, ele tem um espaço.
      const { data, error } = await supabase
        .from('couples')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 é o erro de 'nenhuma linha encontrada', o que é normal se não tiver casal
        console.error('Erro ao buscar espaço do casal:', error);
      }

      setCouple(data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCouple(false);
    }
  };

  useEffect(() => {
    fetchCouple();
  }, [session]);

  const value = {
    couple,
    loadingCouple,
    refreshCouple: fetchCouple,
  };

  return (
    <CoupleContext.Provider value={value}>
      {children}
    </CoupleContext.Provider>
  );
}

export function useCouple() {
  const context = useContext(CoupleContext);
  if (context === undefined) {
    throw new Error('useCouple deve ser usado dentro de um CoupleProvider');
  }
  return context;
}
