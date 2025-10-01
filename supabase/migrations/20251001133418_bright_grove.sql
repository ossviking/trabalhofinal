/*
  # Criar sistema de pacotes de recursos

  1. Novas Tabelas
    - `resource_packages`
      - `id` (uuid, primary key)
      - `name` (text, nome do pacote)
      - `description` (text, descrição do pacote)
      - `subject` (text, assunto/matéria)
      - `created_by` (uuid, referência ao usuário criador)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `package_resources`
      - `id` (uuid, primary key)
      - `package_id` (uuid, referência ao pacote)
      - `resource_id` (uuid, referência ao recurso)
      - `quantity_needed` (integer, quantidade necessária)
      - `created_at` (timestamp)

  2. Segurança
    - Enable RLS em ambas as tabelas
    - Políticas para visualização (todos autenticados)
    - Políticas para criação/edição (admins e professores)
    - Políticas para exclusão (criador ou admin)

  3. Índices
    - Índices para melhor performance nas consultas
*/

-- Criar tabela de pacotes de recursos
CREATE TABLE IF NOT EXISTS resource_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  subject text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Criar tabela de recursos do pacote (junção)
CREATE TABLE IF NOT EXISTS package_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES resource_packages(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  quantity_needed integer NOT NULL DEFAULT 1 CHECK (quantity_needed > 0),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(package_id, resource_id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_resource_packages_created_by ON resource_packages(created_by);
CREATE INDEX IF NOT EXISTS idx_resource_packages_subject ON resource_packages(subject);
CREATE INDEX IF NOT EXISTS idx_package_resources_package_id ON package_resources(package_id);
CREATE INDEX IF NOT EXISTS idx_package_resources_resource_id ON package_resources(resource_id);

-- Habilitar RLS
ALTER TABLE resource_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_resources ENABLE ROW LEVEL SECURITY;

-- Políticas para resource_packages
CREATE POLICY "Authenticated users can view resource packages"
  ON resource_packages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and faculty can create resource packages"
  ON resource_packages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'faculty')
    )
  );

CREATE POLICY "Admins and faculty can update their own resource packages"
  ON resource_packages
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins and faculty can delete their own resource packages"
  ON resource_packages
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Políticas para package_resources
CREATE POLICY "Authenticated users can view package resources"
  ON package_resources
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and faculty can manage package resources"
  ON package_resources
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resource_packages rp
      WHERE rp.id = package_resources.package_id
      AND (
        rp.created_by = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM resource_packages rp
      WHERE rp.id = package_resources.package_id
      AND (
        rp.created_by = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      )
    )
  );