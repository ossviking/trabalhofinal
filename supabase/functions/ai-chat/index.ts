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

interface ReservationIntent {
  hasIntent: boolean;
  resourceName?: string;
  resourceId?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  purpose?: string;
  attendees?: number;
  missingInfo?: string[];
}

async function getAvailableResources(supabaseClient: any) {
  const { data, error } = await supabaseClient
    .from('resources')
    .select('id, name, category, description, location, status, quantity')
    .eq('status', 'available')
    .order('name');

  if (error) throw error;
  return data || [];
}

async function checkReservationConflict(
  supabaseClient: any,
  resourceId: string,
  startDateTime: string,
  endDateTime: string
) {
  const { data, error } = await supabaseClient
    .from('reservations')
    .select('id')
    .eq('resource_id', resourceId)
    .eq('status', 'approved')
    .or(`and(start_date.lte.${endDateTime},end_date.gte.${startDateTime})`);

  if (error) throw error;
  return data && data.length > 0;
}

async function createReservation(
  supabaseClient: any,
  userId: string,
  reservation: {
    resourceId: string;
    startDate: string;
    endDate: string;
    purpose: string;
    attendees?: number;
  }
) {
  const { data, error } = await supabaseClient
    .from('reservations')
    .insert({
      user_id: userId,
      resource_id: reservation.resourceId,
      start_date: reservation.startDate,
      end_date: reservation.endDate,
      purpose: reservation.purpose,
      attendees: reservation.attendees || null,
      status: 'pending',
      priority: 'normal',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function analyzeReservationIntent(
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  availableResources: any[]
): Promise<ReservationIntent> {
  const resourcesList = availableResources
    .map(r => `- ${r.name} (${r.category}, quantidade disponível: ${r.quantity || 1}, localização: ${r.location || 'N/A'})`)
    .join('\n');

  const analysisPrompt = `Analise a seguinte mensagem do usuário e determine se ele está tentando fazer uma reserva de recurso.

Recursos disponíveis:
${resourcesList}

Mensagem do usuário: "${message}"

Responda APENAS com um JSON no seguinte formato (sem texto adicional):
{
  "hasIntent": true/false,
  "resourceName": "nome do recurso mencionado ou mais próximo",
  "startDate": "YYYY-MM-DD se mencionado",
  "startTime": "HH:MM se mencionado",
  "endDate": "YYYY-MM-DD se mencionado",
  "endTime": "HH:MM se mencionado",
  "purpose": "finalidade mencionada",
  "attendees": número de participantes se mencionado,
  "missingInfo": ["lista", "de", "informações", "faltantes"]
}

Considere hasIntent=true se o usuário:
- Pedir para reservar/agendar algo
- Mencionar que precisa de uma sala/equipamento para uma data
- Perguntar sobre disponibilidade com intenção de reservar

Data de hoje para referência: ${new Date().toISOString().split('T')[0]}`;

  const claudeResponse = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: analysisPrompt }],
      temperature: 0.3,
    }),
  });

  if (!claudeResponse.ok) {
    throw new Error('Failed to analyze reservation intent');
  }

  const claudeData = await claudeResponse.json();
  const responseText = claudeData.content[0].text;

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { hasIntent: false };
  }

  const intent = JSON.parse(jsonMatch[0]);

  if (intent.resourceName) {
    const resource = availableResources.find(
      r => r.name.toLowerCase().includes(intent.resourceName.toLowerCase()) ||
           intent.resourceName.toLowerCase().includes(r.name.toLowerCase())
    );
    if (resource) {
      intent.resourceId = resource.id;
    }
  }

  return intent;
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
    const estimatedTotalTokens = estimatedInputTokens + maxTokens + 500;

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

    const availableResources = await getAvailableResources(supabaseClient);

    const reservationIntent = await analyzeReservationIntent(
      message,
      conversationHistory,
      availableResources
    );

    let responseText = '';
    let reservationCreated = null;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    if (reservationIntent.hasIntent && reservationIntent.resourceId) {
      const missingInfo = reservationIntent.missingInfo || [];

      if (missingInfo.length === 0 &&
          reservationIntent.startDate &&
          reservationIntent.startTime &&
          reservationIntent.endDate &&
          reservationIntent.endTime &&
          reservationIntent.purpose) {

        const startDateTime = `${reservationIntent.startDate}T${reservationIntent.startTime}:00`;
        const endDateTime = `${reservationIntent.endDate}T${reservationIntent.endTime}:00`;

        const hasConflict = await checkReservationConflict(
          supabaseClient,
          reservationIntent.resourceId,
          startDateTime,
          endDateTime
        );

        if (hasConflict) {
          const contextPrompt = `O usuário tentou fazer uma reserva mas há um conflito de horário.

Recurso: ${reservationIntent.resourceName}
Data/Hora: ${reservationIntent.startDate} ${reservationIntent.startTime} até ${reservationIntent.endDate} ${reservationIntent.endTime}

Recursos disponíveis:
${availableResources.map(r => `- ${r.name} (${r.category}, quantidade: ${r.quantity || 1})`).join('\n')}

Informe o usuário sobre o conflito de forma amigável e sugira:
1. Escolher outro horário
2. Escolher um recurso alternativo similar
3. Perguntar se deseja ver horários disponíveis

Seja conciso e prestativo.`;

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
              messages: [
                ...conversationHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
                { role: 'user', content: contextPrompt }
              ],
              temperature: 0.7,
            }),
          });

          const claudeData = await claudeResponse.json();
          responseText = claudeData.content[0].text;
          totalInputTokens = claudeData.usage.input_tokens;
          totalOutputTokens = claudeData.usage.output_tokens;
        } else {
          reservationCreated = await createReservation(supabaseClient, user.id, {
            resourceId: reservationIntent.resourceId,
            startDate: startDateTime,
            endDate: endDateTime,
            purpose: reservationIntent.purpose,
            attendees: reservationIntent.attendees,
          });

          const resource = availableResources.find(r => r.id === reservationIntent.resourceId);
          responseText = `✅ Reserva criada com sucesso!

📋 Detalhes da reserva:
- Recurso: ${resource?.name || reservationIntent.resourceName}
- Data: ${reservationIntent.startDate}
- Horário: ${reservationIntent.startTime} - ${reservationIntent.endTime}
- Finalidade: ${reservationIntent.purpose}
${reservationIntent.attendees ? `- Participantes: ${reservationIntent.attendees}` : ''}

Sua reserva está com status "Pendente" e aguarda aprovação do administrador. Você receberá uma notificação quando for aprovada.`;
        }
      } else {
        const contextPrompt = `O usuário quer fazer uma reserva mas faltam algumas informações.

Informações coletadas:
- Recurso: ${reservationIntent.resourceName || 'não especificado'}
- Data início: ${reservationIntent.startDate || 'não especificada'}
- Hora início: ${reservationIntent.startTime || 'não especificada'}
- Data fim: ${reservationIntent.endDate || 'não especificada'}
- Hora fim: ${reservationIntent.endTime || 'não especificada'}
- Finalidade: ${reservationIntent.purpose || 'não especificada'}
- Participantes: ${reservationIntent.attendees || 'não especificado'}

Informações faltantes: ${missingInfo.join(', ')}

Recursos disponíveis:
${availableResources.map(r => `- ${r.name} (${r.category}, quantidade: ${r.quantity || 1})`).join('\n')}

Mensagem do usuário: "${message}"

Peça as informações faltantes de forma natural e amigável. Se o usuário não especificou o recurso claramente, ajude-o a escolher baseado na finalidade mencionada. Seja conciso.`;

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
            messages: [
              ...conversationHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
              { role: 'user', content: contextPrompt }
            ],
            temperature: 0.7,
          }),
        });

        const claudeData = await claudeResponse.json();
        responseText = claudeData.content[0].text;
        totalInputTokens = claudeData.usage.input_tokens;
        totalOutputTokens = claudeData.usage.output_tokens;
      }
    } else {
      const resourcesList = availableResources
        .map(r => `- ${r.name} (${r.category}, ${r.location || 'localização não especificada'}, quantidade: ${r.quantity || 1})`)
        .slice(0, 10)
        .join('\n');

      const systemContext = `Você é um assistente inteligente de um sistema de reserva de recursos educacionais.

Recursos disponíveis no sistema:
${resourcesList}

Você ajuda professores e administradores com:
- Informações sobre disponibilidade de salas e equipamentos
- CRIAR RESERVAS diretamente pelo chat (quando o usuário pedir para reservar algo)
- Sugestões de recursos adequados para diferentes tipos de aulas
- Ajuda com planejamento de aulas e estruturação de conteúdo
- Dicas para melhor aproveitamento dos recursos disponíveis

Quando o usuário quiser fazer uma reserva, colete naturalmente:
1. Qual recurso (sala/equipamento)
2. Data (início e fim)
3. Horário (início e fim)
4. Finalidade da reserva
5. Número de participantes (opcional mas recomendado)

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
      responseText = claudeData.content[0].text;
      totalInputTokens = claudeData.usage.input_tokens;
      totalOutputTokens = claudeData.usage.output_tokens;
    }

    const costEstimate = (totalInputTokens * 0.003 + totalOutputTokens * 0.015) / 1000;

    await supabaseClient.rpc('record_token_usage', {
      p_user_id: user.id,
      p_action_type: reservationCreated ? 'reservation_created' : 'chat_message',
      p_input_tokens: totalInputTokens,
      p_output_tokens: totalOutputTokens,
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
        reservationCreated: reservationCreated ? {
          id: reservationCreated.id,
          resourceId: reservationCreated.resource_id,
          startDate: reservationCreated.start_date,
          endDate: reservationCreated.end_date,
          status: reservationCreated.status,
        } : null,
        tokensUsed: {
          input: totalInputTokens,
          output: totalOutputTokens,
          total: totalInputTokens + totalOutputTokens,
        },
        tokensRemaining: canUseData.tokens_remaining - (totalInputTokens + totalOutputTokens),
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
