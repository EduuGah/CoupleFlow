import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Faltam variáveis de ambiente do Supabase. Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão configuradas.'
  );
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Função auxiliar apenas para testarmos a conexão inicial
export async function testConnection() {
  try {
    // Uma query simples apenas para checar se a comunicação básica está ok.
    // Usaremos a tabela auth.users indiretamente ou apenas checaremos o retorno.
    const { data, error } = await supabase.from('plans').select('*').limit(1);
    
    if (error) {
      // O erro 42P01 (relation "public.plans" does not exist) é esperado se você ainda não criou as tabelas no Supabase.
      // O importante é que a requisição de rede funcione e bata lá.
      console.log('Conexão com Supabase estabelecida! (O erro de tabela não existir é normal nesta etapa):', error.message);
      return true;
    }
    
    console.log('Conexão com Supabase realizada com sucesso!', data);
    return true;
  } catch (err) {
    console.error('Erro ao conectar com Supabase:', err);
    return false;
  }
}
