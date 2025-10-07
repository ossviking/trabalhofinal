import { supabase } from '../lib/supabase';
import type {
  AISuggestion,
  AIAnalysisRequest,
  ClaudeAPIRequest,
  ClaudeAPIResponse,
  SuggestionType,
  SuggestionMetadata,
  AIChatContext,
} from '../types/ai';

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';

const MAX_REQUESTS_PER_MINUTE = 10;
const requestTimestamps: number[] = [];

function checkRateLimit(): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  const recentRequests = requestTimestamps.filter(ts => ts > oneMinuteAgo);
  requestTimestamps.length = 0;
  requestTimestamps.push(...recentRequests);

  return recentRequests.length < MAX_REQUESTS_PER_MINUTE;
}

function addRequestTimestamp(): void {
  requestTimestamps.push(Date.now());
}

async function callClaudeAPI(messages: Array<{ role: string; content: string }>, maxTokens: number = 1024): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('VITE_ANTHROPIC_API_KEY não configurada');
  }

  if (!checkRateLimit()) {
    throw new Error('Rate limit excedido. Tente novamente em alguns segundos.');
  }

  const requestBody: ClaudeAPIRequest = {
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    messages: messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    temperature: 0.7,
  };

  try {
    addRequestTimestamp();

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data: ClaudeAPIResponse = await response.json();

    const { user } = await supabase.auth.getUser();
    if (user.data.user) {
      const inputTokens = data.usage.input_tokens;
      const outputTokens = data.usage.output_tokens;
      const costEstimate = (inputTokens * 0.003 + outputTokens * 0.015) / 1000;

      await supabase.from('ai_audit_log').insert({
        user_id: user.data.user.id,
        action_type: 'chat_message',
        details: {
          model: CLAUDE_MODEL,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
        },
        api_cost_estimate: costEstimate,
      });
    }

    return data.content[0].text;
  } catch (error) {
    console.error('Erro ao chamar Claude API:', error);
    throw error;
  }
}

export async function analyzeClassroomCapacity(
  participants: number,
  resourceName: string,
  capacity: number
): Promise<AISuggestion | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  if (participants <= capacity) return null;

  const overage = participants - capacity;
  const percentOver = Math.round((overage / capacity) * 100);

  const suggestion: Partial<AISuggestion> = {
    user_id: user.id,
    suggestion_type: 'capacity_warning',
    suggestion_text: `A sala "${resourceName}" tem capacidade para ${capacity} pessoas, mas você precisa de ${participants} participantes (${percentOver}% acima da capacidade). Recomendamos escolher uma sala maior.`,
    confidence_score: 95,
    metadata: {
      participants,
      capacity,
      overage,
      resource_name: resourceName,
    },
  };

  const { data, error } = await supabase
    .from('ai_suggestions')
    .insert(suggestion)
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar sugestão:', error);
    return null;
  }

  return data;
}

export async function suggestEquipmentByPurpose(purpose: string, resourceName: string): Promise<AISuggestion | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const prompt = `Analise o propósito desta aula e sugira equipamentos necessários.

Propósito da aula: ${purpose}
Local: ${resourceName}

Sugira de 2 a 5 equipamentos importantes para esta aula. Para cada equipamento, explique brevemente por que é útil.

Responda em formato de lista simples, exemplo:
- Projetor multimídia: Para apresentar slides e materiais visuais
- Microfone sem fio: Para garantir que todos os participantes ouçam claramente
- Quadro branco: Para ilustrar conceitos e interação`;

    const response = await callClaudeAPI([{ role: 'user', content: prompt }], 512);

    const equipmentLines = response.split('\n').filter(line => line.trim().startsWith('-'));
    const equipmentSuggestions = equipmentLines.map(line => {
      const match = line.match(/^-\s*([^:]+):\s*(.+)$/);
      if (match) {
        return { name: match[1].trim(), reason: match[2].trim() };
      }
      return { name: line.replace(/^-\s*/, '').trim(), reason: '' };
    });

    const suggestion: Partial<AISuggestion> = {
      user_id: user.id,
      suggestion_type: 'equipment',
      suggestion_text: `Baseado no propósito da aula, recomendamos os seguintes equipamentos:\n\n${response}`,
      confidence_score: 80,
      metadata: {
        purpose,
        resource_name: resourceName,
        equipment_suggestions: equipmentSuggestions,
      },
    };

    const { data, error } = await supabase
      .from('ai_suggestions')
      .insert(suggestion)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao sugerir equipamentos:', error);
    return null;
  }
}

