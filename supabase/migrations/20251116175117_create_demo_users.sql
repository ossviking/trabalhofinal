/*
  # Criar Usuários de Demonstração

  ## Descrição
  Cria os usuários demo para testar o sistema:
  1. Administrador: miguel.oliveira@universidade.edu.br
  2. Solicitante: joao.santos@universidade.edu.br

  ## Dados
  - Ambos os usuários terão a senha: 123
  - Os usuários serão criados no Supabase Auth e na tabela users
  - Email confirmation está desabilitado por padrão
*/

-- Criar usuários no Supabase Auth usando a extensão
-- NOTA: Esta parte precisa ser feita manualmente no Supabase Dashboard ou via API
-- Aqui vamos apenas criar os registros na tabela users assumindo que os IDs do auth já existem

-- Primeiro, vamos tentar inserir usuários na tabela public.users
-- usando IDs fixos que vamos criar no Supabase Auth

-- IMPORTANTE: Você precisa criar estes usuários manualmente no Supabase Dashboard:
-- Authentication > Users > Add user
-- 1. Email: miguel.oliveira@universidade.edu.br, Password: 123, Auto Confirm: Yes
-- 2. Email: joao.santos@universidade.edu.br, Password: 123, Auto Confirm: Yes

-- Depois de criar os usuários no Auth, execute esta migração novamente
-- ou crie os perfis manualmente usando os UUIDs gerados

-- Como alternativa, vamos criar uma função auxiliar para facilitar
CREATE OR REPLACE FUNCTION create_demo_user_profile(
  p_email text,
  p_name text,
  p_role text,
  p_department text
) RETURNS void AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Tenta buscar o user_id do auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
  
  -- Se o usuário existe no auth mas não na tabela users, cria o perfil
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.users (id, email, name, role, department)
    VALUES (v_user_id, p_email, p_name, p_role, p_department)
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        updated_at = now();
        
    RAISE NOTICE 'Perfil criado/atualizado para: %', p_email;
  ELSE
    RAISE NOTICE 'Usuário % não encontrado no auth.users. Crie primeiro no Supabase Dashboard.', p_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tentar criar os perfis (só funcionará se os usuários já existirem no auth.users)
DO $$
BEGIN
  PERFORM create_demo_user_profile(
    'miguel.oliveira@universidade.edu.br',
    'Miguel Oliveira',
    'admin',
    'Administração'
  );
  
  PERFORM create_demo_user_profile(
    'joao.santos@universidade.edu.br',
    'João Santos',
    'student',
    'Engenharia'
  );
END $$;

-- Criar alguns recursos de exemplo
INSERT INTO resources (name, category, description, location, image, quantity, specifications)
VALUES 
  ('Sala 101', 'rooms', 'Sala de aula com capacidade para 40 alunos', 'Bloco A - 1º andar', 'https://images.pexels.com/photos/2675061/pexels-photo-2675061.jpeg', 1, '{"capacity": 40, "equipment": ["projetor", "quadro branco"]}'::jsonb),
  ('Sala 102', 'rooms', 'Sala de reuniões com capacidade para 15 pessoas', 'Bloco A - 1º andar', 'https://images.pexels.com/photos/2977547/pexels-photo-2977547.jpeg', 1, '{"capacity": 15, "equipment": ["TV", "videoconferência"]}'::jsonb),
  ('Projetor Multimídia', 'av', 'Projetor Full HD com entrada HDMI', 'Almoxarifado Central', 'https://images.pexels.com/photos/2531608/pexels-photo-2531608.jpeg', 5, '{"resolution": "1920x1080", "brightness": "3000 lumens"}'::jsonb),
  ('Notebook Dell', 'equipment', 'Notebook Dell Inspiron 15 - Intel i5', 'Almoxarifado Central', 'https://images.pexels.com/photos/18105/pexels-photo.jpg', 10, '{"processor": "Intel i5", "ram": "8GB", "storage": "256GB SSD"}'::jsonb),
  ('Câmera DSLR', 'av', 'Câmera Canon EOS Rebel T7', 'Almoxarifado de AV', 'https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg', 3, '{"megapixels": "24.1MP", "video": "Full HD"}'::jsonb)
ON CONFLICT DO NOTHING;