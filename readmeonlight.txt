1. Título e Descrição do Projeto
Título: Sistema Abrangente de Reserva e Empréstimo de Recursos (CentroRecursos)

Descrição:
O "CentroRecursos" é uma aplicação web desenvolvida para otimizar a gestão e o uso de recursos físicos em ambientes institucionais, como universidades, escolas ou empresas. O problema central que a aplicação busca resolver é a ineficiência e a falta de transparência nos processos manuais de reserva e empréstimo de ativos (salas, equipamentos, materiais audiovisuais).

A aplicação oferece uma plataforma centralizada onde usuários (estudantes, professores) podem solicitar a reserva de recursos, administradores podem gerenciar o catálogo de recursos, aprovar solicitações, agendar manutenções e monitorar o uso através de relatórios. Além disso, facilita a comunicação entre usuários e administradores por meio de um sistema de chat e notificações. O objetivo é garantir que os recursos sejam utilizados de forma eficiente, que a manutenção seja proativa e que os processos sejam transparentes e acessíveis a todos os envolvidos.

2. Análise de Requisitos
2.1. Requisitos Funcionais
RF1: Autenticação de Usuários: O sistema deve permitir que usuários (solicitantes e administradores) realizem login com e-mail e senha.
RF2: Gerenciamento de Perfis de Usuário: O sistema deve permitir a criação e o gerenciamento de perfis de usuário, incluindo ID, nome, e-mail, função (estudante, professor, administrador) e departamento.
RF3: Controle de Acesso Baseado em Função (RBAC):
RF3.1: Estudante: Deve poder visualizar o catálogo de recursos, fazer solicitações de reserva, acompanhar o status de suas próprias reservas e usar o chat para se comunicar com administradores.
RF3.2: Professor: Deve ter todas as permissões de estudante e, adicionalmente, poder aprovar ou rejeitar solicitações de reserva.
RF3.3: Administrador: Deve ter acesso total ao sistema, incluindo gerenciamento de recursos, usuários, aprovações, agendamento de manutenção, relatórios de uso e configurações do sistema.
RF4: Catálogo de Recursos: O sistema deve exibir um catálogo de recursos com detalhes como nome, categoria, descrição, status, localização, imagem, quantidade e especificações.
RF5: Busca e Filtragem de Recursos: O sistema deve permitir a busca de recursos por termo de pesquisa, categoria (salas, equipamentos, audiovisual) e status (disponível, reservado, manutenção).
RF6: Gerenciamento de Recursos (Admin): O administrador deve poder adicionar, editar e excluir recursos, bem como atualizar seu status e quantidade.
RF7: Solicitação de Reserva: Usuários devem poder preencher um formulário para solicitar a reserva de um recurso, especificando datas, horários, propósito, descrição, número de participantes, prioridade e requisitos especiais.
RF8: Verificação de Conflitos de Reserva: O sistema deve verificar automaticamente a disponibilidade do recurso e a existência de conflitos de agendamento (sobreposição de horários ou quantidade insuficiente) antes de permitir uma reserva.
RF9: Calendário de Reservas: O sistema deve exibir um calendário visual de reservas, permitindo a visualização por mês. (Visualizações por semana e dia são funcionalidades futuras).
RF10: Fluxo de Aprovação de Reservas: Administradores e professores devem poder revisar solicitações de reserva pendentes e aprová-las ou rejeitá-las.
RF11: Visualização de Reservas: Usuários devem poder visualizar suas próprias reservas. Administradores e professores devem poder visualizar todas as reservas.
RF12: Agendamento de Manutenção (Admin): O administrador deve poder criar e gerenciar tarefas de manutenção para recursos, especificando tipo, título, descrição, data agendada, duração estimada, status, prioridade, responsável e custo.
RF13: Atualização de Status de Manutenção: O administrador deve poder atualizar o status das tarefas de manutenção (agendada, em andamento, concluída, cancelada).
RF14: Relatórios de Uso: O sistema deve gerar relatórios e exibir estatísticas sobre o uso de recursos, incluindo total de reservas, taxa de aprovação, tendências mensais e utilização de recursos.
RF15: Atividade Recente: O painel deve exibir um feed de atividades recentes relacionadas a reservas.
RF16: Chat em Tempo Real: O sistema deve permitir a comunicação em tempo real entre usuários e administradores.
RF17: Central de Notificações: O sistema deve fornecer uma central de notificações para alertar os usuários sobre aprovações, lembretes, avisos e atualizações.
RF18: Configurações do Sistema (Admin): O administrador deve poder configurar diversas opções do sistema, como nome do sistema, fuso horário, formatos de data/hora, configurações de notificação (e-mail, push, tempo de lembrete), configurações de reserva (máximo de dias de antecedência, reservas simultâneas, limite de aprovação automática) e configurações de segurança (tempo limite de sessão, 2FA, log de auditoria).
2.2. Requisitos Não Funcionais
RNF1: Performance: O sistema deve ter tempos de resposta rápidos (inferiores a 2 segundos para 90% das operações) e consultas de banco de dados otimizadas.
RNF2: Segurança: O sistema deve garantir a segurança dos dados e do acesso, utilizando autenticação robusta, controle de acesso baseado em função (RBAC) e Row Level Security (RLS) no banco de dados.
RNF3: Usabilidade (UX): A interface do usuário deve ser intuitiva, fácil de navegar e responsiva em diferentes dispositivos (desktop, tablet, mobile).
RNF4: Confiabilidade: O sistema deve ser robusto, com tratamento de erros adequado e mensagens informativas para o usuário.
RNF5: Disponibilidade: O sistema deve estar disponível 99.9% do tempo.
RNF6: Escalabilidade: O sistema deve ser capaz de suportar um aumento no número de usuários e recursos sem degradação significativa de performance.
RNF7: Manutenibilidade: O código deve ser modular, legível, bem documentado e fácil de manter e estender.
RNF8: Portabilidade e Compatibilidade: O sistema deve ser compatível com os principais navegadores web modernos e independente de plataforma.
2.3. Regras de Negócio
RN1: E-mail Único: Cada usuário deve ter um e-mail institucional único para registro e login.
RN2: Papéis e Permissões: As permissões de acesso e funcionalidades disponíveis são estritamente definidas pelo papel do usuário (estudante, professor, administrador).
RN3: Admin Padrão: O e-mail miguel.oliveira@universidade.edu.br é automaticamente atribuído ao papel de administrador no primeiro login.
RN4: Categorias de Recursos Fixas: Os recursos são classificados em categorias predefinidas: "salas", "equipamentos" e "audiovisual".
RN5: Status de Recursos: O status de um recurso pode ser "disponível", "reservado" ou "manutenção".
RN6: Gerenciamento de Recursos (Admin): Apenas usuários com o papel de "administrador" podem adicionar, editar ou excluir recursos.
RN7: Validação de Datas/Horários de Reserva: A data e hora de término de uma reserva devem ser posteriores à data e hora de início.
RN8: Conflito de Agendamento: Uma reserva não pode ser aprovada se houver conflito de horário com outra reserva aprovada para o mesmo recurso, considerando a quantidade disponível do recurso.
RN9: Status Inicial da Reserva: Toda nova solicitação de reserva é criada com o status "pendente".
RN10: Aprovação de Reserva: Apenas usuários com os papéis de "administrador" ou "professor" podem aprovar ou rejeitar solicitações de reserva.
RN11: Chat entre Usuários e Admins: Estudantes e professores só podem iniciar conversas de chat com usuários que possuem o papel de "administrador". Administradores podem conversar com qualquer usuário.
RN12: Gerenciamento de Manutenção (Admin): Apenas usuários com o papel de "administrador" podem agendar e atualizar tarefas de manutenção.
RN13: Acesso a Configurações (Admin): Apenas usuários com o papel de "administrador" podem acessar e modificar as configurações do sistema.
2.4. Personas
Persona 1: João Santos (Estudante)

