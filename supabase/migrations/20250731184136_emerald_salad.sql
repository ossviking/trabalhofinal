/*
  # Criar mensagens de exemplo para demonstrar o chat

  1. Mensagens de Exemplo
    - Conversa entre administrador e solicitante
    - Mensagens bidirecionais para demonstrar funcionalidade
    - Timestamps realistas

  2. Dados de Exemplo
    - Administrador: miguel.oliveira@universidade.edu.br
    - Solicitante: joao.santos@universidade.edu.br
    - Conversa sobre reserva de equipamento
*/

-- Inserir mensagens de exemplo entre administrador e solicitante
DO $$
DECLARE
    admin_user_id uuid;
    student_user_id uuid;
BEGIN
    -- Buscar IDs dos usuários
    SELECT id INTO admin_user_id FROM users WHERE email = 'miguel.oliveira@universidade.edu.br' LIMIT 1;
    SELECT id INTO student_user_id FROM users WHERE email = 'joao.santos@universidade.edu.br' LIMIT 1;
    
    -- Verificar se os usuários existem
    IF admin_user_id IS NULL OR student_user_id IS NULL THEN
        RAISE NOTICE 'Usuários não encontrados. Certifique-se de que os usuários existem na tabela users.';
        RETURN;
    END IF;
    
    -- Inserir mensagens de exemplo (conversa sobre reserva de equipamento)
    INSERT INTO messages (sender_id, receiver_id, message_text, created_at) VALUES
    -- Solicitante inicia a conversa
    (student_user_id, admin_user_id, 'Olá! Gostaria de solicitar a reserva de uma câmera para um projeto acadêmico.', NOW() - INTERVAL '2 hours'),
    
    -- Administrador responde
    (admin_user_id, student_user_id, 'Olá João! Claro, posso ajudar com isso. Para quando você precisa da câmera?', NOW() - INTERVAL '1 hour 50 minutes'),
    
    -- Solicitante responde
    (student_user_id, admin_user_id, 'Preciso para a próxima terça-feira, das 14h às 18h. É para gravar um documentário sobre sustentabilidade.', NOW() - INTERVAL '1 hour 40 minutes'),
    
    -- Administrador confirma
    (admin_user_id, student_user_id, 'Perfeito! Temos a Canon EOS R5 disponível para esse horário. Vou aprovar sua solicitação.', NOW() - INTERVAL '1 hour 30 minutes'),
    
    -- Solicitante agradece
    (student_user_id, admin_user_id, 'Muito obrigado! Onde devo retirar o equipamento?', NOW() - INTERVAL '1 hour 20 minutes'),
    
    -- Administrador informa local
    (admin_user_id, student_user_id, 'Você pode retirar na sala de equipamentos (Sala 205) na terça às 13:30. Lembre-se de trazer um documento com foto.', NOW() - INTERVAL '1 hour 10 minutes'),
    
    -- Solicitante confirma
    (student_user_id, admin_user_id, 'Perfeito! Estarei lá às 13:30 com meu RG. Obrigado pela ajuda! 😊', NOW() - INTERVAL '1 hour'),
    
    -- Administrador finaliza
    (admin_user_id, student_user_id, 'De nada! Boa sorte com o documentário. Qualquer dúvida, é só chamar aqui no chat.', NOW() - INTERVAL '50 minutes');
    
    RAISE NOTICE 'Mensagens de exemplo criadas com sucesso!';
END $$;