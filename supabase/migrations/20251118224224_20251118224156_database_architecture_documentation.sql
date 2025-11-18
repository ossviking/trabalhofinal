/*
  # Documentação da Arquitetura do Banco de Dados

  ## Descrição
  Este arquivo documenta a arquitetura completa do banco de dados do CentroRecursos,
  incluindo políticas RLS, triggers, e sincronização entre auth.users e public.users.

  ## Estrutura de Autenticação

  ### auth.users (Tabela do Supabase Auth)
  - Gerenciada automaticamente pelo Supabase Auth
  - Armazena credenciais e metadata de autenticação
  - ID único (uuid) para cada usuário

  ### public.users (Tabela de Perfis)
  - Armazena informações de perfil dos usuários
  - FK para auth.users(id) com ON DELETE CASCADE
  - Sincronizada automaticamente via trigger

  ## Sincronização Automática

  ### Trigger: on_auth_user_created
  - Dispara AFTER INSERT na tabela auth.users
  - Executa a função handle_new_user()
  - Cria automaticamente o perfil em public.users

  ### Função: handle_new_user()
  - Determina role baseado no email (admin para miguel.oliveira@universidade.edu.br)
  - Insere dados do perfil com valores padrão
  - Usa ON CONFLICT DO NOTHING para evitar duplicatas

  ## Políticas RLS (Row Level Security)

  ### Tabela: users
  1. "Allow authenticated users to read all profiles"
     - Tipo: SELECT
     - Regra: Todos os usuários autenticados podem ler todos os perfis
     - Motivo: Necessário para listagem de usuários, chat, etc.

  2. "Allow users to insert own profile"
     - Tipo: INSERT
     - Regra: auth.uid() = id
     - Motivo: Usuário só pode criar seu próprio perfil

  3. "Allow users to update own profile"
     - Tipo: UPDATE
     - Regra: auth.uid() = id (USING e WITH CHECK)
     - Motivo: Usuário só pode atualizar seu próprio perfil

  ### Tabela: resources
  - SELECT: Permitido para todos autenticados
  - ALL: Permitido para todos autenticados (simplificado para demo)
  - Nota: Em produção, restringir INSERT/UPDATE/DELETE apenas para admins

  ### Tabela: reservations
  - SELECT: Todos autenticados podem ver todas as reservas
  - INSERT: Usuário pode criar reservas para si mesmo
  - UPDATE: Usuário pode atualizar suas próprias reservas
  - DELETE: Usuário pode deletar suas próprias reservas

  ### Tabela: maintenance_tasks
  - SELECT: Permitido para todos autenticados
  - ALL: Permitido para todos autenticados (simplificado para demo)

  ### Tabela: messages
  - SELECT: Usuário pode ver mensagens onde é sender ou receiver
  - INSERT: Usuário pode enviar mensagens (auth.uid() = sender_id)

  ## Fluxo de Criação de Usuário

  1. Usuário se registra via Supabase Auth (signUp)
  2. Registro é criado em auth.users
  3. Trigger on_auth_user_created dispara
  4. Função handle_new_user() executa
  5. Perfil é criado em public.users
  6. Frontend carrega perfil via usersService.getProfile()

  ## Troubleshooting

  ### Problema: "Perfil não encontrado"
  - Verificar se usuário existe em auth.users
  - Verificar se trigger está habilitado
  - Verificar logs da função handle_new_user()
  - Executar manualmente: SELECT create_demo_user_profile(email, name, role, dept)

  ### Problema: "RLS Policy Error (PGRST301)"
  - Verificar se sessão está ativa (supabase.auth.getSession())
  - Verificar políticas RLS da tabela
  - Verificar se auth.uid() retorna valor correto

  ### Problema: "Conflito de políticas"
  - Listar políticas: SELECT * FROM pg_policies WHERE tablename = 'users'
  - Remover duplicadas se necessário
  - Recriar apenas políticas necessárias

  ## Manutenção

  ### Verificar Estado do Sistema
  ```sql
  -- Contar usuários em auth vs public
  SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users,
    (SELECT COUNT(*) FROM public.users) as public_users;

  -- Listar usuários sem perfil
  SELECT u.id, u.email 
  FROM auth.users u 
  LEFT JOIN public.users p ON u.id = p.id 
  WHERE p.id IS NULL;

  -- Sincronizar usuário específico
  SELECT create_demo_user_profile(
    'email@example.com',
    'Nome do Usuário',
    'student',
    'Departamento'
  );
  ```

  ## Notas de Segurança

  - RLS está habilitado em TODAS as tabelas
  - Políticas são PERMISSIVE (OR logic)
  - auth.uid() é usado para verificar identidade
  - SECURITY DEFINER usado em funções privilegiadas
  - Validações de CHECK constraint em colunas críticas

  ## Referências

  - Supabase Auth: https://supabase.com/docs/guides/auth
  - Row Level Security: https://supabase.com/docs/guides/auth/row-level-security
  - Database Functions: https://supabase.com/docs/guides/database/functions
*/

-- Esta migração é apenas documentação, sem alterações no schema
SELECT 'Database architecture documented successfully' as status;
