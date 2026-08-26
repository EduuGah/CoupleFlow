-- 0. TABELA DE COMENTÁRIOS (Se ainda não existir)
CREATE TABLE IF NOT EXISTS public.plan_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.plan_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Membros podem ver comentários"
    ON public.plan_comments FOR SELECT
    USING (
      plan_id IN (
        SELECT p.id FROM public.plans p 
        JOIN public.couple_members cm ON p.couple_id = cm.couple_id 
        WHERE cm.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Membros podem inserir comentários"
    ON public.plan_comments FOR INSERT
    WITH CHECK (
      plan_id IN (
        SELECT p.id FROM public.plans p 
        JOIN public.couple_members cm ON p.couple_id = cm.couple_id 
        WHERE cm.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. TABELA DE NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Usuários podem ver suas próprias notificações"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Usuários podem atualizar suas próprias notificações (ex: marcar como lida)"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Sistema pode inserir notificações para o casal"
    ON public.notifications FOR INSERT
    WITH CHECK (
      couple_id IN (
        SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- FUNÇÕES E GATILHOS (TRIGGERS)

-- 2. Gatilho para quando um PLANO for CRIADO
CREATE OR REPLACE FUNCTION public.handle_new_plan()
RETURNS TRIGGER AS $$
DECLARE
  partner_id UUID;
BEGIN
  SELECT user_id INTO partner_id
  FROM public.couple_members
  WHERE couple_id = NEW.couple_id AND user_id != NEW.created_by_id
  LIMIT 1;

  IF partner_id IS NOT NULL THEN
    INSERT INTO public.notifications (couple_id, user_id, actor_id, plan_id, type)
    VALUES (NEW.couple_id, partner_id, NEW.created_by_id, NEW.id, 'plan_added');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_plan_created ON public.plans;
CREATE TRIGGER on_plan_created
  AFTER INSERT ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_plan();


-- 3. Gatilho para quando um PLANO for ATUALIZADO (Status)
CREATE OR REPLACE FUNCTION public.handle_plan_update()
RETURNS TRIGGER AS $$
DECLARE
  partner_id UUID;
  action_type TEXT;
  actor UUID;
BEGIN
  IF NEW.status != OLD.status THEN
    IF NEW.status = 'planejado' THEN
      action_type := 'plan_scheduled';
    ELSIF NEW.status = 'fizemos' THEN
      action_type := 'plan_completed';
    ELSE
      RETURN NEW;
    END IF;

    actor := auth.uid();

    SELECT user_id INTO partner_id
    FROM public.couple_members
    WHERE couple_id = NEW.couple_id AND user_id != actor
    LIMIT 1;

    IF partner_id IS NOT NULL THEN
      INSERT INTO public.notifications (couple_id, user_id, actor_id, plan_id, type)
      VALUES (NEW.couple_id, partner_id, actor, NEW.id, action_type);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_plan_updated ON public.plans;
CREATE TRIGGER on_plan_updated
  AFTER UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_plan_update();


-- 4. Gatilho para quando um COMENTÁRIO for adicionado
CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_couple_id UUID;
  partner_id UUID;
BEGIN
  SELECT couple_id INTO v_couple_id
  FROM public.plans
  WHERE id = NEW.plan_id;

  SELECT user_id INTO partner_id
  FROM public.couple_members
  WHERE couple_id = v_couple_id AND user_id != NEW.user_id
  LIMIT 1;

  IF partner_id IS NOT NULL THEN
    INSERT INTO public.notifications (couple_id, user_id, actor_id, plan_id, type)
    VALUES (v_couple_id, partner_id, NEW.user_id, NEW.plan_id, 'comment_added');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_created ON public.plan_comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.plan_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_comment();