Idade: 21 anos
Ocupação: Estudante de Engenharia de Software
Objetivos:
Reservar salas de estudo para projetos em grupo.
Emprestar equipamentos de áudio e vídeo para apresentações.
Verificar rapidamente o status de suas reservas.
Comunicar-se com a administração em caso de dúvidas ou problemas.
Frustrações:
Processos de reserva manuais e demorados.
Dificuldade em saber a disponibilidade dos recursos.
Conflitos de agendamento de última hora.
Cenário de Uso: João precisa reservar uma sala de reunião para um projeto de grupo na próxima semana. Ele acessa o CentroRecursos, busca por salas disponíveis, seleciona um horário e envia a solicitação. Ele espera receber uma notificação quando a reserva for aprovada.
Persona 2: Dra. Ana Costa (Professora)

Idade: 45 anos
Ocupação: Professora de Design Gráfico e Coordenadora de Laboratório
Objetivos:
Reservar laboratórios de informática para suas aulas.
Aprovar ou rejeitar solicitações de reserva de seus alunos para equipamentos específicos.
Ter uma visão geral dos recursos disponíveis e ocupados.
Agendar manutenção para os equipamentos do laboratório.
Frustrações:
Dificuldade em gerenciar múltiplas solicitações de alunos.
Falta de visibilidade sobre o uso dos equipamentos.
Processos complexos para agendar manutenção.
Cenário de Uso: Dra. Ana recebe várias solicitações de alunos para usar as câmeras do laboratório. Ela acessa o painel de aprovações, verifica a disponibilidade e o propósito de cada solicitação, e aprova ou rejeita conforme a necessidade.
Persona 3: Miguel Oliveira (Administrador de Recursos)

