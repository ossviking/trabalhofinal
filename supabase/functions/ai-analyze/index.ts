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

interface AnalyzeRequest {
  analysisType: 'equipment' | 'lesson_structure' | 'capacity_warning';
  purpose?: string;
  resourceName?: string;
  duration?: number;
  participants?: number;
  capacity?: number;
  detailed?: boolean;
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

    const requestData: AnalyzeRequest = await req.json();
    const { analysisType, purpose, resourceName, duration, participants, capacity, detailed } = requestData;

    let prompt = '';
    let maxTokens = 512;
    let suggestionType = analysisType;

    if (analysisType === 'capacity_warning') {
      if (!participants || !capacity || !resourceName) {
        throw new Error('Missing required fields for capacity warning');
      }

      if (participants <= capacity) {
        return new Response(
          JSON.stringify({ suggestion: null, message: 'Capacity is sufficient' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const overage = participants - capacity;
      const percentOver = Math.round((overage / capacity) * 100);

      const suggestion = {
        user_id: user.id,
        suggestion_type: 'capacity_warning',
        suggestion_text: `A sala "${resourceName}" tem capacidade para ${capacity} pessoas, mas você precisa de ${participants} participantes (${percentOver}% acima da capacidade). Recomendamos escolher uma sala maior.`,
        confidence_score: 95,
        metadata: { participants, capacity, overage, resource_name: resourceName },
      };

      const { data: savedSuggestion, error: saveError } = await supabaseClient
        .from('ai_suggestions')
        .insert(suggestion)
        .select()
        .single();

      if (saveError) throw saveError;

      return new Response(
        JSON.stringify({ suggestion: savedSuggestion }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (analysisType === 'equipment') {
      if (!purpose || !resourceName) {
        throw new Error('Missing required fields for equipment suggestion');
      }

      prompt = `Analise o propósito desta aula e sugira equipamentos necessários.

Propósito da aula: ${purpose}
Local: ${resourceName}

Sugira de 2 a 5 equipamentos importantes para esta aula. Para cada equipamento, explique brevemente por que é útil.

Responda em formato de lista simples, exemplo:
- Projetor multimídia: Para apresentar slides e materiais visuais
- Microfone sem fio: Para garantir que todos os participantes ouçam claramente
- Quadro branco: Para ilustrar conceitos e interação`;
      maxTokens = 512;
    } else if (analysisType === 'lesson_structure') {
      if (!purpose || !duration) {
        throw new Error('Missing required fields for lesson structure');
      }

      const durationHours = Math.floor(duration / 60);
      const durationMins = duration % 60;
      const durationStr =
        durationHours > 0
          ? `${durationHours}h${durationMins > 0 ? durationMins + 'min' : ''}`
          : `${durationMins} minutos`;

      if (detailed) {
        prompt = `Crie uma estrutura DETALHADA de aula para o seguinte tema:

Tema: ${purpose}
Duração total: ${durationStr}

Inclua:
1. Divisão em seções com duração específica para cada uma
2. Metodologias de ensino sugeridas
3. Atividades práticas ou dinâmicas
4. Recursos necessários para cada etapa
5. Objetivos de aprendizagem

Formate como uma lista estruturada com seções claras.`;
        maxTokens = 1024;
        suggestionType = 'lesson_structure_detailed';
      } else {
        prompt = `Crie uma estrutura SIMPLES de aula para o seguinte tema:

Tema: ${purpose}
Duração total: ${durationStr}

Divida em 3-5 seções principais com:
- Nome da seção
- Duração aproximada
- Breve descrição do que será abordado

Formate como uma lista simples e objetiva.`;
        maxTokens = 512;
        suggestionType = 'lesson_structure_simple';
      }
    } else {
      throw new Error('Invalid analysis type');
    }

    const estimatedTotalTokens = Math.ceil(prompt.length / 4) + maxTokens;

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
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const claudeResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.json().catch(() => ({}));
      throw new Error(`Claude API error: ${claudeResponse.status} - ${JSON.stringify(errorData)}`);
    }

    const claudeData = await claudeResponse.json();
    const responseText = claudeData.content[0].text;
    const inputTokens = claudeData.usage.input_tokens;
    const outputTokens = claudeData.usage.output_tokens;
    const costEstimate = (inputTokens * 0.003 + outputTokens * 0.015) / 1000;

    await supabaseClient.rpc('record_token_usage', {
      p_user_id: user.id,
      p_action_type: analysisType,
      p_input_tokens: inputTokens,
      p_output_tokens: outputTokens,
      p_cost_estimate: costEstimate,
      p_success: true,
    });

    let metadata: any = {};
    if (analysisType === 'equipment') {
      const equipmentLines = responseText.split('\n').filter((line) => line.trim().startsWith('-'));
      const equipmentSuggestions = equipmentLines.map((line) => {
        const match = line.match(/^-\s*([^:]+):\s*(.+)$/);
        if (match) {
          return { name: match[1].trim(), reason: match[2].trim() };
        }
        return { name: line.replace(/^-\s*/, '').trim(), reason: '' };
      });
      metadata = { purpose, resource_name: resourceName, equipment_suggestions: equipmentSuggestions };
    } else if (analysisType === 'lesson_structure') {
      metadata = { purpose, duration };
    }

    const suggestion = {
      user_id: user.id,
      suggestion_type: suggestionType,
      suggestion_text: responseText,
      confidence_score: analysisType === 'equipment' ? 80 : 85,
      metadata,
    };

    const { data: savedSuggestion, error: saveError } = await supabaseClient
      .from('ai_suggestions')
      .insert(suggestion)
      .select()
      .single();

    if (saveError) throw saveError;

    return new Response(
      JSON.stringify({
        suggestion: savedSuggestion,
        tokensUsed: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
        tokensRemaining: canUseData.tokens_remaining - (inputTokens + outputTokens),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-analyze function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});