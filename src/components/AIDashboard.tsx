import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, XCircle, BarChart3, Clock, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { analyzeResourceUsagePatterns, getTokenUsageStats } from '../services/aiService';
import type { AISuggestion, ResourceUsagePattern } from '../types/ai';

interface SuggestionStats {
  total: number;
  applied: number;
  byType: Record<string, number>;
  avgConfidence: number;
}

interface FeedbackStats {
  useful: number;
  not_useful: number;
  total: number;
  usefulRate: number;
}

interface TokenStats {
  tokensUsed: number;
  tokenLimit: number;
  tokensRemaining: number;
  requestsCount: number;
}

const AIDashboard = () => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [usagePatterns, setUsagePatterns] = useState<ResourceUsagePattern[]>([]);
  const [suggestionStats, setSuggestionStats] = useState<SuggestionStats | null>(null);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [tokenStats, setTokenStats] = useState<TokenStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSuggestions(),
        loadUsagePatterns(),
        loadSuggestionStats(),
        loadFeedbackStats(),
        loadTokenStats(),
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    const { data, error } = await supabase
      .from('ai_suggestions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setSuggestions(data);
    }
  };

  const loadUsagePatterns = async () => {
    const { data, error } = await supabase
      .from('resource_usage_patterns')
      .select('*, resources:resource_id(name, category)')
      .order('usage_count', { ascending: false })
      .limit(10);

    if (!error && data) {
      setUsagePatterns(data as any);
    }
  };

  const loadSuggestionStats = async () => {
    const { data, error } = await supabase
      .from('ai_suggestions')
      .select('suggestion_type, confidence_score, applied');

    if (!error && data) {
      const byType: Record<string, number> = {};
      let totalConfidence = 0;
      let appliedCount = 0;

      data.forEach((s: any) => {
        byType[s.suggestion_type] = (byType[s.suggestion_type] || 0) + 1;
        totalConfidence += s.confidence_score;
        if (s.applied) appliedCount++;
      });

      setSuggestionStats({
        total: data.length,
        applied: appliedCount,
        byType,
        avgConfidence: data.length > 0 ? Math.round(totalConfidence / data.length) : 0,
      });
    }
  };

  const loadFeedbackStats = async () => {
    const { data, error } = await supabase
      .from('ai_suggestion_feedback')
      .select('feedback_type');

    if (!error && data) {
      const useful = data.filter((f: any) => f.feedback_type === 'useful').length;
      const notUseful = data.filter((f: any) => f.feedback_type === 'not_useful').length;
      const total = useful + notUseful;

      setFeedbackStats({
        useful,
        not_useful: notUseful,
        total,
        usefulRate: total > 0 ? Math.round((useful / total) * 100) : 0,
      });
    }
  };

  const loadTokenStats = async () => {
    const stats = await getTokenUsageStats();
    if (stats) {
      setTokenStats(stats);
    }
  };

  const handleAnalyzePatterns = async () => {
    setIsAnalyzing(true);
    try {
      await analyzeResourceUsagePatterns();
      alert('Análise de padrões concluída com sucesso!');
      await loadDashboardData();
    } catch (error) {
      console.error('Erro ao analisar padrões:', error);
      alert('Erro ao analisar padrões. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSuggestionTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      equipment: 'Equipamentos',
      alternative_room: 'Salas Alternativas',
      lesson_structure_simple: 'Estrutura de Aula Simples',
      lesson_structure_detailed: 'Estrutura de Aula Detalhada',
      time_optimization: 'Otimização de Horário',
      package_recommendation: 'Recomendação de Pacote',
      capacity_warning: 'Aviso de Capacidade',
      general: 'Geral',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Sparkles className="h-12 w-12 text-blue-600 animate-pulse mx-auto mb-4" />
            <p className="text-gray-600">Carregando insights de IA...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-blue-600" />
          Dashboard de Insights de IA
        </h1>
        <p className="text-gray-600 mt-2">
          Análise de padrões de uso e desempenho das sugestões inteligentes
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Uso Mensal de Tokens</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Tokens Utilizados</p>
            <p className="text-2xl font-bold text-blue-600">{tokenStats?.tokensUsed.toLocaleString() || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Limite Mensal</p>
            <p className="text-2xl font-bold text-gray-900">{tokenStats?.tokenLimit.toLocaleString() || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tokens Restantes</p>
            <p className="text-2xl font-bold text-green-600">{tokenStats?.tokensRemaining.toLocaleString() || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Requisições</p>
            <p className="text-2xl font-bold text-purple-600">{tokenStats?.requestsCount || 0}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Uso do Limite</span>
            <span className="text-sm text-gray-600">
              {tokenStats ? Math.round((tokenStats.tokensUsed / tokenStats.tokenLimit) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                tokenStats && (tokenStats.tokensUsed / tokenStats.tokenLimit) > 0.8
                  ? 'bg-red-600'
                  : tokenStats && (tokenStats.tokensUsed / tokenStats.tokenLimit) > 0.6
                  ? 'bg-orange-600'
                  : 'bg-green-600'
              }`}
              style={{
                width: `${tokenStats ? Math.min((tokenStats.tokensUsed / tokenStats.tokenLimit) * 100, 100) : 0}%`,
              }}
            />
          </div>
          {tokenStats && (tokenStats.tokensUsed / tokenStats.tokenLimit) > 0.8 && (
            <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Atenção: Você está próximo do limite mensal de tokens!
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Sugestões</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {suggestionStats?.total || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Sparkles className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sugestões Aplicadas</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {suggestionStats?.applied || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confiança Média</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {suggestionStats?.avgConfidence || 0}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Aprovação</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {feedbackStats?.usefulRate || 0}%
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Sugestões por Tipo
          </h2>
          <div className="space-y-3">
            {Object.entries(suggestionStats?.byType || {}).map(([type, count]) => {
              const percentage = suggestionStats
                ? Math.round((count / suggestionStats.total) * 100)
                : 0;
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {getSuggestionTypeLabel(type)}
                    </span>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Feedback dos Usuários
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Feedback Positivo</p>
                  <p className="text-sm text-gray-600">Sugestões úteis</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {feedbackStats?.useful || 0}
              </p>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-3">
                <XCircle className="h-6 w-6 text-red-600" />
                <div>
                  <p className="font-medium text-gray-900">Feedback Negativo</p>
                  <p className="text-sm text-gray-600">Sugestões não úteis</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {feedbackStats?.not_useful || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            Padrões de Uso de Recursos
          </h2>
          <button
            onClick={handleAnalyzePatterns}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4" />
                Atualizar Análise
              </>
            )}
          </button>
        </div>
        {usagePatterns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>Nenhum padrão de uso identificado ainda.</p>
            <p className="text-sm mt-1">Clique em "Atualizar Análise" para gerar padrões.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Recurso
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo de Padrão
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Período
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Uso Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Duração Média
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usagePatterns.map((pattern) => (
                  <tr key={pattern.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {(pattern as any).resources?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {pattern.pattern_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {pattern.time_slot}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {pattern.usage_count}x
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {Math.round(pattern.average_duration / 60)}h {pattern.average_duration % 60}min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Recomendações de Otimização
        </h2>
        <div className="space-y-3">
          {suggestionStats && suggestionStats.applied / suggestionStats.total < 0.3 && (
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">
                  Baixa taxa de aplicação de sugestões
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Apenas {Math.round((suggestionStats.applied / suggestionStats.total) * 100)}% das
                  sugestões são aplicadas. Considere revisar a relevância das sugestões geradas.
                </p>
              </div>
            </div>
          )}
          {feedbackStats && feedbackStats.usefulRate < 60 && (
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">
                  Taxa de aprovação abaixo do esperado
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  A taxa de aprovação está em {feedbackStats.usefulRate}%. Revise os prompts da IA
                  para melhorar a qualidade das sugestões.
                </p>
              </div>
            </div>
          )}
          {usagePatterns.length === 0 && (
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Análise de padrões pendente</p>
                <p className="text-sm text-gray-600 mt-1">
                  Execute a análise de padrões para identificar oportunidades de otimização no uso
                  de recursos.
                </p>
              </div>
            </div>
          )}
          {suggestionStats &&
            feedbackStats &&
            suggestionStats.applied / suggestionStats.total >= 0.3 &&
            feedbackStats.usefulRate >= 60 &&
            usagePatterns.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Sistema funcionando bem</p>
                  <p className="text-sm text-gray-600 mt-1">
                    As métricas de IA estão saudáveis. Continue monitorando o desempenho
                    regularmente.
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;