Idade: 38 anos
Ocupação: Administrador de Recursos da Instituição
Objetivos:
Gerenciar todo o catálogo de recursos (adicionar, editar, remover).
Supervisionar todas as solicitações de reserva e aprovações.
Agendar e acompanhar todas as tarefas de manutenção.
Gerenciar usuários e suas permissões.
Gerar relatórios de uso para otimização de recursos.
Manter as configurações do sistema atualizadas.
Frustrações:
Falta de uma visão consolidada de todos os recursos e suas reservas.
Dificuldade em identificar gargalos ou recursos subutilizados.
Processos manuais para gerenciar usuários e permissões.
Cenário de Uso: Miguel precisa adicionar um novo lote de projetores ao sistema. Ele acessa a seção de gerenciamento de recursos, preenche os detalhes dos novos projetores, incluindo quantidade e especificações, e os torna disponíveis para reserva. Ele também verifica o relatório de uso para decidir se precisa adquirir mais equipamentos de áudio.
3. Modelos UML
3.1. Diagrama de Casos de Uso

graph TD
    actor A[Administrador]
    actor P[Professor]
    actor E[Estudante]

    rectangle Sistema {
        usecase UC1[Fazer Login]
        usecase UC2[Gerenciar Perfil]
        usecase UC3[Visualizar Catálogo de Recursos]
        usecase UC4[Buscar/Filtrar Recursos]
        usecase UC5[Solicitar Reserva de Recurso]
        usecase UC6[Visualizar Minhas Reservas]
        usecase UC7[Comunicar via Chat]
        usecase UC8[Receber Notificações]
        usecase UC9[Aprovar/Rejeitar Reserva]
        usecase UC10[Gerenciar Recursos]
        usecase UC11[Gerenciar Usuários]
        usecase UC12[Agendar/Gerenciar Manutenção]
        usecase UC13[Visualizar Relatórios de Uso]
        usecase UC14[Configurar Sistema]
        usecase UC15[Visualizar Todas as Reservas]
    }

    A -- (UC1)
    A -- (UC2)
    A -- (UC3)
    A -- (UC4)
    A -- (UC5)
    A -- (UC6)
    A -- (UC7)
    A -- (UC8)
    A -- (UC9)
    A -- (UC10)
    A -- (UC11)
    A -- (UC12)
    A -- (UC13)
    A -- (UC14)
    A -- (UC15)

    P -- (UC1)
    P -- (UC2)
    P -- (UC3)
    P -- (UC4)
    P -- (UC5)
    P -- (UC6)
    P -- (UC7)
    P -- (UC8)
    P -- (UC9)
    P -- (UC15)

    E -- (UC1)
    E -- (UC2)
    E -- (UC3)
    E -- (UC4)
    E -- (UC5)
    E -- (UC6)
    E -- (UC7)
    E -- (UC8)

    UC9 .> UC15 : extends
    UC10 .> UC3 : uses
    UC10 .> UC4 : uses
    UC12 .> UC3 : uses
    UC12 .> UC4 : uses
    UC13 .> UC15 : uses
3.2. Diagrama de Classes (Simplificado)
Este diagrama foca nas entidades principais e seus relacionamentos, refletindo o esquema do banco de dados.


classDiagram
    class User {
        +UUID id
        +String email
        +String name
        +Role role
        +String department
        +DateTime created_at
        +DateTime updated_at
    }

    class Resource {
        +UUID id
        +String name
        +Category category
        +String description
        +Status status
        +String location
        +String image
        +Integer quantity
        +JSONB specifications
        +DateTime created_at
        +DateTime updated_at
    }

    class Reservation {
        +UUID id
        +UUID user_id
        +UUID resource_id
        +DateTime start_date
        +DateTime end_date
        +String purpose
        +String description
        +Status status
        +Priority priority
        +Integer attendees
        +String requirements
        +DateTime created_at
        +DateTime updated_at
    }

    class MaintenanceTask {
        +UUID id
        +UUID resource_id
        +Type type
        +String title
        +String description
        +DateTime scheduled_date
        +Integer estimated_duration
        +Status status
        +Priority priority
        +String assigned_to
        +Numeric cost
        +String notes
        +DateTime created_at
        +DateTime updated_at
    }

    class Message {
        +UUID id
        +UUID sender_id
        +UUID receiver_id
        +String message_text
        +DateTime created_at
    }

    User "1" -- "*" Reservation : makes
    Resource "1" -- "*" Reservation : is_reserved
    Resource "1" -- "*" MaintenanceTask : requires
    User "1" -- "*" Message : sends
    User "1" -- "*" Message : receives

    enum Role {
        student
        faculty
        admin
    }

    enum Category {
        rooms
        equipment
        av
    }

    enum Status {
        available
        reserved
        maintenance
        pending
        approved
        rejected
        scheduled
        in-progress
        completed
        cancelled
    }

    enum Priority {
        low
        normal
        high
        urgent
        medium
        critical
    }

    enum Type {
        routine
        repair
        inspection
        upgrade
    }
3.3. Diagrama de Sequência (Exemplo: Aprovação de Reserva)

sequenceDiagram
    actor A as Administrador/Professor
    participant UI as ApprovalWorkflow (Frontend)
    participant RC as ReservationContext (Frontend)
    participant RS as reservationsService (Frontend)
    participant SA as Supabase API
    participant DB as PostgreSQL Database (Supabase)

    A->>UI: Clica em "Aprovar" para uma reserva pendente
    UI->>RC: Chama updateReservationStatus(reservaId, 'approved')
    RC->>RS: Chama reservationsService.updateStatus(reservaId, 'approved')
    RS->>SA: Requisição PATCH para /reservations/{reservaId} com status='approved'
    SA->>DB: Atualiza o campo 'status' da reserva
    DB-->>SA: Retorna reserva atualizada
    SA-->>RS: Retorna reserva atualizada
    RS-->>RC: Retorna reserva atualizada
    RC->>RC: Atualiza estado local de reservas
    RC-->>UI: Notifica sucesso
    UI->>A: Atualiza a UI, reserva aparece como "Aprovada"
3.4. Diagrama de Atividades (Exemplo: Fazer uma Nova Reserva)

graph TD
    start((Start)) --> A[Acessar Formulário de Solicitação]
    A --> B{Recurso Selecionado?}
    B -- Não --> A
    B -- Sim --> C[Preencher Detalhes da Reserva (Datas, Horários, Propósito)]
    C --> D{Dados Válidos?}
    D -- Não --> C
    D -- Sim --> E[Verificar Conflito de Agendamento]
    E --> F{Conflito Detectado?}
    F -- Sim --> G[Exibir Mensagem de Erro de Conflito]
    G --> C
    F -- Não --> H[Enviar Solicitação de Reserva]
    H --> I[Sistema Cria Reserva com Status 'Pendente']
    I --> J[Notificar Usuário sobre Solicitação Enviada]
    J --> K[Notificar Administrador/Professor sobre Nova Solicitação]
    K --> end((End))
4. Definição das Tecnologias Envolvidas
Frontend:
Framework: React (v18.3.1)
Linguagem: TypeScript (v5.5.3)
Build Tool/Dev Server: Vite (v5.4.2)
Estilização: Tailwind CSS (v3.4.1) com PostCSS e Autoprefixer
Roteamento: React Router DOM (v7.7.1)
Ícones: Lucide React (v0.344.0)
Gerenciamento de Estado: React Context API
Backend-as-a-Service (BaaS):
Plataforma: Supabase
Banco de Dados: PostgreSQL
Autenticação: Supabase Auth
APIs: Supabase RESTful API
Realtime: Supabase Realtime (WebSockets)
Client Library: @supabase/supabase-js (v2.53.0)
Ambiente de Desenvolvimento:
Linter: ESLint com plugins para React Hooks e TypeScript
Editor: VS Code (com extensões para React, TypeScript, Tailwind CSS)
Versionamento: Git (não diretamente integrado no WebContainer, mas padrão para desenvolvimento)
5. Esboço da Arquitetura Geral
O "CentroRecursos" adota uma arquitetura Cliente-Servidor com uma abordagem Backend-as-a-Service (BaaS).

Camada de Apresentação (Frontend - Cliente):
Desenvolvida em React com TypeScript, Tailwind CSS e Vite.
Responsável pela interface do usuário, lógica de apresentação e interação.
Utiliza a Context API do React para gerenciamento de estado global (usuário, reservas, chat).
Possui uma camada de serviços (src/services/database.ts) que abstrai as chamadas à API do Supabase.
O roteamento é gerenciado pelo React Router DOM.
Camada de Negócio e Dados (Backend - Supabase BaaS):
O Supabase atua como o backend, fornecendo um banco de dados PostgreSQL gerenciado.
Expõe APIs RESTful para acesso aos dados e funcionalidades de autenticação.
Oferece capacidades de tempo real (WebSockets) para funcionalidades como o chat.
A lógica de negócio é parcialmente implementada no frontend (validações, fluxos de UI) e parcialmente no banco de dados através de políticas de Row Level Security (RLS) e, futuramente, funções/triggers.
A autenticação de usuários é totalmente gerenciada pelo Supabase Auth.
Diagrama de Arquitetura (Revisado):


graph LR
    subgraph Cliente (Frontend)
        A[Navegador Web] --> B(React SPA)
        B --> C{Componentes UI}
        B --> D{Context API}
        B --> E[Camada de Serviços]
    end

    subgraph Backend (Supabase BaaS)
        F[Supabase Auth]
        G[Supabase Database (PostgreSQL)]
        H[Supabase Realtime]
        I[Supabase Storage]
    end

    E -- API Calls (REST) --> F
    E -- API Calls (REST) --> G
    E -- Realtime Subscriptions --> H
    E -- (Futuro) File Uploads --> I

    G -- RLS Policies --> G
6. Esquema do Banco de Dados
6.1. Diagrama Entidade Relacionamento (DER)

erDiagram
    USERS {
        uuid id PK
        text email UK
        text name
        text role
        text department
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }

    RESOURCES {
        uuid id PK
        text name
        text category
        text description
        text status
        text location
        text image
        jsonb specifications
        integer quantity
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }

    RESERVATIONS {
        uuid id PK
        uuid user_id FK "USERS"
        uuid resource_id FK "RESOURCES"
        timestamp_with_time_zone start_date
        timestamp_with_time_zone end_date
        text purpose
        text description
        text status
        text priority
        integer attendees
        text requirements
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }

    MAINTENANCE_TASKS {
        uuid id PK
        uuid resource_id FK "RESOURCES"
        text type
        text title
        text description
        timestamp_with_time_zone scheduled_date
        integer estimated_duration
        text status
        text priority
        text assigned_to
        numeric cost
        text notes
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }

    MESSAGES {
        uuid id PK
        uuid sender_id FK "USERS"
        uuid receiver_id FK "USERS"
        text message_text
        timestamp_with_time_zone created_at
    }
6.2. Script de Criação das Tabelas Principais (SQL)

-- Enable uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: public.users
CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text NOT NULL UNIQUE,
    name text NOT NULL,
    role text NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
    department text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for users
CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);
CREATE INDEX idx_users_email ON public.users USING btree (email);

-- RLS Policies for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);


-- Table: public.resources
CREATE TABLE public.resources (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    category text NOT NULL CHECK (category IN ('rooms', 'equipment', 'av')),
    description text NOT NULL,
    status text DEFAULT 'available' NOT NULL CHECK (status IN ('available', 'reserved', 'maintenance')),
    location text NOT NULL,
    image text NOT NULL,
    specifications jsonb,
    quantity integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for resources
CREATE INDEX idx_resources_category ON public.resources USING btree (category);
CREATE INDEX idx_resources_status ON public.resources USING btree (status);

-- RLS Policies for resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage resources" ON public.resources FOR ALL USING (EXISTS ( SELECT 1 FROM users WHERE (users.id = auth.uid() AND users.role = 'admin'::text))) WITH CHECK (EXISTS ( SELECT 1 FROM users WHERE (users.id = auth.uid() AND users.role = 'admin'::text)));
CREATE POLICY "Authenticated users can view resources" ON public.resources FOR SELECT USING (true);


-- Table: public.reservations
CREATE TABLE public.reservations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    purpose text NOT NULL,
    description text,
    status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    priority text DEFAULT 'normal' NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    attendees integer,
    requirements text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for reservations
CREATE INDEX idx_reservations_resource_id ON public.reservations USING btree (resource_id);
CREATE INDEX idx_reservations_status ON public.reservations USING btree (status);
CREATE INDEX idx_reservations_user_id ON public.reservations USING btree (user_id);

-- RLS Policies for reservations
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create reservations" ON public.reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reservations" ON public.reservations FOR UPDATE USING ((auth.uid() = user_id) OR (EXISTS ( SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND ((users.role = 'admin'::text) OR (users.role = 'faculty'::text))))) ) WITH CHECK ((auth.uid() = user_id) OR (EXISTS ( SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND ((users.role = 'admin'::text) OR (users.role = 'faculty'::text))))));
CREATE POLICY "Users can view their own reservations" ON public.reservations FOR SELECT USING ((auth.uid() = user_id) OR (EXISTS ( SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND ((users.role = 'admin'::text) OR (users.role = 'faculty'::text))))));


-- Table: public.maintenance_tasks
CREATE TABLE public.maintenance_tasks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('routine', 'repair', 'inspection', 'upgrade')),
    title text NOT NULL,
    description text NOT NULL,
    scheduled_date timestamp with time zone NOT NULL,
    estimated_duration integer NOT NULL,
    status text DEFAULT 'scheduled' NOT NULL CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
    priority text DEFAULT 'low' NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assigned_to text,
    cost numeric(10,2),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for maintenance_tasks
CREATE INDEX idx_maintenance_tasks_resource_id ON public.maintenance_tasks USING btree (resource_id);
CREATE INDEX idx_maintenance_tasks_status ON public.maintenance_tasks USING btree (status);

-- RLS Policies for maintenance_tasks
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage maintenance tasks" ON public.maintenance_tasks FOR ALL USING (EXISTS ( SELECT 1 FROM users WHERE (users.id = auth.uid() AND users.role = 'admin'::text))) WITH CHECK (EXISTS ( SELECT 1 FROM users WHERE (users.id = auth.uid() AND users.role = 'admin'::text)));
CREATE POLICY "Authenticated users can view maintenance tasks" ON public.maintenance_tasks FOR SELECT USING (true);


