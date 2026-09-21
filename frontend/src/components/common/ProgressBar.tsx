import React from 'react';

interface ProgressBarProps {
  value: number; // percentage (0 - 100+)
  height?: 'sm' | 'md' | 'lg';
  color?: string;
  autoColor?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  height = 'md',
  color,
  autoColor = true,
  className = '',
}) => {
  const clampedDisplayWidth = Math.min(100, Math.max(0, value));

  let barColor = color;
  if (!barColor && autoColor) {
    if (value >= 100) {
      barColor = 'bg-rose-500';
    } else if (value >= 80) {
      barColor = 'bg-amber-500';
    } else {
      barColor = 'bg-emerald-500';
    }
  } else if (!barColor) {
    barColor = 'bg-brand-500';
  }

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={`w-full bg-surface-100 rounded-full overflow-hidden border border-surface-200/50 ${heightStyles[height]} ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${
          barColor.startsWith('#') ? '' : barColor
        }`}
        style={{
          width: `${clampedDisplayWidth}%`,
          backgroundColor: barColor.startsWith('#') ? barColor : undefined,
        }}
      />
    </div>
  );
};
