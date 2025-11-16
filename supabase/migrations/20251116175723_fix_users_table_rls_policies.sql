/*
  # Corrigir Políticas RLS da Tabela Users

  ## Descrição
  Garante que as políticas RLS da tabela users estão configuradas corretamente
  para permitir que todos os usuários autenticados possam ler todos os perfis.

  ## Mudanças
  1. Remove políticas antigas que podem estar causando conflitos
  2. Recria políticas simples e funcionais
  3. Garante que SELECT funcione para todos os usuários autenticados

  ## Segurança
  - Mantém RLS habilitado
  - Permite SELECT para todos autenticados
  - INSERT e UPDATE apenas para o próprio usuário
*/

-- Remove políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;

-- Garante que RLS está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Cria política para permitir que todos os usuários autenticados leiam todos os perfis
CREATE POLICY "Allow authenticated users to read all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Cria política para permitir que usuários criem seu próprio perfil
CREATE POLICY "Allow users to insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Cria política para permitir que usuários atualizem seu próprio perfil
CREATE POLICY "Allow users to update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
