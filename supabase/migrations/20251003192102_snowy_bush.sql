/*
  # Sistema de Solicitação de Redefinição de Senha

  1. Nova Tabela
    - `password_reset_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key para users)
      - `user_email` (text, email do usuário)
      - `user_name` (text, nome do usuário)
      - `status` (text, status da solicitação)
      - `requested_at` (timestamp)
      - `processed_at` (timestamp, quando foi processada)
      - `processed_by` (uuid, admin que processou)
      - `notes` (text, observações do admin)

  2. Segurança
    - Enable RLS na tabela `password_reset_requests`
    - Políticas para usuários criarem suas próprias solicitações
    - Políticas para admins gerenciarem todas as solicitações
    - Políticas para usuários visualizarem suas próprias solicitações
*/

-- Criar tabela de solicitações de redefinição de senha
CREATE TABLE IF NOT EXISTS password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  user_name text NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'rejected')),
  requested_at timestamp with time zone DEFAULT now() NOT NULL,
  processed_at timestamp with time zone,
  processed_by uuid REFERENCES users(id),
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_user_id ON password_reset_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_status ON password_reset_requests(status);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_requested_at ON password_reset_requests(requested_at);

-- Habilitar RLS
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Política para usuários criarem suas próprias solicitações
CREATE POLICY "Users can create their own password reset requests"
  ON password_reset_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários visualizarem suas próprias solicitações
CREATE POLICY "Users can view their own password reset requests"
  ON password_reset_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ));

-- Política para admins gerenciarem todas as solicitações
CREATE POLICY "Admins can manage all password reset requests"
  ON password_reset_requests
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ));

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_password_reset_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_password_reset_requests_updated_at ON password_reset_requests;
CREATE TRIGGER update_password_reset_requests_updated_at
  BEFORE UPDATE ON password_reset_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_password_reset_requests_updated_at();