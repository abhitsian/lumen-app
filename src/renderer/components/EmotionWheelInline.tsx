import { useState } from 'react';
import {
  PrimaryEmotion,
  EmotionIntensity,
  getEmotionColor,
  getEmotionLabel
} from '../../shared/types/emotions';

interface EmotionWheelInlineProps {
  selectedEmotion?: PrimaryEmotion;
  selectedIntensity?: EmotionIntensity;
  onSelect: (emotion: PrimaryEmotion, intensity: EmotionIntensity) => void;
}

// Emotion descriptions for tooltips
const EMOTION_DESCRIPTIONS: Record<PrimaryEmotion, Record<EmotionIntensity, string>> = {
  joy: {
    low: 'Serenity - A calm, peaceful contentment',
    medium: 'Joy - Feeling happy and pleased',
    high: 'Ecstasy - Overwhelming happiness and delight'
  },
  trust: {
    low: 'Acceptance - Open and receptive to others',
    medium: 'Trust - Confident reliance on someone or something',
    high: 'Admiration - Deep respect and warm approval'
  },
  fear: {
    low: 'Apprehension - Mild anxiety about something',
    medium: 'Fear - Feeling afraid or worried',
    high: 'Terror - Extreme fear and dread'
  },
  surprise: {
    low: 'Distraction - Slightly caught off guard',
    medium: 'Surprise - Unexpected wonder or amazement',
    high: 'Amazement - Overwhelming astonishment'
  },
  sadness: {
    low: 'Pensiveness - Thoughtful melancholy',
    medium: 'Sadness - Feeling sorrowful or unhappy',
    high: 'Grief - Deep, intense sorrow'
  },
  disgust: {
    low: 'Boredom - Lack of interest or excitement',
    medium: 'Disgust - Strong distaste or aversion',
    high: 'Loathing - Intense hatred or repulsion'
  },
  anger: {
    low: 'Annoyance - Mild irritation or displeasure',
    medium: 'Anger - Strong feeling of displeasure',
    high: 'Rage - Violent, uncontrollable anger'
  },
  anticipation: {
    low: 'Interest - Curiosity and attention',
    medium: 'Anticipation - Excited expectation',
    high: 'Vigilance - Heightened alertness and readiness'
  }
};

