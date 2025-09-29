/*
  # Atualizar política de inserção de usuários

  1. Alterações na Política
    - Modifica a política "Users can insert own profile" para permitir que administradores criem perfis para outros usuários
    - Mantém a capacidade dos usuários criarem seus próprios perfis
    - Adiciona permissão para usuários com role 'admin' criarem perfis para qualquer pessoa

  2. Segurança
    - A política verifica se o usuário atual é o dono do perfil OU se é um administrador
    - Administradores são identificados pela role 'admin' na tabela users
*/

-- Remove a política existente
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Cria a nova política que permite admins criarem usuários
CREATE POLICY "Users can insert own profile" 
ON public.users 
FOR INSERT 
WITH CHECK (
  (auth.uid() = id) OR 
  (EXISTS (
    SELECT 1 
    FROM users users_1 
    WHERE (
      (users_1.id = auth.uid()) AND 
      (users_1.role = 'admin'::text)
    )
  ))
);