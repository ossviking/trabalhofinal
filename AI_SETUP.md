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

1. Abra o arquivo `.env` na raiz do projeto
2. Adicione a seguinte linha:
   ```
   VITE_ANTHROPIC_API_KEY=sua_chave_api_aqui
   ```
3. Salve o arquivo
4. Reinicie o servidor de desenvolvimento se estiver rodando

### 3. Verificar Configuração

Para verificar se a configuração está correta:
1. Faça login no sistema
2. Abra o chat e clique na aba "Assistente IA"
3. Envie uma mensagem de teste
4. Se configurado corretamente, você receberá uma resposta

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
O sistema usa o modelo **Claude 3.5 Sonnet** da Anthropic:
- Input: $0.003 por 1K tokens
- Output: $0.015 por 1K tokens

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

### Erro: "Configure a chave de API"
**Solução:** Adicione `VITE_ANTHROPIC_API_KEY` no arquivo `.env`

### Erro: "Rate limit excedido"
**Solução:** Aguarde 1 minuto antes de fazer nova solicitação

### Sugestões não aparecem
**Possíveis causas:**
1. Campos obrigatórios não preenchidos (propósito < 10 caracteres)
2. Aguarde 1 segundo após digitar (debounce)
3. Verifique console do navegador para erros

### Chat de IA não responde
**Possíveis causas:**
1. Chave de API inválida ou expirada
2. Limite de requisições atingido
3. Erro de rede - verifique conexão

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
