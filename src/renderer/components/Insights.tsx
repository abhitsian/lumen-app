import React, { useMemo } from 'react';
import { TrendingUp, Clock, Heart, Target, Zap, BookOpen, Brain, Award, Calendar, BarChart3 } from 'lucide-react';
import { AIInsights } from './AIInsights';

interface CapturedPage {
  id: string;
  url: string;
  title: string;
  browser: string;
  timestamp: string;
  domain: string;
  notes?: string;
  status?: 'to-read' | 'reading' | 'read' | 'reference';
  tags?: string[];
  collection?: string;
  isPinned?: boolean;
  readingTimeMs?: number;
  priority?: 'low' | 'medium' | 'high';
  addedToQueue?: boolean;
  queuedAt?: string;
}

interface AppActivity {
  id: string;
  appName: string;
  category: string;
  productivityLevel: string;
  startTime: string;
  endTime: string;
  durationMs: number;
}

interface EmotionEntry {
  id: string;
  timestamp: string;
  primaryEmotion: string;
  intensity: string;
  sessionId?: string;
}

interface InsightsProps {
  pages: CapturedPage[];
  appActivities: AppActivity[];
  emotions: EmotionEntry[];
  categorizePage: (domain: string, url: string, title: string) => string;
}

export function Insights({ pages, appActivities, emotions, categorizePage }: InsightsProps) {
  const insights = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Weekly data
    const weekPages = pages.filter(p => new Date(p.timestamp) >= weekAgo);
    const weekEmotions = emotions.filter(e => new Date(e.timestamp) >= weekAgo);
    const weekActivities = appActivities.filter(a => new Date(a.startTime) >= weekAgo);

    // Monthly data
    const monthPages = pages.filter(p => new Date(p.timestamp) >= monthAgo);
    const monthEmotions = emotions.filter(e => new Date(e.timestamp) >= monthAgo);

    // Category breakdown for week
    const weekCategories = weekPages.reduce((acc, page) => {
      const category = categorizePage(page.domain, page.url, page.title);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const weekCategoryArray = Object.entries(weekCategories)
      .map(([category, count]) => ({
        category,
        count,
        percentage: (count / weekPages.length) * 100
      }))
      .sort((a, b) => b.count - a.count);

    // Emotion breakdown
    const weekEmotionBreakdown = weekEmotions.reduce((acc, emotion) => {
      acc[emotion.primaryEmotion] = (acc[emotion.primaryEmotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const weekEmotionArray = Object.entries(weekEmotionBreakdown)
      .map(([emotion, count]) => ({
        emotion,
        count,
        percentage: (count / weekEmotions.length) * 100
      }))
      .sort((a, b) => b.count - a.count);

    // Productivity score based on app activities
    const highProductivityTime = weekActivities
      .filter(a => a.productivityLevel === 'high')
      .reduce((sum, a) => sum + a.durationMs, 0);
    const totalTime = weekActivities.reduce((sum, a) => sum + a.durationMs, 0);
    const productivityScore = totalTime > 0 ? (highProductivityTime / totalTime) * 100 : 0;

    // Streak calculation (consecutive days with activity)
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const hasActivity = pages.some(p => p.timestamp.startsWith(dateStr)) ||
                         emotions.some(e => e.timestamp.startsWith(dateStr));

      if (hasActivity) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Content-Emotion correlations
    const contentEmotionMap: Record<string, Record<string, number>> = {};

    weekPages.forEach(page => {
      const category = categorizePage(page.domain, page.url, page.title);
      const pageTime = new Date(page.timestamp).getTime();

      // Find emotions within 30 minutes of reading this page
      const relatedEmotions = weekEmotions.filter(e => {
        const emotionTime = new Date(e.timestamp).getTime();
        return Math.abs(emotionTime - pageTime) < 30 * 60 * 1000;
      });

      relatedEmotions.forEach(emotion => {
        if (!contentEmotionMap[category]) {
          contentEmotionMap[category] = {};
        }
        contentEmotionMap[category][emotion.primaryEmotion] =
          (contentEmotionMap[category][emotion.primaryEmotion] || 0) + 1;
      });
    });

    const emotionContentCorrelations = Object.entries(contentEmotionMap)
      .map(([category, emotionCounts]) => {
        const total = Object.values(emotionCounts).reduce((sum, count) => sum + count, 0);
        const emotions = Object.entries(emotionCounts)
          .map(([emotion, count]) => ({
            emotion,
            percentage: (count / total) * 100
          }))
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 3);

        return { category, emotions };
      })
      .filter(item => item.emotions.length > 0);

    // Generate AI-like insights
    const generatedInsights: string[] = [];

    if (weekPages.length > monthPages.length / 4) {
      generatedInsights.push(`📈 You're on fire! Read ${weekPages.length} articles this week - that's ${Math.round((weekPages.length / (monthPages.length / 4)) * 100)}% above your monthly average.`);
    }

    if (weekCategoryArray.length > 0) {
      const topCategory = weekCategoryArray[0];
      generatedInsights.push(`🎯 ${topCategory.category} content dominated your reading (${topCategory.percentage.toFixed(0)}%). You're deep-diving into this topic!`);
    }

    if (weekEmotionArray.length > 0) {
      const topEmotion = weekEmotionArray[0];
      generatedInsights.push(`💭 You felt ${topEmotion.emotion} most often this week (${topEmotion.percentage.toFixed(0)}% of tracked emotions).`);
    }

    if (productivityScore > 70) {
      generatedInsights.push(`⚡ Impressive! ${productivityScore.toFixed(0)}% of your app time was highly productive work. Keep this momentum!`);
    }

    if (streak >= 7) {
      generatedInsights.push(`🔥 ${streak}-day streak! You're building consistent learning habits.`);
    }

    if (emotionContentCorrelations.length > 0) {
      const topCorrelation = emotionContentCorrelations[0];
      const dominantEmotion = topCorrelation.emotions[0];
      generatedInsights.push(`🧠 Pattern detected: ${topCorrelation.category} content tends to make you feel ${dominantEmotion.emotion} (${dominantEmotion.percentage.toFixed(0)}% of the time).`);
    }

    // Best reading time
    const hourCounts = weekPages.reduce((acc, page) => {
      const hour = new Date(page.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const bestHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    if (bestHour) {
      const hour = parseInt(bestHour[0]);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      generatedInsights.push(`⏰ Your peak reading time: ${displayHour}${period} - you captured ${bestHour[1]} articles during this hour.`);
    }

    return {
      week: {
        pages: weekPages.length,
        emotions: weekEmotions.length,
        categories: weekCategoryArray,
        emotionBreakdown: weekEmotionArray,
        productivityScore,
        streak,
        insights: generatedInsights,
        emotionContentCorrelations
      },
      month: {
        pages: monthPages.length,
        emotions: monthEmotions.length
      }
    };
  }, [pages, appActivities, emotions, categorizePage]);

  const formatTime = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Insights</h1>
          <p className="text-gray-600">AI-powered analysis of your reading and emotion patterns</p>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-blue-500" />
              <div className="text-xs font-medium text-gray-500">THIS WEEK</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{insights.week.pages}</div>
            <div className="text-sm text-gray-500 mt-1">articles read</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-8 h-8 text-pink-500" />
              <div className="text-xs font-medium text-gray-500">EMOTIONS</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{insights.week.emotions}</div>
            <div className="text-sm text-gray-500 mt-1">tracked this week</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 text-orange-500" />
              <div className="text-xs font-medium text-gray-500">PRODUCTIVITY</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{insights.week.productivityScore.toFixed(0)}%</div>
            <div className="text-sm text-gray-500 mt-1">focus score</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-green-500" />
              <div className="text-xs font-medium text-gray-500">STREAK</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{insights.week.streak}</div>
            <div className="text-sm text-gray-500 mt-1">days active</div>
          </div>
        </div>

        {/* Algorithmic Insights */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Smart Insights</h2>
              <p className="text-sm text-white/80">Pattern-based analysis</p>
            </div>
          </div>
          <div className="space-y-3">
            {insights.week.insights.map((insight, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="text-white/90 leading-relaxed">{insight}</p>
              </div>
            ))}
            {insights.week.insights.length === 0 && (
              <p className="text-white/70">Keep tracking to unlock personalized insights!</p>
            )}
          </div>
        </div>

        {/* Real AI Insights (Ollama) */}
        <AIInsights
          stats={{
            totalPages: insights.week.pages,
            topCategories: insights.week.categories,
            topEmotions: insights.week.emotionBreakdown,
            productivityScore: insights.week.productivityScore,
            streak: insights.week.streak,
            topDomains: [
              { domain: 'example.com', count: 5 }
            ]
          }}
          emotionCorrelations={insights.week.emotionContentCorrelations}
        />

        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Content Categories
            </h3>
            <div className="space-y-3">
              {insights.week.categories.slice(0, 5).map((item) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.category}</span>
                    <span className="text-sm text-gray-500">{item.count} ({item.percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              {insights.week.categories.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No reading data yet</p>
              )}
            </div>
          </div>

          {/* Emotion Breakdown */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Emotional Patterns
            </h3>
            <div className="space-y-3">
              {insights.week.emotionBreakdown.slice(0, 5).map((item) => (
                <div key={item.emotion}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">{item.emotion}</span>
                    <span className="text-sm text-gray-500">{item.count} ({item.percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              {insights.week.emotionBreakdown.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Start tracking emotions to see patterns</p>
              )}
            </div>
          </div>
        </div>

        {/* Emotion-Content Correlations */}
        {insights.week.emotionContentCorrelations.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              Content → Emotion Patterns
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {insights.week.emotionContentCorrelations.map((correlation) => (
                <div key={correlation.category} className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                  <h4 className="font-semibold text-gray-900 mb-3">{correlation.category}</h4>
                  <div className="space-y-2">
                    {correlation.emotions.map((emotion) => (
                      <div key={emotion.emotion} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">{emotion.emotion}</span>
                        <span className="text-sm font-medium text-purple-600">{emotion.percentage.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Comparison */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-500" />
            Monthly Overview
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">Total Articles (30 days)</div>
              <div className="text-2xl font-bold text-gray-900">{insights.month.pages}</div>
              <div className="text-sm text-gray-500 mt-1">{(insights.month.pages / 30).toFixed(1)} per day average</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Emotions Tracked (30 days)</div>
              <div className="text-2xl font-bold text-gray-900">{insights.month.emotions}</div>
              <div className="text-sm text-gray-500 mt-1">{(insights.month.emotions / 30).toFixed(1)} per day average</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Week vs Month</div>
              <div className="text-2xl font-bold text-gray-900">
                {insights.month.pages > 0 ? ((insights.week.pages / (insights.month.pages / 4)) * 100).toFixed(0) : 0}%
              </div>
              <div className="text-sm text-gray-500 mt-1">of weekly average</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
