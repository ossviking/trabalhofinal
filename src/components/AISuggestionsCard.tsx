import React, { useState } from 'react';
import { Sparkles, CheckCircle, XCircle, ChevronDown, ChevronUp, Lightbulb, Clock, Users } from 'lucide-react';
import type { AISuggestion } from '../types/ai';
import { submitSuggestionFeedback } from '../services/aiService';

interface AISuggestionsCardProps {
  suggestions: AISuggestion[];
  onApplySuggestion?: (suggestion: AISuggestion) => void;
  loading?: boolean;
}

const AISuggestionsCard: React.FC<AISuggestionsCardProps> = ({
  suggestions,
  onApplySuggestion,
  loading = false,
}) => {
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  const toggleExpand = (suggestionId: string) => {
    const newExpanded = new Set(expandedSuggestions);
    if (newExpanded.has(suggestionId)) {
      newExpanded.delete(suggestionId);
    } else {
      newExpanded.add(suggestionId);
    }
    setExpandedSuggestions(newExpanded);
  };

  const handleFeedback = async (suggestion: AISuggestion, type: 'useful' | 'not_useful') => {
    try {
      await submitSuggestionFeedback(suggestion.id, type);
      setFeedbackGiven(new Set([...feedbackGiven, suggestion.id]));
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
    }
  };

  const handleApply = async (suggestion: AISuggestion) => {
    try {
      await submitSuggestionFeedback(suggestion.id, 'applied');
      setFeedbackGiven(new Set([...feedbackGiven, suggestion.id]));
      if (onApplySuggestion) {
        onApplySuggestion(suggestion);
      }
    } catch (error) {
      console.error('Erro ao aplicar sugestão:', error);
    }
  };

  const getConfidenceColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'equipment':
        return <Lightbulb className="w-5 h-5" />;
      case 'alternative_room':
        return <Users className="w-5 h-5" />;
      case 'lesson_structure_simple':
      case 'lesson_structure_detailed':
        return <Clock className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg animate-pulse">
            <Sparkles className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Assistente IA analisando...</h3>
            <p className="text-sm text-gray-600">Gerando sugestões inteligentes para você</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-blue-200 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-blue-200 rounded animate-pulse w-full"></div>
          <div className="h-4 bg-blue-200 rounded animate-pulse w-5/6"></div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {suggestions.map((suggestion) => {
        const isExpanded = expandedSuggestions.has(suggestion.id);
        const hasFeedback = feedbackGiven.has(suggestion.id);

        return (
          <div
            key={suggestion.id}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border border-blue-200 transition-all hover:shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                {getSuggestionIcon(suggestion.suggestion_type)}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      <Sparkles className="w-3 h-3" />
                      Sugerido pela IA
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(suggestion.confidence_score)}`}>
                      {suggestion.confidence_score}% confiança
                    </span>
                  </div>
                </div>

                <p className="text-gray-800 mb-3 leading-relaxed">
                  {suggestion.suggestion_text.split('\n')[0]}
                </p>

                {suggestion.suggestion_text.split('\n').length > 1 && (
                  <button
                    onClick={() => toggleExpand(suggestion.id)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mb-3"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Ver menos
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Ver mais detalhes
                      </>
                    )}
                  </button>
                )}

                {isExpanded && (
                  <div className="mb-3 p-3 bg-white rounded-lg border border-blue-100">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                      {suggestion.suggestion_text.split('\n').slice(1).join('\n')}
                    </pre>
                  </div>
                )}

                {suggestion.metadata?.alternative_resources && (
                  <div className="mb-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Salas alternativas disponíveis:</p>
                    {suggestion.metadata.alternative_resources.map((alt: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                        <div>
                          <p className="font-medium text-gray-800">{alt.name}</p>
                          <p className="text-sm text-gray-600">{alt.reason}</p>
                        </div>
                        <button
                          onClick={() => handleApply(suggestion)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          Usar esta sala
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {suggestion.metadata?.equipment_suggestions && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Equipamentos sugeridos:</p>
                    <div className="space-y-2">
                      {suggestion.metadata.equipment_suggestions.map((eq: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 p-2 bg-white rounded-lg border border-blue-100">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{eq.name}</p>
                            {eq.reason && <p className="text-xs text-gray-600">{eq.reason}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!hasFeedback && (
                  <div className="flex items-center gap-2 pt-3 border-t border-blue-200">
                    <span className="text-sm text-gray-600">Esta sugestão foi útil?</span>
                    <button
                      onClick={() => handleFeedback(suggestion, 'useful')}
                      className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Sim
                    </button>
                    <button
                      onClick={() => handleFeedback(suggestion, 'not_useful')}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Não
                    </button>
                  </div>
                )}

                {hasFeedback && (
                  <div className="pt-3 border-t border-blue-200">
                    <p className="text-sm text-green-600 font-medium">Obrigado pelo seu feedback!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AISuggestionsCard;
