export type SuggestionType =
  | 'equipment'
  | 'alternative_room'
  | 'lesson_structure_simple'
  | 'lesson_structure_detailed'
  | 'time_optimization'
  | 'package_recommendation'
  | 'capacity_warning'
  | 'general';

export interface AISuggestion {
  id: string;
  reservation_id?: string;
  user_id: string;
  suggestion_type: SuggestionType;
  suggestion_text: string;
  confidence_score: number;
  metadata: Record<string, any>;
  applied: boolean;
  created_at: string;
}

export interface SuggestionMetadata {
  resource_id?: string;
  resource_name?: string;
  alternative_resources?: Array<{
    id: string;
    name: string;
    reason: string;
  }>;
  equipment_suggestions?: Array<{
    name: string;
    reason: string;
  }>;
  lesson_structure?: {
    duration: number;
    sections: Array<{
      title: string;
      duration: number;
      description?: string;
      resources?: string[];
    }>;
  };
  time_suggestions?: Array<{
    start_time: string;
    end_time: string;
    reason: string;
  }>;
}

export interface ResourceUsagePattern {
  id: string;
  resource_id: string;
  pattern_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time_slot: string;
  usage_count: number;
  average_duration: number;
  common_purposes: string[];
  last_updated: string;
}

export interface AISuggestionFeedback {
  id: string;
  suggestion_id: string;
  user_id: string;
  feedback_type: 'useful' | 'not_useful' | 'applied' | 'dismissed';
  comment?: string;
  created_at: string;
}

export interface AIChatContext {
  id: string;
  user_id: string;
  conversation_history: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  context_metadata: Record<string, any>;
  last_interaction: string;
  created_at: string;
}

export interface AIAuditLog {
  id: string;
  user_id?: string;
  action_type: 'suggestion_generated' | 'chat_message' | 'feedback_given';
  details: Record<string, any>;
  api_cost_estimate: number;
  created_at: string;
}

export interface AIAnalysisRequest {
  purpose?: string;
  participants?: number;
  resource_id?: string;
  resource_name?: string;
  resource_capacity?: number;
  start_time?: string;
  end_time?: string;
  user_context?: {
    previous_reservations?: number;
    preferred_resources?: string[];
  };
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeAPIRequest {
  model: string;
  max_tokens: number;
  messages: ClaudeMessage[];
  temperature?: number;
}

export interface ClaudeAPIResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}
