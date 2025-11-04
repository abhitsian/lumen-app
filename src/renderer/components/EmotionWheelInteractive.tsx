import { useState } from 'react';
import {
  PrimaryEmotion,
  EmotionIntensity,
  getEmotionColor,
  getEmotionLabel,
  EMOTION_WHEEL
} from '../../shared/types/emotions';

interface EmotionWheelInteractiveProps {
  onSelect: (emotion: PrimaryEmotion, intensity: EmotionIntensity) => void;
  selectedEmotion?: PrimaryEmotion;
  selectedIntensity?: EmotionIntensity;
}

export function EmotionWheelInteractive({
  onSelect,
  selectedEmotion,
  selectedIntensity
}: EmotionWheelInteractiveProps) {
  const [hoveredSection, setHoveredSection] = useState<{ emotion: PrimaryEmotion; intensity: EmotionIntensity } | null>(null);

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
    low: { inner: 40, outer: 90 },
    medium: { inner: 90, outer: 140 },
    high: { inner: 140, outer: 190 }
  };

  const centerX = 250;
  const centerY = 250;
  const anglePerEmotion = 360 / emotions.length;

  // Helper to create SVG path for a petal section
  const createPetalPath = (
    emotion: PrimaryEmotion,
    intensity: EmotionIntensity,
    index: number
  ): string => {
    const startAngle = (index * anglePerEmotion - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * anglePerEmotion - 90) * (Math.PI / 180);
    const radii = intensityRadii[intensity];

    // Calculate points for the arc
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

  // Helper to get text position for labels
  const getTextPosition = (index: number, radius: number) => {
    const angle = (index * anglePerEmotion + anglePerEmotion / 2 - 90) * (Math.PI / 180);
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  const getOpacity = (
    emotion: PrimaryEmotion,
    intensity: EmotionIntensity
  ): number => {
    // Selected state
    if (selectedEmotion === emotion && selectedIntensity === intensity) {
      return 1;
    }
    // Hovered state
    if (hoveredSection?.emotion === emotion && hoveredSection?.intensity === intensity) {
      return 0.9;
    }
    // Same emotion but different intensity
    if (selectedEmotion === emotion) {
      return 0.4;
    }
    // Default state
    return intensity === 'high' ? 0.85 : intensity === 'medium' ? 0.7 : 0.55;
  };

  const getStrokeWidth = (
    emotion: PrimaryEmotion,
    intensity: EmotionIntensity
  ): number => {
    if (selectedEmotion === emotion && selectedIntensity === intensity) {
      return 4;
    }
    if (hoveredSection?.emotion === emotion && hoveredSection?.intensity === intensity) {
      return 3;
    }
    return 1;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width="500"
        height="500"
        viewBox="0 0 500 500"
        className="max-w-full"
        style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
      >
        {/* Background circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r="195"
          fill="#f9fafb"
          stroke="#e5e7eb"
          strokeWidth="2"
        />

        {/* Render all petals */}
        {emotions.map((emotion, index) => {
          const color = getEmotionColor(emotion);

          return (
            <g key={emotion}>
              {intensityLevels.map((intensity) => {
                const path = createPetalPath(emotion, intensity, index);
                const isSelected = selectedEmotion === emotion && selectedIntensity === intensity;
                const isHovered = hoveredSection?.emotion === emotion && hoveredSection?.intensity === intensity;

                return (
                  <path
                    key={`${emotion}-${intensity}`}
                    d={path}
                    fill={color}
                    opacity={getOpacity(emotion, intensity)}
                    stroke={isSelected ? '#1f2937' : isHovered ? '#374151' : 'white'}
                    strokeWidth={getStrokeWidth(emotion, intensity)}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredSection({ emotion, intensity })}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => onSelect(emotion, intensity)}
                    style={{
                      transform: isSelected || isHovered ? 'scale(1.02)' : 'scale(1)',
                      transformOrigin: 'center',
                      transition: 'transform 0.2s, opacity 0.2s'
                    }}
                  />
                );
              })}

              {/* Emotion name label on outer edge */}
              {(() => {
                const textPos = getTextPosition(index, 210);
                const angle = index * anglePerEmotion + anglePerEmotion / 2 - 90;

                return (
                  <text
                    x={textPos.x}
                    y={textPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="font-bold text-xs uppercase tracking-wide pointer-events-none select-none"
                    fill="#1f2937"
                    transform={`rotate(${angle + 90}, ${textPos.x}, ${textPos.y})`}
                    style={{ textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)' }}
                  >
                    {emotion}
                  </text>
                );
              })()}
            </g>
          );
        })}

        {/* Center circle with instructions */}
        <circle
          cx={centerX}
          cy={centerY}
          r="35"
          fill="white"
          stroke="#d1d5db"
          strokeWidth="2"
        />
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs font-semibold pointer-events-none select-none"
          fill="#6b7280"
        >
          Select
        </text>
      </svg>

      {/* Selected emotion display */}
      {selectedEmotion && selectedIntensity && (
        <div className="text-center">
          <div
            className="inline-block px-6 py-3 rounded-full text-white font-bold text-lg mb-2"
            style={{ backgroundColor: getEmotionColor(selectedEmotion) }}
          >
            {getEmotionLabel(selectedEmotion, selectedIntensity)}
          </div>
          <div className="text-sm text-gray-600">
            <span className="capitalize">{selectedEmotion}</span> • {selectedIntensity} intensity
          </div>
        </div>
      )}

      {/* Hover info */}
      {hoveredSection && (
        <div className="text-center text-sm text-gray-500">
          Click to select: <span className="font-semibold capitalize">
            {getEmotionLabel(hoveredSection.emotion, hoveredSection.intensity)}
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-gray-600 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 opacity-55"></div>
          <span>Low intensity (center)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 opacity-70"></div>
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 opacity-85"></div>
          <span>High (outer)</span>
        </div>
      </div>
    </div>
  );
}
