# Guia de Solução de Problemas - Assistente IA

Este documento fornece instruções para diagnosticar e resolver problemas com o assistente de IA do sistema.

## Requisitos

Para que o assistente IA funcione corretamente, os seguintes requisitos devem ser atendidos:

1. **Chave da API Anthropic**: Configurada como variável de ambiente no Supabase
2. **Edge Functions**: Deployadas no Supabase (ai-chat e ai-analyze)
3. **Banco de Dados**: Todas as tabelas e funções RPC criadas
4. **Autenticação**: Usuário autenticado no sistema

## Ferramenta de Diagnóstico

O sistema inclui uma ferramenta de diagnóstico integrada que verifica automaticamente todos os componentes necessários.

### Como usar:

1. Faça login no sistema
2. Abra o chat clicando no botão flutuante no canto inferior direito
3. Clique na aba "Assistente IA"
4. Clique no botão "Diagnóstico do Sistema"
5. Analise o relatório gerado

## Problemas Comuns

### 1. "Chave de API da Anthropic não está configurada"

**Causa**: A variável de ambiente ANTHROPIC_API_KEY não está definida no Supabase.

**Solução**:
1. Acesse o dashboard do Supabase: https://supabase.com/dashboard
2. Navegue até seu projeto
3. Vá em Settings > Edge Functions > Secrets
4. Adicione uma nova secret:
   - Nome: `ANTHROPIC_API_KEY`
   - Valor: Sua chave da API Anthropic (começa com `sk-ant-api03-...`)
5. Clique em "Save"
6. Aguarde alguns segundos para a variável ser propagada
7. Teste novamente o assistente IA

### 2. "Não autorizado" ou "Sua sessão expirou"

**Causa**: O token de autenticação expirou ou é inválido.

**Solução**:
1. Faça logout do sistema
2. Faça login novamente
3. Tente usar o assistente IA novamente

### 3. "Limite de tokens atingido"

**Causa**: O sistema atingiu o limite mensal de tokens configurado (100.000 por padrão).

**Solução**:
1. Aguarde até o próximo mês para o reset automático
2. OU, como administrador, execute o seguinte SQL no Supabase:
   ```sql
   UPDATE system_token_usage
   SET token_limit = 200000
   WHERE month = to_char(now(), 'YYYY-MM');
   ```
3. OU, entre em contato com o administrador do sistema

### 4. "Erro ao conectar com Edge Function"

**Causa**: A Edge Function não está deployada ou não está respondendo.

**Solução**:
1. Verifique se as Edge Functions estão deployadas:
   - Acesse Supabase Dashboard > Edge Functions
   - Confirme que `ai-chat` e `ai-analyze` estão listadas e ativas
2. Se não estiverem deployadas, execute:
   ```bash
   # Certifique-se de ter o Supabase CLI instalado
   supabase functions deploy ai-chat
   supabase functions deploy ai-analyze
   ```

### 5. Edge Function retorna erro 500

**Causa**: Erro interno na Edge Function, geralmente relacionado à chave da API.

**Solução**:
1. Verifique os logs da Edge Function no Supabase Dashboard
2. Confirme que a chave da API Anthropic está corretamente configurada
3. Verifique se a chave da API não expirou ou atingiu seus limites
4. Teste a chave da API diretamente:
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: YOUR_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{
       "model": "claude-sonnet-4-5-20250929",
       "max_tokens": 10,
       "messages": [{"role": "user", "content": "test"}]
     }'
   ```

## Verificação Manual

### Verificar Tabelas do Banco de Dados

Execute no SQL Editor do Supabase:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'ai_suggestions',
  'ai_chat_context',
  'token_usage_history',
  'system_token_usage',
  'user_token_usage'
);
```

Todas as 5 tabelas devem aparecer.

### Verificar Funções RPC

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'can_use_tokens',
  'record_token_usage',
  'get_or_create_user_token_usage',
  'get_or_create_system_token_usage'
);
```

Todas as 4 funções devem aparecer.

### Verificar Uso de Tokens

```sql
SELECT
  month,
  tokens_used,
  token_limit,
  token_limit - tokens_used as tokens_remaining,
  requests_count
FROM system_token_usage
WHERE month = to_char(now(), 'YYYY-MM');
```

## Logs de Depuração

O sistema gera logs detalhados no console do navegador. Para visualizar:

1. Abra o Developer Tools (F12)
2. Vá para a aba Console
3. Filtre por `[AI Service]` ou `[Chat]`
4. Procure por mensagens de erro em vermelho

## Suporte

Se os problemas persistirem após seguir este guia:

1. Execute o diagnóstico integrado e copie o relatório
2. Verifique os logs do navegador (Console)
3. Verifique os logs da Edge Function no Supabase
4. Entre em contato com o administrador do sistema com:
   - Relatório de diagnóstico
   - Logs do console
   - Descrição detalhada do problema
   - Passos para reproduzir o erro

## Informações Técnicas

### Arquitetura

```
Frontend (React)
  ↓ (fetch)
Edge Function (ai-chat)
  ↓ (API call)
Anthropic Claude API
  ↓ (response)
Edge Function
  ↓ (atualiza contexto)
Banco de Dados Supabase
```

### Componentes

- **Frontend**: `src/components/Chat.tsx` e `src/services/aiService.ts`
- **Edge Functions**: `supabase/functions/ai-chat/` e `supabase/functions/ai-analyze/`
- **Database**: Tabelas em `supabase/migrations/`
- **Diagnóstico**: `src/services/aiDiagnostics.ts`

### Limites

- Token limit mensal: 100.000 (configurável)
- Max tokens por mensagem: 1.024
- Modelo: claude-sonnet-4-5-20250929 (Claude Sonnet 4.5)
- Custo estimado: ~$3/1M input tokens, ~$15/1M output tokens
