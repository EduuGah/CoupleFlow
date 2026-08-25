-- =======================================================
-- SCRIPT CORRIGIDO PARA ETAPA 16 (COMENTÁRIOS) E ETAPA 17 (MEMÓRIAS/FOTOS)
-- Execute este script no SQL Editor do seu painel Supabase
-- =======================================================

-- 1. TABELA DE COMENTÁRIOS
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid REFERENCES public.plans(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS para comentários
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Remove políticas anteriores se existirem (para evitar erros ao reexecutar)
DROP POLICY IF EXISTS "Usuários podem ver comentários dos seus casais" ON public.comments;
DROP POLICY IF EXISTS "Usuários podem inserir comentários em seus planos" ON public.comments;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios comentários" ON public.comments;

-- Cria políticas corrigidas usando a tabela couple_members
CREATE POLICY "Usuários podem ver comentários dos seus casais" 
  ON public.comments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.plans p
      JOIN public.couple_members cm ON p.couple_id = cm.couple_id
      WHERE p.id = comments.plan_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir comentários em seus planos" 
  ON public.comments FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.plans p
      JOIN public.couple_members cm ON p.couple_id = cm.couple_id
      WHERE p.id = comments.plan_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar seus próprios comentários" 
  ON public.comments FOR DELETE 
  USING (auth.uid() = user_id);


-- 2. TABELA DE FOTOS (MEMÓRIAS)
CREATE TABLE IF NOT EXISTS public.plan_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid REFERENCES public.plans(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  storage_path text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS para fotos
ALTER TABLE public.plan_photos ENABLE ROW LEVEL SECURITY;

-- Remove políticas anteriores se existirem
DROP POLICY IF EXISTS "Usuários podem ver fotos dos seus casais" ON public.plan_photos;
DROP POLICY IF EXISTS "Usuários podem inserir fotos em seus planos" ON public.plan_photos;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias fotos" ON public.plan_photos;

-- Cria políticas de banco corrigidas usando couple_members
CREATE POLICY "Usuários podem ver fotos dos seus casais" 
  ON public.plan_photos FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.plans p
      JOIN public.couple_members cm ON p.couple_id = cm.couple_id
      WHERE p.id = plan_photos.plan_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir fotos em seus planos" 
  ON public.plan_photos FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.plans p
      JOIN public.couple_members cm ON p.couple_id = cm.couple_id
      WHERE p.id = plan_photos.plan_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar suas próprias fotos" 
  ON public.plan_photos FOR DELETE 
  USING (auth.uid() = user_id);


-- 3. BUCKET DE STORAGE (MEMORIES)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('memories', 'memories', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remove políticas de storage se existirem
DROP POLICY IF EXISTS "Visualização pública de fotos" ON storage.objects;
DROP POLICY IF EXISTS "Upload para memories por usuários logados" ON storage.objects;
DROP POLICY IF EXISTS "Usuários logados podem deletar fotos" ON storage.objects;

-- Cria políticas do storage para o bucket memories
CREATE POLICY "Visualização pública de fotos" 
  ON storage.objects FOR SELECT 
  USING ( bucket_id = 'memories' );

CREATE POLICY "Upload para memories por usuários logados" 
  ON storage.objects FOR INSERT 
  WITH CHECK ( bucket_id = 'memories' AND auth.role() = 'authenticated' );

CREATE POLICY "Usuários logados podem deletar fotos" 
  ON storage.objects FOR DELETE 
  USING ( bucket_id = 'memories' AND auth.role() = 'authenticated' );
