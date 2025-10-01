/*
  # Inserir dados de exemplo para pacotes de recursos
  
  Este script cria alguns pacotes de exemplo para testar o sistema.
  Execute apenas após aplicar a migração create_resource_packages_complete.sql
*/

-- Inserir pacotes de exemplo (usando o ID do admin miguel.oliveira@universidade.edu.br)
DO $$
DECLARE
    admin_id uuid;
    physics_package_id uuid;
    chemistry_package_id uuid;
    math_package_id uuid;
    projector_id uuid;
    laptop_id uuid;
    camera_id uuid;
    room_101_id uuid;
    room_102_id uuid;
BEGIN
    -- Buscar o ID do administrador
    SELECT id INTO admin_id FROM users WHERE email = 'miguel.oliveira@universidade.edu.br' LIMIT 1;
    
    -- Se não encontrar o admin, usar um ID genérico (você pode ajustar)
    IF admin_id IS NULL THEN
        admin_id := gen_random_uuid();
    END IF;
    
    -- Buscar alguns recursos existentes
    SELECT id INTO projector_id FROM resources WHERE name ILIKE '%projetor%' LIMIT 1;
    SELECT id INTO laptop_id FROM resources WHERE name ILIKE '%laptop%' OR name ILIKE '%computador%' LIMIT 1;
    SELECT id INTO camera_id FROM resources WHERE name ILIKE '%camera%' OR name ILIKE '%câmera%' LIMIT 1;
    SELECT id INTO room_101_id FROM resources WHERE category = 'rooms' LIMIT 1;
    SELECT id INTO room_102_id FROM resources WHERE category = 'rooms' OFFSET 1 LIMIT 1;
    
    -- Criar pacote de Física
    INSERT INTO resource_packages (id, name, description, subject, created_by)
    VALUES (
        gen_random_uuid(),
        'Kit Laboratório de Física',
        'Pacote completo para experimentos de física básica incluindo sala, projetor e equipamentos de medição.',
        'Física',
        admin_id
    ) RETURNING id INTO physics_package_id;
    
    -- Criar pacote de Química
    INSERT INTO resource_packages (id, name, description, subject, created_by)
    VALUES (
        gen_random_uuid(),
        'Kit Laboratório de Química',
        'Conjunto de recursos para aulas práticas de química com equipamentos de segurança.',
        'Química',
        admin_id
    ) RETURNING id INTO chemistry_package_id;
    
    -- Criar pacote de Matemática
    INSERT INTO resource_packages (id, name, description, subject, created_by)
    VALUES (
        gen_random_uuid(),
        'Kit Aula de Matemática',
        'Recursos audiovisuais para aulas de matemática com apresentações interativas.',
        'Matemática',
        admin_id
    ) RETURNING id INTO math_package_id;
    
    -- Adicionar recursos ao pacote de Física (se os recursos existirem)
    IF projector_id IS NOT NULL THEN
        INSERT INTO package_resources (package_id, resource_id, quantity_needed)
        VALUES (physics_package_id, projector_id, 1);
    END IF;
    
    IF room_101_id IS NOT NULL THEN
        INSERT INTO package_resources (package_id, resource_id, quantity_needed)
        VALUES (physics_package_id, room_101_id, 1);
    END IF;
    
    -- Adicionar recursos ao pacote de Química
    IF laptop_id IS NOT NULL THEN
        INSERT INTO package_resources (package_id, resource_id, quantity_needed)
        VALUES (chemistry_package_id, laptop_id, 1);
    END IF;
    
    IF room_102_id IS NOT NULL THEN
        INSERT INTO package_resources (package_id, resource_id, quantity_needed)
        VALUES (chemistry_package_id, room_102_id, 1);
    END IF;
    
    -- Adicionar recursos ao pacote de Matemática
    IF projector_id IS NOT NULL THEN
        INSERT INTO package_resources (package_id, resource_id, quantity_needed)
        VALUES (math_package_id, projector_id, 1);
    END IF;
    
    IF camera_id IS NOT NULL THEN
        INSERT INTO package_resources (package_id, resource_id, quantity_needed)
        VALUES (math_package_id, camera_id, 1);
    END IF;
    
END $$;