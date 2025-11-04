// Plutchik's Wheel of Emotions
export type PrimaryEmotion =
  | 'joy'
  | 'trust'
  | 'fear'
  | 'surprise'
  | 'sadness'
  | 'disgust'
  | 'anger'
  | 'anticipation';

export type EmotionIntensity = 'low' | 'medium' | 'high';

// Emotion with varying intensities
export interface EmotionDefinition {
  primary: PrimaryEmotion;
  low: string;      // e.g., serenity
  medium: string;   // e.g., joy
  high: string;     // e.g., ecstasy
  color: string;    // Color for visualization
}

export const EMOTION_WHEEL: Record<PrimaryEmotion, EmotionDefinition> = {
  joy: {
    primary: 'joy',
    low: 'serenity',
    medium: 'joy',
    high: 'ecstasy',
    color: '#FFD700' // gold
  },
  trust: {
    primary: 'trust',
    low: 'acceptance',
    medium: 'trust',
    high: 'admiration',
    color: '#90EE90' // light green
  },
  fear: {
    primary: 'fear',
    low: 'apprehension',
    medium: 'fear',
    high: 'terror',
    color: '#9370DB' // medium purple
  },
  surprise: {
    primary: 'surprise',
    low: 'distraction',
    medium: 'surprise',
    high: 'amazement',
    color: '#87CEEB' // sky blue
  },
  sadness: {
    primary: 'sadness',
    low: 'pensiveness',
    medium: 'sadness',
    high: 'grief',
    color: '#4169E1' // royal blue
  },
  disgust: {
    primary: 'disgust',
    low: 'boredom',
    medium: 'disgust',
    high: 'loathing',
    color: '#BA55D3' // medium orchid
  },
  anger: {
    primary: 'anger',
    low: 'annoyance',
    medium: 'anger',
    high: 'rage',
    color: '#DC143C' // crimson
  },
  anticipation: {
    primary: 'anticipation',
    low: 'interest',
    medium: 'anticipation',
    high: 'vigilance',
    color: '#FFA500' // orange
  }
};

export interface EmotionEntry {
  id: string;
  primaryEmotion: PrimaryEmotion;
  intensity: EmotionIntensity;
  timestamp: string;
  note?: string;
  createdAt: string;
}

// Helper function to get emotion label
export function getEmotionLabel(primary: PrimaryEmotion, intensity: EmotionIntensity): string {
  const emotion = EMOTION_WHEEL[primary];
  return emotion[intensity];
}

// Helper function to get emotion color
export function getEmotionColor(primary: PrimaryEmotion): string {
  return EMOTION_WHEEL[primary].color;
}
