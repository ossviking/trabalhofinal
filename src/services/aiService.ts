import { supabase } from '../lib/supabase';
import type {
  AISuggestion,
  AIChatContext,
} from '../types/ai';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function callEdgeFunction(functionName: string, body: any) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Não autenticado');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));

    if (response.status === 429) {
      throw new Error(errorData.message || 'Limite de tokens atingido para este mês');
    }

    throw new Error(errorData.error || `Erro na requisição: ${response.status}`);
  }

  return response.json();
}

export async function analyzeClassroomCapacity(
  participants: number,
  resourceName: string,
  capacity: number
): Promise<AISuggestion | null> {
  try {
    const result = await callEdgeFunction('ai-analyze', {
      analysisType: 'capacity_warning',
      participants,
      resourceName,
      capacity,
    });

    return result.suggestion;
  } catch (error) {
    console.error('Erro ao analisar capacidade:', error);
    return null;
  }
}

export async function suggestEquipmentByPurpose(
  purpose: string,
  resourceName: string
): Promise<AISuggestion | null> {
  try {
    const result = await callEdgeFunction('ai-analyze', {
      analysisType: 'equipment',
      purpose,
      resourceName,
    });

    return result.suggestion;
  } catch (error) {
    console.error('Erro ao sugerir equipamentos:', error);

    if (error instanceof Error && error.message.includes('Limite de tokens')) {
      throw error;
    }

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
  try {
    const result = await callEdgeFunction('ai-analyze', {
      analysisType: 'lesson_structure',
      purpose,
      duration,
      detailed,
    });

    return result.suggestion;
  } catch (error) {
    console.error('Erro ao gerar estrutura de aula:', error);

    if (error instanceof Error && error.message.includes('Limite de tokens')) {
      throw error;
    }

    return null;
  }
}

export async function sendMessageToAI(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<{
  response: string;
  updatedHistory: Array<{ role: string; content: string; timestamp: string }>;
  reservationCreated?: {
    id: string;
    resourceId: string;
    startDate: string;
    endDate: string;
    status: string;
  } | null;
}> {
  try {
    const result = await callEdgeFunction('ai-chat', {
      message: userMessage,
      conversationHistory,
      maxTokens: 1024,
    });

    return {
      response: result.response,
      updatedHistory: result.updatedHistory,
      reservationCreated: result.reservationCreated || null,
    };
  } catch (error) {
    console.error('Erro ao enviar mensagem para IA:', error);
    throw error;
  }
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

export async function getTokenUsageStats(): Promise<{
  tokensUsed: number;
  tokenLimit: number;
  tokensRemaining: number;
  requestsCount: number;
} | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const month = new Date().toISOString().slice(0, 7);

  const { data: systemUsage, error } = await supabase
    .from('system_token_usage')
    .select('*')
    .eq('month', month)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar estatísticas de tokens:', error);
    return null;
  }

  if (!systemUsage) {
    return {
      tokensUsed: 0,
      tokenLimit: 100000,
      tokensRemaining: 100000,
      requestsCount: 0,
    };
  }

  return {
    tokensUsed: systemUsage.tokens_used,
    tokenLimit: systemUsage.token_limit,
    tokensRemaining: systemUsage.token_limit - systemUsage.tokens_used,
    requestsCount: systemUsage.requests_count,
  };
}
