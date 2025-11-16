/*
  # Esquema Inicial - CentroRecursos

  ## Descrição
  Cria todas as tabelas básicas necessárias para o sistema de reserva de recursos

  ## Tabelas

  ### 1. users
  Perfis de usuários do sistema
  - `id` (uuid, primary key) - ID do usuário do Supabase Auth
  - `email` (text, unique, not null) - Email do usuário
  - `name` (text, not null) - Nome completo
  - `role` (text, not null) - Papel: student, faculty, admin
  - `department` (text, not null) - Departamento
  - `created_at` (timestamptz) - Data de criação
  - `updated_at` (timestamptz) - Data de atualização

  ### 2. resources
  Recursos disponíveis para reserva
  - `id` (uuid, primary key)
  - `name` (text, not null) - Nome do recurso
  - `category` (text, not null) - Categoria: rooms, equipment, av
  - `description` (text, not null) - Descrição
  - `status` (text, default 'available') - Status: available, reserved, maintenance
  - `location` (text, not null) - Localização
  - `image` (text, not null) - URL da imagem
  - `quantity` (integer, default 1) - Quantidade disponível
  - `specifications` (jsonb) - Especificações técnicas
  - `created_at` (timestamptz) - Data de criação
  - `updated_at` (timestamptz) - Data de atualização

  ### 3. reservations
  Reservas de recursos
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - Usuário que fez a reserva
  - `resource_id` (uuid, foreign key) - Recurso reservado
  - `start_date` (timestamptz, not null) - Data/hora início
  - `end_date` (timestamptz, not null) - Data/hora fim
  - `purpose` (text, not null) - Propósito da reserva
  - `description` (text) - Descrição adicional
  - `status` (text, default 'pending') - Status: pending, approved, rejected
  - `priority` (text, default 'normal') - Prioridade: low, normal, high, urgent
  - `attendees` (integer) - Número de participantes
  - `requirements` (text) - Requisitos especiais
  - `created_at` (timestamptz) - Data de criação
  - `updated_at` (timestamptz) - Data de atualização

  ### 4. maintenance_tasks
  Tarefas de manutenção dos recursos
  - `id` (uuid, primary key)
  - `resource_id` (uuid, foreign key) - Recurso em manutenção
  - `type` (text, not null) - Tipo: routine, repair, inspection, upgrade
  - `title` (text, not null) - Título da tarefa
  - `description` (text, not null) - Descrição detalhada
  - `scheduled_date` (timestamptz, not null) - Data agendada
  - `estimated_duration` (integer, not null) - Duração estimada em minutos
  - `status` (text, default 'scheduled') - Status: scheduled, in-progress, completed, cancelled
  - `priority` (text, default 'medium') - Prioridade: low, medium, high, critical
  - `assigned_to` (text) - Responsável
  - `cost` (numeric) - Custo estimado
  - `notes` (text) - Observações
  - `created_at` (timestamptz) - Data de criação
  - `updated_at` (timestamptz) - Data de atualização

  ### 5. messages
  Mensagens entre usuários
  - `id` (uuid, primary key)
  - `sender_id` (uuid, foreign key) - Usuário remetente
  - `receiver_id` (uuid, foreign key) - Usuário destinatário
  - `message_text` (text, not null) - Conteúdo da mensagem
  - `created_at` (timestamptz) - Data de criação

  ## Segurança (RLS)
  - Enable RLS em todas as tabelas
  - Políticas de acesso baseadas em autenticação e roles
*/

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
  department text NOT NULL DEFAULT 'Geral',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Criar tabela de recursos
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('rooms', 'equipment', 'av')),
  description text NOT NULL,
  status text DEFAULT 'available' NOT NULL CHECK (status IN ('available', 'reserved', 'maintenance')),
  location text NOT NULL,
  image text NOT NULL,
  quantity integer DEFAULT 1 NOT NULL CHECK (quantity >= 0),
  specifications jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Criar tabela de reservas
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  resource_id uuid REFERENCES resources(id) ON DELETE CASCADE NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  purpose text NOT NULL,
  description text,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  priority text DEFAULT 'normal' NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  attendees integer CHECK (attendees >= 0),
  requirements text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Criar tabela de manutenção
CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES resources(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('routine', 'repair', 'inspection', 'upgrade')),
  title text NOT NULL,
  description text NOT NULL,
  scheduled_date timestamptz NOT NULL,
  estimated_duration integer NOT NULL CHECK (estimated_duration > 0),
  status text DEFAULT 'scheduled' NOT NULL CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
  priority text DEFAULT 'medium' NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to text,
  cost numeric CHECK (cost >= 0),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Criar tabela de mensagens
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message_text text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can read all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Políticas para resources
CREATE POLICY "Anyone authenticated can view resources"
  ON resources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage resources"
  ON resources FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para reservations
CREATE POLICY "Users can view all reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reservations"
  ON reservations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reservations"
  ON reservations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para maintenance_tasks
CREATE POLICY "Anyone authenticated can view maintenance"
  ON maintenance_tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage maintenance"
  ON maintenance_tasks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para messages
CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_resource_id ON reservations(resource_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_resource_id ON maintenance_tasks(resource_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);