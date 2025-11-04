import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, TrendingUp, AlertCircle, RefreshCw, Settings, CheckCircle, Loader } from 'lucide-react';
import { ollamaService } from '../../shared/services/ollama';

interface AIInsightsProps {
  stats: {
    totalPages: number;
    topCategories: Array<{ category: string; count: number; percentage: number }>;
    topEmotions: Array<{ emotion: string; count: number; percentage: number }>;
    productivityScore: number;
    streak: number;
    topDomains: Array<{ domain: string; count: number }>;
  };
  emotionCorrelations: Array<{
    category: string;
    emotions: Array<{ emotion: string; percentage: number }>;
  }>;
}

export function AIInsights({ stats, emotionCorrelations }: AIInsightsProps) {
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('llama3.2:3b');
  const [weeklyReport, setWeeklyReport] = useState<string>('');
  const [emotionInsights, setEmotionInsights] = useState<Record<string, string>>({});
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  // Check Ollama availability on mount
  useEffect(() => {
    checkOllama();
  }, []);

  const checkOllama = async () => {
    const available = await ollamaService.isAvailable();
    setOllamaAvailable(available);

    if (available) {
      const models = await ollamaService.listModels();
      setAvailableModels(models);
      if (models.length > 0) {
        setSelectedModel(models[0]);
        ollamaService.setDefaultModel(models[0]);
      }
    }
  };

  const generateAIInsights = async () => {
    if (!ollamaAvailable) {
      setShowSetup(true);
      return;
    }

    setLoading(true);
    try {
      // Generate weekly report
      const report = await ollamaService.generateWeeklyReport(stats);
      setWeeklyReport(report);

      // Generate emotion-content insights
      const insights: Record<string, string> = {};
      for (const correlation of emotionCorrelations.slice(0, 3)) {
        const insight = await ollamaService.analyzeEmotionPattern(correlation);
        insights[correlation.category] = insight;
      }
      setEmotionInsights(insights);

      // Generate topic suggestions
      const topics = stats.topCategories.map(c => c.category);
      const suggestions = await ollamaService.suggestTopics(topics);
      setSuggestedTopics(suggestions);

    } catch (error) {
      console.error('AI generation error:', error);
      alert('Error generating AI insights. Make sure Ollama is running and a model is downloaded.');
    } finally {
      setLoading(false);
    }
  };

  if (ollamaAvailable === null) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-600">Checking AI availability...</span>
        </div>
      </div>
    );
  }

  if (!ollamaAvailable) {
    const instructions = ollamaService.getSetupInstructions();
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 shadow-sm border border-purple-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">AI Features Available!</h3>
            <p className="text-sm text-gray-600 mb-4">
              Get personalized AI-powered insights, article summaries, and smart recommendations - all running locally on your Mac for free!
            </p>

            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Quick Setup (2 minutes):</h4>
              <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
{`# Install Ollama
brew install ollama

# Pull a model (choose one)
ollama pull llama3.2:3b    # Recommended (4GB)
ollama pull phi3:mini      # Fastest (2GB)
ollama pull mistral:7b     # Most powerful (4GB)

# Ollama will start automatically
# Then restart this app!`}
              </pre>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={checkOllama}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Check Again
              </button>
              <a
                href="https://ollama.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium border border-gray-300"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Status Bar */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 shadow-sm border border-green-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">AI Ready</h4>
              <p className="text-xs text-gray-600">Running locally on your Mac • 100% Private</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                ollamaService.setDefaultModel(e.target.value);
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              {availableModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>

            <button
              onClick={generateAIInsights}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate AI Insights
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI-Generated Weekly Report */}
      {weeklyReport && (
        <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Your AI Reading Coach</h3>
              <p className="text-sm text-white/80">Personalized insights from {selectedModel}</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-white/90 leading-relaxed whitespace-pre-line">{weeklyReport}</p>
          </div>
        </div>
      )}

      {/* Emotion-Content Insights from AI */}
      {Object.keys(emotionInsights).length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Pattern Analysis
          </h3>
          <div className="space-y-3">
            {Object.entries(emotionInsights).map(([category, insight]) => (
              <div key={category} className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                <h4 className="font-semibold text-gray-900 mb-2">{category} Content</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Topic Suggestions */}
      {suggestedTopics.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Topics to Explore Next
          </h3>
          <div className="flex flex-wrap gap-2">
            {suggestedTopics.map((topic, index) => (
              <div
                key={index}
                className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100"
              >
                <span className="text-sm font-medium text-gray-900">{topic}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Based on your reading interests, these topics might expand your knowledge
          </p>
        </div>
      )}

      {/* Prompt to generate if no insights yet */}
      {!weeklyReport && !loading && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 text-center shadow-sm border border-blue-100">
          <Brain className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Ready for AI Insights?</h3>
          <p className="text-gray-600 mb-4">
            Click "Generate AI Insights" above to get personalized analysis of your reading patterns,
            emotion-content correlations, and topic suggestions - all powered by local AI running on your Mac!
          </p>
          <p className="text-xs text-gray-500">
            100% Private • No API costs • Runs offline
          </p>
        </div>
      )}
    </div>
  );
}
