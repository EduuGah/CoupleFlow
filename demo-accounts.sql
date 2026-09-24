-- =======================================================
-- CONTAS DE DEMONSTRAÇÃO (testar sem criar conta)
--
--   usuário admin     senha admin     -> Ana
--   usuário parceiro  senha parceiro  -> Léo
--
-- As duas pessoas formam o casal "Ana & Léo". A tela de entrada tem um botão
-- para cada uma e aceita o usuário curto: "admin" vira admin@demo.coupleflow.app
-- (src/lib/demo.ts).
--
-- Execute este script no SQL Editor do seu painel Supabase, depois das
-- tabelas do app. Pode rodar de novo: as senhas voltam ao padrão, e os planos
-- de exemplo só são criados se o casal estiver sem nenhum.
-- =======================================================

CREATE OR REPLACE FUNCTION pg_temp.demo_auth_user(p_email text, p_password text, p_name text)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM auth.users WHERE lower(email) = lower(p_email);

  IF v_id IS NULL THEN
    v_id := gen_random_uuid();

    -- Tokens vazios (e não nulos) são exigidos pelo GoTrue: com NULL o login
    -- falha com "Database error querying schema".
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', p_email,
      extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('name', p_name), now(), now(),
      '', '', '', '', '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), v_id, v_id::text, 'email',
      jsonb_build_object('sub', v_id::text, 'email', p_email, 'email_verified', true),
      now(), now(), now()
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        banned_until = null,
        -- O nome é o que o app mostra ("Olá, Ana"); volta ao padrão.
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('name', p_name),
        updated_at = now()
    WHERE id = v_id;
  END IF;

  RETURN v_id;
END;
$$;

DO $$
DECLARE
  v_ana uuid;
  v_leo uuid;
  v_couple uuid;
BEGIN
  v_ana := pg_temp.demo_auth_user('admin@demo.coupleflow.app', 'admin', 'Ana');
  v_leo := pg_temp.demo_auth_user('parceiro@demo.coupleflow.app', 'parceiro', 'Léo');

  SELECT couple_id INTO v_couple FROM public.couple_members WHERE user_id = v_ana LIMIT 1;

  IF v_couple IS NULL THEN
    v_couple := gen_random_uuid();
    INSERT INTO public.couples (id, name) VALUES (v_couple, 'Ana & Léo');
    INSERT INTO public.couple_members (couple_id, user_id) VALUES (v_couple, v_ana);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.couple_members WHERE couple_id = v_couple AND user_id = v_leo) THEN
    INSERT INTO public.couple_members (couple_id, user_id) VALUES (v_couple, v_leo);
  END IF;

  -- Alguns planos para a tela não abrir vazia: um de cada estado.
  IF NOT EXISTS (SELECT 1 FROM public.plans WHERE couple_id = v_couple) THEN
    INSERT INTO public.plans (couple_id, created_by_id, title, description, category, status, priority, planned_date, completed_at)
    VALUES
      (v_couple, v_ana, 'Jantar no italiano da esquina', 'Aquele que abriu mês passado', 'Comer', 'planejado', 'alta', now() + interval '3 days', null),
      (v_couple, v_leo, 'Maratonar a trilogia do Senhor dos Anéis', 'Versão estendida, com pipoca', 'Assistir', 'quero_fazer', 'media', null, null),
      (v_couple, v_ana, 'Trilha até a cachoeira', 'Sair cedo e levar lanche', 'Visitar', 'quero_fazer', 'baixa', null, null),
      (v_couple, v_leo, 'Aula de cerâmica juntos', null, 'Fazer', 'fizemos', 'media', now() - interval '10 days', now() - interval '10 days');
  END IF;
END;
$$;