export function EmotionWheelInline({
  selectedEmotion,
  selectedIntensity,
  onSelect
}: EmotionWheelInlineProps) {
  const [hoveredSection, setHoveredSection] = useState<{
    emotion: PrimaryEmotion;
    intensity: EmotionIntensity;
  } | null>(null);

  const emotions: PrimaryEmotion[] = [
    'joy',
    'trust',
    'fear',
    'surprise',
    'sadness',
    'disgust',
    'anger',
    'anticipation'
  ];

  const intensityLevels: EmotionIntensity[] = ['high', 'medium', 'low'];
  const intensityRadii = {
    low: { inner: 50, outer: 110 },
    medium: { inner: 110, outer: 170 },
    high: { inner: 170, outer: 230 }
  };

  const centerX = 300;
  const centerY = 300;
  const anglePerEmotion = 360 / emotions.length;

  // Helper to create SVG path for a petal section
  const createPetalPath = (
    index: number,
    intensity: EmotionIntensity
  ): string => {
    const startAngle = (index * anglePerEmotion - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * anglePerEmotion - 90) * (Math.PI / 180);
    const radii = intensityRadii[intensity];

    const innerStartX = centerX + radii.inner * Math.cos(startAngle);
    const innerStartY = centerY + radii.inner * Math.sin(startAngle);
    const innerEndX = centerX + radii.inner * Math.cos(endAngle);
    const innerEndY = centerY + radii.inner * Math.sin(endAngle);
    const outerStartX = centerX + radii.outer * Math.cos(startAngle);
    const outerStartY = centerY + radii.outer * Math.sin(startAngle);
    const outerEndX = centerX + radii.outer * Math.cos(endAngle);
    const outerEndY = centerY + radii.outer * Math.sin(endAngle);

    return `
      M ${innerStartX} ${innerStartY}
      L ${outerStartX} ${outerStartY}
      A ${radii.outer} ${radii.outer} 0 0 1 ${outerEndX} ${outerEndY}
      L ${innerEndX} ${innerEndY}
      A ${radii.inner} ${radii.inner} 0 0 0 ${innerStartX} ${innerStartY}
      Z
    `;
  };

  // Helper to get text position and rotation - FIXED to prevent upside-down text
  const getTextTransform = (index: number, intensity: EmotionIntensity) => {
    const midAngle = (index * anglePerEmotion + anglePerEmotion / 2 - 90) * (Math.PI / 180);
    const radii = intensityRadii[intensity];
    const radius = (radii.inner + radii.outer) / 2;

    const x = centerX + radius * Math.cos(midAngle);
    const y = centerY + radius * Math.sin(midAngle);

    // Calculate rotation in degrees
    let rotation = index * anglePerEmotion + anglePerEmotion / 2;

    // Fix upside-down text: if rotation is between 90 and 270, flip it 180 degrees
    if (rotation > 90 && rotation < 270) {
      rotation += 180;
    }

    return { x, y, rotation };
  };

  const isHovered = (emotion: PrimaryEmotion, intensity: EmotionIntensity) => {
    return hoveredSection?.emotion === emotion && hoveredSection?.intensity === intensity;
  };

  const isSelected = (emotion: PrimaryEmotion, intensity: EmotionIntensity) => {
    return selectedEmotion === emotion && selectedIntensity === intensity;
  };

  return (
    <div className="flex flex-col items-center relative">
      {/* Hover Tooltip */}
      {hoveredSection && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-4 z-10 animate-in fade-in duration-200">
          <div
            className="px-6 py-3 rounded-lg shadow-lg"
            style={{
              backgroundColor: getEmotionColor(hoveredSection.emotion),
              minWidth: '280px'
            }}
          >
            <div className="text-white text-center">
              <div className="font-bold text-lg mb-1">
                {getEmotionLabel(hoveredSection.emotion, hoveredSection.intensity)}
              </div>
              <div className="text-sm opacity-90">
                {EMOTION_DESCRIPTIONS[hoveredSection.emotion][hoveredSection.intensity]}
              </div>
              <div className="text-xs mt-2 opacity-75">
                Click to select this emotion
              </div>
            </div>
          </div>
          {/* Arrow pointing down */}
          <div
            className="w-0 h-0 mx-auto"
            style={{
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: `8px solid ${getEmotionColor(hoveredSection.emotion)}`
            }}
          />
        </div>
      )}

      <svg
        width="600"
        height="600"
        viewBox="0 0 600 600"
        className="max-w-full"
      >
        {/* Background */}
        <circle
          cx={centerX}
          cy={centerY}
          r="240"
          fill="#fafafa"
          stroke="#e0e0e0"
          strokeWidth="2"
        />

        {/* Render emotion petals */}
        {emotions.map((emotion, index) => {
          const color = getEmotionColor(emotion);

          return (
            <g key={emotion}>
              {intensityLevels.map((intensity) => {
                const path = createPetalPath(index, intensity);
                const label = getEmotionLabel(emotion, intensity);
                const textTransform = getTextTransform(index, intensity);
                const hovered = isHovered(emotion, intensity);
                const selected = isSelected(emotion, intensity);

                // Calculate opacity and scale
                const baseOpacity = intensity === 'high' ? 0.9 : intensity === 'medium' ? 0.75 : 0.6;
                const opacity = selected ? 1 : hovered ? 0.95 : baseOpacity;
                const scale = selected ? 1.05 : hovered ? 1.1 : 1;

                // Font size based on intensity
                const fontSize = intensity === 'high' ? 15 : intensity === 'medium' ? 12 : 10;

                return (
                  <g
                    key={`${emotion}-${intensity}`}
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: `${centerX}px ${centerY}px`,
                      transition: 'transform 0.2s ease-out'
                    }}
                  >
                    {/* Petal path */}
                    <path
                      d={path}
                      fill={color}
                      opacity={opacity}
                      stroke={selected ? '#1a1a1a' : hovered ? '#404040' : 'white'}
                      strokeWidth={selected ? 4 : hovered ? 3 : 1.5}
                      className="cursor-pointer"
                      style={{ transition: 'opacity 0.2s, stroke 0.2s, stroke-width 0.2s' }}
                      onMouseEnter={() => setHoveredSection({ emotion, intensity })}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={() => onSelect(emotion, intensity)}
                    />

                    {/* Label text - now always readable */}
                    <text
                      x={textTransform.x}
                      y={textTransform.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="font-semibold pointer-events-none select-none"
                      fill={selected || hovered ? '#ffffff' : '#1a1a1a'}
                      fontSize={fontSize}
                      fontWeight={selected ? 700 : hovered ? 600 : 500}
                      transform={`rotate(${textTransform.rotation}, ${textTransform.x}, ${textTransform.y})`}
                      style={{
                        textShadow: selected || hovered
                          ? '0 2px 4px rgba(0,0,0,0.6)'
                          : '0 1px 2px rgba(255,255,255,0.9)',
                        transition: 'fill 0.2s, font-weight 0.2s'
                      }}
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Center circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r="45"
          fill="white"
          stroke="#d0d0d0"
          strokeWidth="2"
        />
        <text
          x={centerX}
          y={centerY - 5}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-sm font-bold pointer-events-none select-none"
          fill="#666"
        >
          How are
        </text>
        <text
          x={centerX}
          y={centerY + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-sm font-bold pointer-events-none select-none"
          fill="#666"
        >
          you feeling?
        </text>
      </svg>
    </div>
  );
}
