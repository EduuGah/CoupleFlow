import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Couple {
  id: string;
  name: string | null;
  anniversary_date: string | null;
}

interface Member {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface CoupleContextType {
  couple: Couple | null;
  members: Record<string, Member>;
  loadingCouple: boolean;
  refreshCouple: () => Promise<void>;
}

const CoupleContext = createContext<CoupleContextType | undefined>(undefined);

export function CoupleProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [members, setMembers] = useState<Record<string, Member>>({});
  const [loadingCouple, setLoadingCouple] = useState(true);

  const fetchCouple = async () => {
    if (!session?.user) {
      setCouple(null);
      setMembers({});
      setLoadingCouple(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('couples')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar espaço do casal:', error);
      }

      setCouple(data || null);

      if (data) {
        // Busca os membros
        const { data: membersData, error: membersError } = await supabase
          .rpc('get_couple_members', { c_id: data.id });
          
        if (!membersError && membersData) {
          const membersMap = (membersData as Member[]).reduce((acc, member) => {
            acc[member.id] = member;
            return acc;
          }, {} as Record<string, Member>);
          setMembers(membersMap);
        }
      }
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
    members,
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
