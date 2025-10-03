/*
  # Permitir Solicitações Anônimas de Redefinição de Senha

  1. Alterações
    - Tornar o campo `user_id` opcional (nullable)
    - Adicionar política para permitir inserções anônimas
    - Remover restrição de autenticação para criar solicitações

  2. Segurança
    - Usuários anônimos podem criar solicitações apenas com email
    - Admins continuam gerenciando todas as solicitações
    - RLS mantém segurança para visualização
*/

-- Tornar user_id opcional
ALTER TABLE password_reset_requests 
ALTER COLUMN user_id DROP NOT NULL;

-- Remover política antiga de inserção
DROP POLICY IF EXISTS "Users can create their own password reset requests" ON password_reset_requests;

-- Nova política para permitir inserções anônimas
CREATE POLICY "Anyone can create password reset requests"
  ON password_reset_requests
  FOR INSERT
  WITH CHECK (true);

-- Atualizar política de visualização para incluir solicitações sem user_id
DROP POLICY IF EXISTS "Users can view their own password reset requests" ON password_reset_requests;

CREATE POLICY "Users can view their own password reset requests"
  ON password_reset_requests
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR user_email = (SELECT email FROM users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Política para usuários anônimos não poderem visualizar
CREATE POLICY "Anonymous users cannot view password reset requests"
  ON password_reset_requests
  FOR SELECT
  TO anon
  USING (false);