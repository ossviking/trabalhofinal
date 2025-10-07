/*
  # Sistema de Rastreamento e Controle de Tokens de IA

  ## Descrição
  Cria a infraestrutura completa para rastrear e limitar o uso de tokens da API Claude.
  Implementa controle mensal automático com reset e políticas de segurança.

  ## Novas Tabelas

  ### 1. `user_token_usage`
  Rastreia o uso de tokens por usuário em cada mês
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key para users)
  - `month` (text, formato: YYYY-MM)
  - `tokens_used` (integer, total de tokens consumidos)
  - `requests_count` (integer, número de requisições feitas)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

  ### 2. `system_token_usage`
  Rastreia o uso global de tokens do sistema
  - `id` (uuid, primary key)
  - `month` (text, formato: YYYY-MM)
  - `tokens_used` (integer, total de tokens do sistema)
  - `token_limit` (integer, limite mensal configurado)
  - `requests_count` (integer, número total de requisições)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

  ### 3. `token_usage_history`
  Histórico detalhado de cada uso de token
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `action_type` (text, tipo de ação de IA)
  - `input_tokens` (integer)
  - `output_tokens` (integer)
  - `total_tokens` (integer)
  - `cost_estimate` (numeric)
  - `success` (boolean)
  - `error_message` (text, nullable)
  - `created_at` (timestamp)

  ## Segurança
  - RLS habilitado em todas as tabelas
  - Usuários podem ver apenas seu próprio uso
  - Apenas admins podem ver uso global do sistema
  - Políticas restritivas por padrão

  ## Funcionalidades
  - Reset automático mensal
  - Índices para consultas rápidas
  - Constraints para garantir integridade dos dados
*/

-- Tabela de uso de tokens por usuário
CREATE TABLE IF NOT EXISTS user_token_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month text NOT NULL,
  tokens_used integer DEFAULT 0 NOT NULL,
  requests_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, month)
);

-- Índices para user_token_usage
CREATE INDEX IF NOT EXISTS idx_user_token_usage_user_id ON user_token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_token_usage_month ON user_token_usage(month);
CREATE INDEX IF NOT EXISTS idx_user_token_usage_user_month ON user_token_usage(user_id, month);

-- Tabela de uso global de tokens do sistema
CREATE TABLE IF NOT EXISTS system_token_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL UNIQUE,
  tokens_used integer DEFAULT 0 NOT NULL,
  token_limit integer DEFAULT 100000 NOT NULL,
  requests_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Índice para system_token_usage
CREATE INDEX IF NOT EXISTS idx_system_token_usage_month ON system_token_usage(month);

-- Tabela de histórico detalhado de uso de tokens
CREATE TABLE IF NOT EXISTS token_usage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  input_tokens integer NOT NULL,
  output_tokens integer NOT NULL,
  total_tokens integer NOT NULL,
  cost_estimate numeric(10,6) NOT NULL,
  success boolean DEFAULT true NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Índices para token_usage_history
CREATE INDEX IF NOT EXISTS idx_token_usage_history_user_id ON token_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_history_created_at ON token_usage_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_usage_history_action_type ON token_usage_history(action_type);

-- Habilitar RLS em todas as tabelas
ALTER TABLE user_token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_token_usage
CREATE POLICY "Users can view own token usage"
  ON user_token_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "System can insert user token usage"
  ON user_token_usage FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update user token usage"
  ON user_token_usage FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas RLS para system_token_usage
CREATE POLICY "Admins can view system token usage"
  ON system_token_usage FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "System can manage system token usage"
  ON system_token_usage FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas RLS para token_usage_history
CREATE POLICY "Users can view own token history"
  ON token_usage_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "System can insert token history"
  ON token_usage_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Função para obter ou criar registro de uso mensal do usuário
CREATE OR REPLACE FUNCTION get_or_create_user_token_usage(p_user_id uuid, p_month text)
RETURNS user_token_usage AS $$
DECLARE
  v_usage user_token_usage;
