/*
  # Sistema de Sugestões Inteligentes por IA - Tabelas Principais

  ## Descrição
  Esta migração cria a infraestrutura completa para o sistema de IA integrado,
  incluindo sugestões inteligentes, chat de IA, análise de padrões e feedback.

  ## Novas Tabelas

  ### 1. `ai_suggestions`
  Armazena todas as sugestões geradas pela IA
  - `id` (uuid, primary key)
  - `reservation_id` (uuid, foreign key opcional - referência a reserva)
  - `user_id` (uuid, foreign key - usuário que recebeu sugestão)
  - `suggestion_type` (text - tipo: equipment, alternative_room, lesson_structure, etc)
  - `suggestion_text` (text - conteúdo da sugestão)
  - `confidence_score` (integer - 0-100, confiança da IA)
  - `metadata` (jsonb - dados adicionais contextuais)
  - `applied` (boolean - se usuário aceitou/aplicou sugestão)
  - `created_at` (timestamptz)

  ### 2. `resource_usage_patterns`
  Armazena padrões agregados de uso de recursos para análise preditiva
  - `id` (uuid, primary key)
  - `resource_id` (uuid, foreign key)
  - `pattern_type` (text - hourly, daily, weekly, monthly)
  - `time_slot` (text - representação do período)
  - `usage_count` (integer - número de vezes usado)
  - `average_duration` (integer - duração média em minutos)
  - `common_purposes` (jsonb - propósitos mais comuns)
  - `last_updated` (timestamptz)

  ### 3. `ai_suggestion_feedback`
  Rastreia feedback dos usuários sobre sugestões para aprendizado
  - `id` (uuid, primary key)
  - `suggestion_id` (uuid, foreign key)
  - `user_id` (uuid, foreign key)
  - `feedback_type` (text - useful, not_useful, applied, dismissed)
  - `comment` (text opcional - comentário do usuário)
  - `created_at` (timestamptz)

  ### 4. `ai_chat_context`
  Armazena contexto e histórico de conversas com IA
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `conversation_history` (jsonb - histórico de mensagens)
  - `context_metadata` (jsonb - metadados contextuais)
  - `last_interaction` (timestamptz)
  - `created_at` (timestamptz)

  ### 5. `ai_audit_log`
  Logs de auditoria para todas interações com IA
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `action_type` (text - suggestion_generated, chat_message, feedback_given)
  - `details` (jsonb - detalhes da ação)
  - `api_cost_estimate` (numeric - custo estimado em USD)
  - `created_at` (timestamptz)

  ## Segurança
  - RLS habilitado em todas as tabelas
  - Políticas para usuários autenticados acessarem apenas seus próprios dados
  - Administradores têm acesso completo para análise
*/

-- Tabela de sugestões de IA
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  suggestion_type text NOT NULL,
  suggestion_text text NOT NULL,
  confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100) DEFAULT 50,
  metadata jsonb DEFAULT '{}'::jsonb,
  applied boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Tabela de padrões de uso de recursos
CREATE TABLE IF NOT EXISTS resource_usage_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES resources(id) ON DELETE CASCADE NOT NULL,
  pattern_type text NOT NULL CHECK (pattern_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  time_slot text NOT NULL,
  usage_count integer DEFAULT 0,
  average_duration integer DEFAULT 0,
  common_purposes jsonb DEFAULT '[]'::jsonb,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(resource_id, pattern_type, time_slot)
);

-- Tabela de feedback de sugestões
CREATE TABLE IF NOT EXISTS ai_suggestion_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid REFERENCES ai_suggestions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  feedback_type text NOT NULL CHECK (feedback_type IN ('useful', 'not_useful', 'applied', 'dismissed')),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de contexto de chat com IA
CREATE TABLE IF NOT EXISTS ai_chat_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  conversation_history jsonb DEFAULT '[]'::jsonb,
  context_metadata jsonb DEFAULT '{}'::jsonb,
  last_interaction timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Tabela de auditoria de IA
CREATE TABLE IF NOT EXISTS ai_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  api_cost_estimate numeric(10,6) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_reservation_id ON ai_suggestions(reservation_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_created_at ON ai_suggestions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resource_usage_patterns_resource_id ON resource_usage_patterns(resource_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestion_feedback_suggestion_id ON ai_suggestion_feedback(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_context_user_id ON ai_chat_context(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_user_id ON ai_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_created_at ON ai_audit_log(created_at DESC);

-- Habilitar RLS
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_usage_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestion_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ai_suggestions
CREATE POLICY "Users can view own AI suggestions"
  ON ai_suggestions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI suggestions"
  ON ai_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all AI suggestions"
  ON ai_suggestions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Políticas RLS para resource_usage_patterns
CREATE POLICY "Authenticated users can view usage patterns"
  ON resource_usage_patterns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage usage patterns"
  ON resource_usage_patterns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Políticas RLS para ai_suggestion_feedback
CREATE POLICY "Users can view own feedback"
  ON ai_suggestion_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON ai_suggestion_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON ai_suggestion_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Políticas RLS para ai_chat_context
CREATE POLICY "Users can view own chat context"
  ON ai_chat_context FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own chat context"
  ON ai_chat_context FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para ai_audit_log
CREATE POLICY "Users can view own audit logs"
  ON ai_audit_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON ai_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all audit logs"
  ON ai_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );