# Configuração do Sistema de IA

Este documento explica como configurar e usar o Sistema de Sugestões Inteligentes por IA integrado ao sistema de gestão de recursos.

## Visão Geral

O sistema de IA oferece:
- **Sugestões inteligentes** durante o preenchimento de formulários de reserva
- **Chat com assistente IA** para responder perguntas sobre recursos e planejamento
- **Dashboard de insights** para administradores visualizarem métricas e padrões

## Configuração Inicial

### 1. Obter Chave de API da Anthropic

1. Acesse [console.anthropic.com](https://console.anthropic.com)
2. Crie uma conta ou faça login
3. Navegue até **API Keys** no menu
4. Clique em **Create Key**
5. Copie a chave gerada (começa com `sk-ant-`)

### 2. Configurar Variável de Ambiente

**IMPORTANTE**: Para produção, configure a chave no Supabase, não apenas no arquivo `.env` local.

#### Para Desenvolvimento Local:
1. Abra o arquivo `.env` na raiz do projeto
2. Adicione a seguinte linha:
   ```
   VITE_ANTHROPIC_API_KEY=sua_chave_api_aqui
   ```
3. Salve o arquivo
4. Reinicie o servidor de desenvolvimento se estiver rodando

#### Para Produção (Supabase):
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Navegue até **Settings** > **Edge Functions** > **Secrets**
4. Clique em **Add Secret**
5. Configure:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: Sua chave da API (sem o prefixo VITE_)
6. Clique em **Save**
7. Aguarde alguns segundos para a variável ser propagada

### 3. Verificar Configuração

Para verificar se a configuração está correta:
1. Faça login no sistema
2. Abra o chat e clique na aba "Assistente IA"
3. Clique em **"Diagnóstico do Sistema"** (botão amarelo)
4. Analise o relatório gerado:
   - ✅ Verde/SUCCESS: Componente funcionando
   - ⚠️ Amarelo/WARNING: Componente com avisos
   - ❌ Vermelho/ERROR: Componente com problemas
5. Se todos os componentes estiverem verdes, envie uma mensagem de teste
6. Se houver problemas, consulte [AI_TROUBLESHOOTING.md](./AI_TROUBLESHOOTING.md)

## Funcionalidades

### 1. Sugestões no Formulário de Requisição

Ao preencher um formulário de reserva, o sistema automaticamente:

- **Analisa capacidade**: Verifica se a sala suporta o número de participantes
- **Sugere equipamentos**: Recomenda equipamentos baseado no propósito da aula
- **Sugere salas alternativas**: Encontra outras salas disponíveis se houver conflito
- **Gera estrutura de aula**: Cria timeline de aula com seções e duração

**Como usar:**
1. Vá para "Nova Solicitação"
2. Preencha os campos: Propósito, Participantes, Recurso, Datas
3. Aguarde 1 segundo após digitar
4. Sugestões aparecerão automaticamente abaixo do formulário
5. Clique em "Sim/Não" para dar feedback
6. Use botões de ação rápida para aplicar sugestões

### 2. Chat com Assistente IA

Um assistente inteligente disponível 24/7 para ajudar com:
- Consulta de disponibilidade de recursos
- Sugestões de equipamentos para tipos específicos de aula
- Planejamento e estruturação de aulas
- Dicas de uso otimizado de recursos

**Como usar:**
1. Clique no ícone de chat (canto inferior direito)
2. Clique na aba "Assistente IA"
3. Digite sua pergunta ou use uma das sugestões rápidas
4. Aguarde a resposta (geralmente 2-5 segundos)

**Exemplos de perguntas:**
- "Quais salas estão disponíveis hoje à tarde?"
- "Preciso de equipamento para uma aula prática de química"
- "Como organizar uma aula de laboratório para 30 alunos?"
- "Qual é o melhor horário para reservar o auditório?"

### 3. Dashboard de Insights (Administradores)

Painel exclusivo para administradores visualizarem:
- Total de sugestões geradas
- Taxa de aplicação de sugestões
- Confiança média das sugestões
- Feedback dos usuários
- Padrões de uso de recursos
- Recomendações de otimização

**Como acessar:**
1. Faça login como administrador
2. Clique em "Insights de IA" no menu
3. Visualize métricas e gráficos
4. Clique em "Atualizar Análise" para processar padrões de uso

## Tipos de Sugestões

### 1. Aviso de Capacidade
Alerta quando o número de participantes excede a capacidade da sala.

### 2. Sugestão de Equipamentos
Lista de equipamentos recomendados baseado no propósito da aula.

### 3. Salas Alternativas
Lista de salas disponíveis que atendem aos requisitos.

### 4. Estrutura de Aula Simples
Timeline básica com 3-5 seções principais da aula.

### 5. Estrutura de Aula Detalhada
Timeline completa com metodologias, atividades e recursos por etapa.

## Rate Limiting e Custos

### Limites
- **10 solicitações por minuto** por usuário
- Implementado para evitar custos excessivos
- Mensagem de erro se limite for excedido

### Estimativa de Custos
O sistema usa o modelo **Claude Sonnet 4.5** da Anthropic:
- Input: $3 por 1M tokens
- Output: $15 por 1M tokens

**Custos aproximados:**
- Sugestão simples: ~$0.001 - $0.003
- Chat: ~$0.005 - $0.015 por mensagem
- Estrutura de aula detalhada: ~$0.01 - $0.03

**Para 1000 usuários ativos/mês:**
- Uso médio: $50 - $200/mês
- Uso intenso: $200 - $500/mês

## Banco de Dados

O sistema cria automaticamente as seguintes tabelas:

1. **ai_suggestions**: Armazena todas as sugestões geradas
2. **resource_usage_patterns**: Padrões de uso agregados
3. **ai_suggestion_feedback**: Feedback dos usuários
4. **ai_chat_context**: Histórico de conversas
5. **ai_audit_log**: Logs de auditoria e custos

## Segurança e Privacidade

- ✅ RLS (Row Level Security) habilitado em todas as tabelas
- ✅ Usuários só acessam seus próprios dados
- ✅ Administradores têm acesso para análise agregada
- ✅ Chave de API armazenada apenas em variável de ambiente
- ✅ Rate limiting para prevenir abuso
- ✅ Logs de auditoria para todas as interações

## Troubleshooting

**NOVO**: Sistema de diagnóstico integrado! Use o botão "Diagnóstico do Sistema" no chat para identificar problemas automaticamente.

Para guia completo de solução de problemas, consulte: **[AI_TROUBLESHOOTING.md](./AI_TROUBLESHOOTING.md)**

### Problema: Erro ao conversar com IA

**Solução Rápida:**
1. Execute o diagnóstico integrado (botão no chat)
2. Se o erro mencionar "chave de API" ou "ANTHROPIC_API_KEY":
   - Configure a chave no Supabase (veja seção 2 acima)
   - Aguarde alguns segundos
   - Teste novamente

### Erro: "Configure a chave de API"
**Solução:** Configure `ANTHROPIC_API_KEY` no Supabase Edge Functions (não apenas no `.env` local)

### Erro: "Limite de tokens atingido"
**Solução:** Sistema atingiu limite mensal (100.000 tokens). Aguarde próximo mês ou aumente o limite no banco de dados.

### Sugestões não aparecem
**Possíveis causas:**
1. Campos obrigatórios não preenchidos (propósito < 10 caracteres)
2. Aguarde 1 segundo após digitar (debounce)
3. Verifique console do navegador para erros
4. Execute diagnóstico integrado

### Chat de IA não responde
**Possíveis causas:**
1. Chave de API não configurada no Supabase (mais comum)
2. Chave de API inválida ou expirada
3. Limite de tokens atingido
4. Erro de rede - verifique conexão

**Como diagnosticar:**
- Use o botão "Diagnóstico do Sistema" no chat
- Verifique o console do navegador (F12 > Console)
- Procure por mensagens com `[AI Service]` ou `[Chat]`

### Métricas não aparecem no dashboard
**Solução:**
1. Certifique-se de estar logado como admin
2. Clique em "Atualizar Análise" para processar dados
3. Aguarde alguns segundos para processamento

## Desabilitar IA (Opcional)

Se desejar desabilitar temporariamente o sistema de IA:

1. Remova ou comente a linha `VITE_ANTHROPIC_API_KEY` no `.env`
2. O sistema continuará funcionando normalmente
3. Sugestões e chat de IA não estarão disponíveis
4. Nenhum erro será exibido aos usuários

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs de auditoria no dashboard
2. Consulte a documentação da Anthropic: [docs.anthropic.com](https://docs.anthropic.com)
3. Entre em contato com o suporte técnico

## Melhorias Futuras

Possíveis melhorias para o sistema:
- [ ] Suporte a múltiplos idiomas
- [ ] Integração com calendário externo
- [ ] Sugestões baseadas em machine learning local
- [ ] Notificações proativas de IA
- [ ] Análise de sentimento do feedback
- [ ] Exportação de relatórios de insights
