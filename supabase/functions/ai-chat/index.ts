import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  maxTokens?: number;
}

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeAPIRequest {
  model: string;
  max_tokens: number;
  messages: ClaudeMessage[];
  temperature?: number;
}

interface ClaudeAPIResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text: string }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { message, conversationHistory = [], maxTokens = 1024 }: ChatRequest = await req.json();

    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message');
    }

    const estimatedInputTokens = Math.ceil((message.length + JSON.stringify(conversationHistory).length) / 4);
    const estimatedTotalTokens = estimatedInputTokens + maxTokens;

    const { data: canUseData, error: canUseError } = await supabaseClient.rpc('can_use_tokens', {
      p_user_id: user.id,
      p_estimated_tokens: estimatedTotalTokens,
    });

    if (canUseError) {
      throw new Error(`Token check failed: ${canUseError.message}`);
    }

    if (!canUseData.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Token limit exceeded',
          message: canUseData.message,
          tokensRemaining: canUseData.tokens_remaining,
          systemLimit: canUseData.system_token_limit,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const systemContext = `Você é um assistente inteligente de um sistema de reserva de recursos educacionais.
Você ajuda professores e administradores com:
- Informações sobre disponibilidade de salas e equipamentos
- Sugestões de recursos adequados para diferentes tipos de aulas
- Ajuda com planejamento de aulas e estruturação de conteúdo
- Dicas para melhor aproveitamento dos recursos disponíveis

Seja prestativo, conciso e objetivo. Use linguagem profissional mas amigável.`;

    const messages: ClaudeMessage[] = [
      { role: 'user', content: systemContext },
      ...conversationHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const claudeRequest: ClaudeAPIRequest = {
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      messages,
      temperature: 0.7,
    };

    const claudeResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(claudeRequest),
    });

    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.json().catch(() => ({}));
      throw new Error(`Claude API error: ${claudeResponse.status} - ${JSON.stringify(errorData)}`);
    }

    const claudeData: ClaudeAPIResponse = await claudeResponse.json();
    const responseText = claudeData.content[0].text;
    const inputTokens = claudeData.usage.input_tokens;
    const outputTokens = claudeData.usage.output_tokens;
    const costEstimate = (inputTokens * 0.003 + outputTokens * 0.015) / 1000;

    await supabaseClient.rpc('record_token_usage', {
      p_user_id: user.id,
      p_action_type: 'chat_message',
      p_input_tokens: inputTokens,
      p_output_tokens: outputTokens,
      p_cost_estimate: costEstimate,
      p_success: true,
    });

    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: responseText, timestamp: new Date().toISOString() },
    ];

    const { data: existingContext } = await supabaseClient
      .from('ai_chat_context')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingContext) {
      await supabaseClient
        .from('ai_chat_context')
        .update({
          conversation_history: updatedHistory,
          last_interaction: new Date().toISOString(),
        })
        .eq('id', existingContext.id);
    } else {
      await supabaseClient.from('ai_chat_context').insert({
        user_id: user.id,
        conversation_history: updatedHistory,
        last_interaction: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({
        response: responseText,
        updatedHistory,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens,
        },
        tokensRemaining: canUseData.tokens_remaining - (inputTokens + outputTokens),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});