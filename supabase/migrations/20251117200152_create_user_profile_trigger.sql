/*
  # Criar Trigger de Sincronização de Perfil de Usuário

  1. Função e Trigger
    - Cria função `handle_new_user()` que é acionada quando um novo usuário é criado em auth.users
    - Cria automaticamente um perfil correspondente na tabela public.users
    - Determina o role baseado no email (admin para miguel.oliveira, student para outros)
    - Define departamento padrão como 'Geral'

  2. Segurança
    - Função executada com SECURITY DEFINER para ter permissões adequadas
    - Garante que todo usuário autenticado tenha um perfil correspondente
    - Previne erros de perfil não encontrado após login

  3. Notas Importantes
    - Este trigger é executado APÓS a inserção de um novo usuário em auth.users
    - O ID do perfil em public.users será o mesmo ID do auth.users
    - Se o perfil já existir, o trigger não fará nada (protegido por foreign key)
*/

-- Criar função para lidar com novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Determinar o role baseado no email
  IF NEW.email ILIKE '%miguel.oliveira%' THEN
    user_role := 'admin';
  ELSE
    user_role := 'student';
  END IF;

  -- Inserir novo perfil na tabela users
  INSERT INTO public.users (id, email, name, role, department)
  VALUES (
    NEW.id,
    LOWER(NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    user_role,
    COALESCE(NEW.raw_user_meta_data->>'department', 'Geral')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para executar após inserção em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();