-- Table: public.messages
CREATE TABLE public.messages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id uuid NOT NULL REFERENCES public.users(id),
    receiver_id uuid NOT NULL REFERENCES public.users(id),
    message_text text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS Policies for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can view their own messages" ON public.messages FOR SELECT USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id) OR (EXISTS ( SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text)))));
CREATE POLICY "Admins can update messages" ON public.messages FOR UPDATE USING (EXISTS ( SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text))));
CREATE POLICY "Admins can delete messages" ON public.messages FOR DELETE USING (EXISTS ( SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text))));
7. Wireframes ou Protótipo Navegável
Não consigo gerar arquivos de wireframes ou protótipos navegáveis (como Figma ou Adobe XD) diretamente. No entanto, posso descrever os principais wireframes que seriam criados para este projeto:

Tela de Login/Seleção de Perfil:
Duas opções claras: "Acessar como Solicitante" e "Acessar como Administrador".
Campos de e-mail e senha para cada tipo de login.
Botões de "Esqueceu a senha?" e "Lembrar-me".
Dashboard (Painel Principal):
Visão geral com cartões de estatísticas (reservas ativas, pendentes, recursos disponíveis).
Seção de "Minhas Próximas Reservas" (para solicitantes) ou "Reservas Futuras do Sistema" (para admins).
Feed de "Atividade Recente".
Seção de "Ações Rápidas" (ex: Reservar Equipamento, Reservar Sala, Verificar Status).
Catálogo de Recursos:
Barra de pesquisa e filtros por categoria e status.
Exibição dos recursos em formato de cartão, com imagem, nome, descrição breve, quantidade e status.
Botões de "Reservar" e "Detalhes" em cada cartão.
Formulário de Solicitação de Reserva:
Campos para seleção de recurso, datas, horários, propósito, descrição, participantes, prioridade e requisitos.
Validação em tempo real e feedback de conflitos.
Botão de "Enviar Solicitação".
Calendário de Reservas:
Visualização mensal com dias do mês.
Reservas exibidas como blocos coloridos nos dias correspondentes.
Botões de navegação entre meses.
Botão "Nova Reserva".
Fluxo de Aprovação (Admin/Professor):
Lista de solicitações de reserva pendentes.
Detalhes de cada solicitação (recurso, usuário, datas, propósito).
Botões de "Aprovar" e "Rejeitar" para cada solicitação.
Opção para adicionar comentários.
Gerenciamento de Recursos (Admin):
Tabela listando todos os recursos com opções de busca e filtro.
Botões para "Adicionar Recurso", "Editar" e "Excluir".
Formulário modal para adicionar/editar recursos com todos os campos relevantes (nome, categoria, descrição, status, localização, imagem URL, quantidade, especificações).
Gerenciamento de Usuários (Admin):
Tabela listando todos os usuários com opções de busca e filtro por papel.
Detalhes do usuário (nome, e-mail, papel, departamento).
Botões para "Editar" e "Excluir" usuário.
Agendador de Manutenção (Admin):
Lista de tarefas de manutenção com opções de busca e filtro por status.
Detalhes da tarefa (recurso, tipo, título, data, duração, status, prioridade).
Botões para "Agendar Tarefa", "Editar" e "Atualizar Status".
Relatórios de Uso (Admin):
Cartões de métricas chave (total de reservas, taxa de aprovação).
Gráficos de tendências (ex: reservas mensais).
Tabela detalhada de utilização de recursos.
Opções de filtro por período e categoria.
Chat:
Lista de conversas (para admins) ou administradores disponíveis (para solicitantes).
Área de mensagens com histórico e campo de entrada de texto.
Central de Notificações:
Lista de notificações com tipo, título, mensagem e status (lida/não lida).
Opções para marcar como lida ou excluir.
Configurações do Sistema (Admin):
Interface com abas para diferentes categorias de configurações (Geral, Notificações, Reservas, Segurança, Integrações).
Campos de entrada e toggles para ajustar as configurações.
Para criar os wireframes ou um protótipo navegável, você pode usar ferramentas como Figma, Adobe XD, Sketch ou Miro.