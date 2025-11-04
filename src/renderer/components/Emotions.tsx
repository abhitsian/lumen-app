import { useState, useEffect } from 'react';
import { Heart, Trash2, List, BarChart3, Save } from 'lucide-react';
import {
  PrimaryEmotion,
  EmotionIntensity,
  EMOTION_WHEEL,
  getEmotionLabel,
  getEmotionColor,
  EmotionEntry
} from '../../shared/types/emotions';
import { EmotionWheelInline } from './EmotionWheelInline';

export function Emotions() {
  const [emotions, setEmotions] = useState<EmotionEntry[]>([]);
  const [view, setView] = useState<'wheel' | 'list' | 'chart'>('wheel');
  const [selectedEmotion, setSelectedEmotion] = useState<PrimaryEmotion | undefined>();
  const [selectedIntensity, setSelectedIntensity] = useState<EmotionIntensity | undefined>();
  const [note, setNote] = useState('');

  // Load emotions from electron store
  useEffect(() => {
    loadEmotions();
  }, []);

  const loadEmotions = async () => {
    try {
      const savedEmotions = await window.electron.store.get('emotions');
      if (savedEmotions) {
        setEmotions(savedEmotions);
      }
    } catch (error) {
      console.error('Error loading emotions:', error);
    }
  };

  const saveEmotions = async (updatedEmotions: EmotionEntry[]) => {
    try {
      await window.electron.store.set('emotions', updatedEmotions);
      setEmotions(updatedEmotions);
    } catch (error) {
      console.error('Error saving emotions:', error);
    }
  };

  const handleSelectEmotion = (emotion: PrimaryEmotion, intensity: EmotionIntensity) => {
    setSelectedEmotion(emotion);
    setSelectedIntensity(intensity);
  };

  const handleSaveEmotion = () => {
    if (!selectedEmotion || !selectedIntensity) return;

    const newEmotion: EmotionEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      primaryEmotion: selectedEmotion,
      intensity: selectedIntensity,
      timestamp: new Date().toISOString(),
      note: note.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    const updated = [newEmotion, ...emotions];
    saveEmotions(updated);

    // Reset form
    setSelectedEmotion(undefined);
    setSelectedIntensity(undefined);
    setNote('');

    // Show success feedback briefly
    const message = `Logged: ${getEmotionLabel(selectedEmotion, selectedIntensity)}`;
    console.log(message);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this emotion entry?')) {
      const updated = emotions.filter(e => e.id !== id);
      saveEmotions(updated);
    }
  };


  // Group emotions by date
  const grouped = emotions.reduce((acc, emotion) => {
    const date = new Date(emotion.timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(emotion);
    return acc;
  }, {} as Record<string, EmotionEntry[]>);

  // Chart data for last 7 days
  const getLast7DaysData = () => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayEmotions = emotions.filter(e =>
        new Date(e.timestamp).toISOString().split('T')[0] === date
      );

      const counts: Record<PrimaryEmotion, number> = {
        joy: 0, trust: 0, fear: 0, surprise: 0,
        sadness: 0, disgust: 0, anger: 0, anticipation: 0
      };

      dayEmotions.forEach(e => {
        counts[e.primaryEmotion]++;
      });

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...counts
      };
    });
  };

  const chartData = getLast7DaysData();

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-pink-700 rounded-lg">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Emotion Tracker</h1>
              <p className="text-xs text-gray-500">{emotions.length} emotions logged</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('wheel')}
                className={`p-1.5 rounded transition-colors ${
                  view === 'wheel'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Wheel view"
              >
                <Heart className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-1.5 rounded transition-colors ${
                  view === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('chart')}
                className={`p-1.5 rounded transition-colors ${
                  view === 'chart'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Chart view"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {view === 'wheel' ? (
          <div className="flex flex-col items-center p-6 space-y-6">
            {/* Emotion Wheel */}
            <EmotionWheelInline
              selectedEmotion={selectedEmotion}
              selectedIntensity={selectedIntensity}
              onSelect={handleSelectEmotion}
            />

            {/* Selected Emotion Display */}
            {selectedEmotion && selectedIntensity && (
              <div className="w-full max-w-md space-y-4">
                <div
                  className="text-center py-4 px-6 rounded-lg text-white font-bold text-xl"
                  style={{ backgroundColor: getEmotionColor(selectedEmotion) }}
                >
                  {getEmotionLabel(selectedEmotion, selectedIntensity)}
                </div>

                {/* Note Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add a note (optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What triggered this emotion? What are you thinking about?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveEmotion}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
                >
                  <Save className="w-5 h-5" />
                  Save Emotion
                </button>
              </div>
            )}

            {/* Recent entries preview */}
            {emotions.length > 0 && (
              <div className="w-full max-w-md mt-8">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Recent Emotions</h3>
                <div className="space-y-2">
                  {emotions.slice(0, 3).map(emotion => (
                    <div
                      key={emotion.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getEmotionColor(emotion.primaryEmotion) }}
                      />
                      <span className="text-sm font-medium text-gray-800">
                        {getEmotionLabel(emotion.primaryEmotion, emotion.intensity)}
                      </span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {new Date(emotion.timestamp).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : view === 'chart' ? (
          <div className="p-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Last 7 Days</h3>
              <div className="space-y-4">
                {primaryEmotions.map(emotion => {
                  const color = getEmotionColor(emotion);
                  const maxCount = Math.max(...chartData.flatMap(d => Object.values(d).filter(v => typeof v === 'number'))) || 1;

                  return (
                    <div key={emotion}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-24 text-sm font-medium capitalize text-gray-700">{emotion}</div>
                        <div className="flex-1 flex gap-1">
                          {chartData.map((day, idx) => {
                            const count = day[emotion] as number;
                            const height = (count / maxCount) * 100;

                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center">
                                <div
                                  className="w-full rounded-t"
                                  style={{
                                    height: `${Math.max(height, count > 0 ? 20 : 0)}px`,
                                    backgroundColor: color,
                                    opacity: count > 0 ? 1 : 0.2
                                  }}
                                  title={`${day.date}: ${count}`}
                                />
                                {idx === 0 || idx === chartData.length - 1 ? (
                                  <span className="text-xs text-gray-400 mt-1">{day.date}</span>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {Object.entries(grouped).map(([date, dayEmotions]) => (
              <div key={date}>
                <h2 className="text-lg font-bold text-gray-800 mb-3">{date}</h2>
                <div className="space-y-3">
                  {dayEmotions.map(emotion => {
                    const label = getEmotionLabel(emotion.primaryEmotion, emotion.intensity);
                    const color = getEmotionColor(emotion.primaryEmotion);

                    return (
                      <div
                        key={emotion.id}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className="px-3 py-1 rounded-full text-white font-semibold text-sm"
                                style={{ backgroundColor: color }}
                              >
                                {label}
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(emotion.timestamp).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            {emotion.note && (
                              <p className="text-sm text-gray-700 mt-2">{emotion.note}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDelete(emotion.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