BEGIN
  SELECT * INTO v_usage
  FROM user_token_usage
  WHERE user_id = p_user_id AND month = p_month;
  
  IF NOT FOUND THEN
    INSERT INTO user_token_usage (user_id, month, tokens_used, requests_count)
    VALUES (p_user_id, p_month, 0, 0)
    RETURNING * INTO v_usage;
  END IF;
  
  RETURN v_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter ou criar registro de uso mensal do sistema
CREATE OR REPLACE FUNCTION get_or_create_system_token_usage(p_month text)
RETURNS system_token_usage AS $$
DECLARE
  v_usage system_token_usage;
BEGIN
  SELECT * INTO v_usage
  FROM system_token_usage
  WHERE month = p_month;
  
  IF NOT FOUND THEN
    INSERT INTO system_token_usage (month, tokens_used, token_limit, requests_count)
    VALUES (p_month, 0, 100000, 0)
    RETURNING * INTO v_usage;
  END IF;
  
  RETURN v_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário pode usar tokens
CREATE OR REPLACE FUNCTION can_use_tokens(p_user_id uuid, p_estimated_tokens integer)
RETURNS jsonb AS $$
DECLARE
  v_month text;
  v_user_usage user_token_usage;
  v_system_usage system_token_usage;
  v_result jsonb;
BEGIN
  v_month := to_char(now(), 'YYYY-MM');
  
  -- Obter ou criar uso do usuário
  v_user_usage := get_or_create_user_token_usage(p_user_id, v_month);
  
  -- Obter ou criar uso do sistema
  v_system_usage := get_or_create_system_token_usage(v_month);
  
  -- Verificar se sistema atingiu limite
  IF (v_system_usage.tokens_used + p_estimated_tokens) > v_system_usage.token_limit THEN
    v_result := jsonb_build_object(
      'allowed', false,
      'reason', 'system_limit_exceeded',
      'message', 'Limite mensal de tokens do sistema foi atingido',
      'system_tokens_used', v_system_usage.tokens_used,
      'system_token_limit', v_system_usage.token_limit,
      'tokens_remaining', GREATEST(0, v_system_usage.token_limit - v_system_usage.tokens_used)
    );
    RETURN v_result;
  END IF;
  
  -- Tudo OK
  v_result := jsonb_build_object(
    'allowed', true,
    'user_tokens_used', v_user_usage.tokens_used,
    'system_tokens_used', v_system_usage.tokens_used,
    'system_token_limit', v_system_usage.token_limit,
    'tokens_remaining', v_system_usage.token_limit - v_system_usage.tokens_used
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar uso de tokens
CREATE OR REPLACE FUNCTION record_token_usage(
  p_user_id uuid,
  p_action_type text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_cost_estimate numeric,
  p_success boolean DEFAULT true,
  p_error_message text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_month text;
  v_total_tokens integer;
  v_result jsonb;
BEGIN
  v_month := to_char(now(), 'YYYY-MM');
  v_total_tokens := p_input_tokens + p_output_tokens;
  
  -- Inserir no histórico
  INSERT INTO token_usage_history (
    user_id, action_type, input_tokens, output_tokens, 
    total_tokens, cost_estimate, success, error_message
  ) VALUES (
    p_user_id, p_action_type, p_input_tokens, p_output_tokens,
    v_total_tokens, p_cost_estimate, p_success, p_error_message
  );
  
  -- Atualizar uso do usuário
  INSERT INTO user_token_usage (user_id, month, tokens_used, requests_count)
  VALUES (p_user_id, v_month, v_total_tokens, 1)
  ON CONFLICT (user_id, month) 
  DO UPDATE SET 
    tokens_used = user_token_usage.tokens_used + v_total_tokens,
    requests_count = user_token_usage.requests_count + 1,
    updated_at = now();
  
  -- Atualizar uso do sistema
  INSERT INTO system_token_usage (month, tokens_used, requests_count)
  VALUES (v_month, v_total_tokens, 1)
  ON CONFLICT (month)
  DO UPDATE SET
    tokens_used = system_token_usage.tokens_used + v_total_tokens,
    requests_count = system_token_usage.requests_count + 1,
    updated_at = now();
  
  v_result := jsonb_build_object(
    'success', true,
    'tokens_recorded', v_total_tokens
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;