export async function suggestAlternativeRooms(
  resourceId: string,
  participants: number,
  startTime: string,
  endTime: string
): Promise<AISuggestion | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { data: resources } = await supabase
      .from('resources')
      .select('*')
      .gte('capacity', participants)
      .neq('id', resourceId)
      .eq('status', 'available');

    if (!resources || resources.length === 0) return null;

    const { data: existingReservations } = await supabase
      .from('reservations')
      .select('resource_id')
      .in('resource_id', resources.map(r => r.id))
      .eq('status', 'approved')
      .or(`and(start_time.lte.${endTime},end_time.gte.${startTime})`);

    const busyResourceIds = new Set(existingReservations?.map(r => r.resource_id) || []);
    const availableResources = resources.filter(r => !busyResourceIds.has(r.id));

    if (availableResources.length === 0) return null;

    const topAlternatives = availableResources.slice(0, 3);
    const alternativesList = topAlternatives.map(r => ({
      id: r.id,
      name: r.name,
      reason: `Capacidade para ${r.capacity} pessoas${r.location ? `, localizada em ${r.location}` : ''}`,
    }));

    const suggestion: Partial<AISuggestion> = {
      user_id: user.id,
      suggestion_type: 'alternative_room',
      suggestion_text: `Encontramos ${topAlternatives.length} salas alternativas disponíveis neste horário que atendem suas necessidades.`,
      confidence_score: 90,
      metadata: {
        participants,
        alternative_resources: alternativesList,
      },
    };

    const { data, error } = await supabase
      .from('ai_suggestions')
      .insert(suggestion)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao sugerir salas alternativas:', error);
    return null;
  }
}

export async function generateLessonStructure(
  purpose: string,
  duration: number,
  detailed: boolean = false
): Promise<AISuggestion | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const durationHours = Math.floor(duration / 60);
    const durationMins = duration % 60;
    const durationStr = durationHours > 0
      ? `${durationHours}h${durationMins > 0 ? durationMins + 'min' : ''}`
      : `${durationMins} minutos`;

    const prompt = detailed
      ? `Crie uma estrutura DETALHADA de aula para o seguinte tema:

Tema: ${purpose}
Duração total: ${durationStr}

Inclua:
1. Divisão em seções com duração específica para cada uma
2. Metodologias de ensino sugeridas
3. Atividades práticas ou dinâmicas
4. Recursos necessários para cada etapa
5. Objetivos de aprendizagem

Formate como uma lista estruturada com seções claras.`
      : `Crie uma estrutura SIMPLES de aula para o seguinte tema:

Tema: ${purpose}
Duração total: ${durationStr}

Divida em 3-5 seções principais com:
- Nome da seção
- Duração aproximada
- Breve descrição do que será abordado

Formate como uma lista simples e objetiva.`;

    const response = await callClaudeAPI([{ role: 'user', content: prompt }], detailed ? 1024 : 512);

    const sections: Array<{ title: string; duration: number; description?: string }> = [];
    const lines = response.split('\n');

    let currentSection: any = null;
    for (const line of lines) {
      const sectionMatch = line.match(/^(?:\d+[\.)]\s*)?([^(]+)\s*\((\d+)\s*min/i);
      if (sectionMatch) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          title: sectionMatch[1].trim(),
          duration: parseInt(sectionMatch[2]),
          description: '',
        };
      } else if (currentSection && line.trim()) {
        currentSection.description += line.trim() + ' ';
      }
    }
    if (currentSection) sections.push(currentSection);

    const suggestion: Partial<AISuggestion> = {
      user_id: user.id,
      suggestion_type: detailed ? 'lesson_structure_detailed' : 'lesson_structure_simple',
      suggestion_text: response,
      confidence_score: 85,
      metadata: {
        purpose,
        duration,
        lesson_structure: {
          duration,
          sections,
        },
      },
    };

    const { data, error } = await supabase
      .from('ai_suggestions')
      .insert(suggestion)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao gerar estrutura de aula:', error);
    return null;
  }
}

export async function sendMessageToAI(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<{ response: string; updatedHistory: Array<{ role: string; content: string; timestamp: string }> }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const systemContext = `Você é um assistente inteligente de um sistema de reserva de recursos educacionais.
Você ajuda professores e administradores com:
- Informações sobre disponibilidade de salas e equipamentos
- Sugestões de recursos adequados para diferentes tipos de aulas
- Ajuda com planejamento de aulas e estruturação de conteúdo
- Dicas para melhor aproveitamento dos recursos disponíveis

Seja prestativo, conciso e objetivo. Use linguagem profissional mas amigável.`;

  const messages = [
    { role: 'user', content: systemContext },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  const response = await callClaudeAPI(messages, 1024);

  const updatedHistory = [
    ...conversationHistory,
    { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
    { role: 'assistant', content: response, timestamp: new Date().toISOString() },
  ];

  const { data: existingContext } = await supabase
    .from('ai_chat_context')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingContext) {
    await supabase
      .from('ai_chat_context')
      .update({
        conversation_history: updatedHistory,
        last_interaction: new Date().toISOString(),
      })
      .eq('id', existingContext.id);
  } else {
    await supabase.from('ai_chat_context').insert({
      user_id: user.id,
      conversation_history: updatedHistory,
      last_interaction: new Date().toISOString(),
    });
  }

  return { response, updatedHistory };
}

export async function getChatContext(userId: string): Promise<AIChatContext | null> {
  const { data, error } = await supabase
    .from('ai_chat_context')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar contexto de chat:', error);
    return null;
  }

  return data;
}

export async function submitSuggestionFeedback(
  suggestionId: string,
  feedbackType: 'useful' | 'not_useful' | 'applied' | 'dismissed',
  comment?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('ai_suggestion_feedback').insert({
    suggestion_id: suggestionId,
    user_id: user.id,
    feedback_type: feedbackType,
    comment,
  });

  if (feedbackType === 'applied') {
    await supabase
      .from('ai_suggestions')
      .update({ applied: true })
      .eq('id', suggestionId);
  }

  await supabase.from('ai_audit_log').insert({
    user_id: user.id,
    action_type: 'feedback_given',
    details: {
      suggestion_id: suggestionId,
      feedback_type: feedbackType,
    },
  });
}

export async function getUserSuggestions(userId: string, limit: number = 10): Promise<AISuggestion[]> {
  const { data, error } = await supabase
    .from('ai_suggestions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Erro ao buscar sugestões:', error);
    return [];
  }

  return data || [];
}

export async function analyzeResourceUsagePatterns(): Promise<void> {
  const { data: reservations } = await supabase
    .from('reservations')
    .select('resource_id, start_time, end_time, purpose')
    .eq('status', 'approved');

  if (!reservations) return;

  const patternMap = new Map<string, any>();

  for (const reservation of reservations) {
    const startDate = new Date(reservation.start_time);
    const endDate = new Date(reservation.end_time);
    const duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
    const hour = startDate.getHours();
    const dayOfWeek = startDate.getDay();

    const hourlyKey = `${reservation.resource_id}-hourly-${hour}`;
    const dailyKey = `${reservation.resource_id}-daily-${dayOfWeek}`;

    if (!patternMap.has(hourlyKey)) {
      patternMap.set(hourlyKey, {
        resource_id: reservation.resource_id,
        pattern_type: 'hourly',
        time_slot: hour.toString(),
        usage_count: 0,
        total_duration: 0,
        purposes: [],
      });
    }

    const hourlyPattern = patternMap.get(hourlyKey);
    hourlyPattern.usage_count++;
    hourlyPattern.total_duration += duration;
    if (reservation.purpose) hourlyPattern.purposes.push(reservation.purpose);

    if (!patternMap.has(dailyKey)) {
      patternMap.set(dailyKey, {
        resource_id: reservation.resource_id,
        pattern_type: 'daily',
        time_slot: dayOfWeek.toString(),
        usage_count: 0,
        total_duration: 0,
        purposes: [],
      });
    }

    const dailyPattern = patternMap.get(dailyKey);
    dailyPattern.usage_count++;
    dailyPattern.total_duration += duration;
    if (reservation.purpose) dailyPattern.purposes.push(reservation.purpose);
  }

  for (const pattern of patternMap.values()) {
    const averageDuration = Math.round(pattern.total_duration / pattern.usage_count);
    const commonPurposes = [...new Set(pattern.purposes)].slice(0, 5);

    await supabase
      .from('resource_usage_patterns')
      .upsert({
        resource_id: pattern.resource_id,
        pattern_type: pattern.pattern_type,
        time_slot: pattern.time_slot,
        usage_count: pattern.usage_count,
        average_duration: averageDuration,
        common_purposes: commonPurposes,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'resource_id,pattern_type,time_slot',
      });
  }
}
