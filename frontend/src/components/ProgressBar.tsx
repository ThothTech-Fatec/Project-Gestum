import React from 'react';

interface ProgressBarProps {
  progress: number; 
  height?: number;
  showText?: boolean; 
  color?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  transitionSpeed?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 16,
  showText = true,
  color = '#2563eb', 
  backgroundColor = '#e2e8f0',
  textColor = '#ffffff',
  borderRadius,
  transitionSpeed = 300
}) => {
  // Garante que o progresso esteja entre 0 e 100
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  // Calcula o borderRadius baseado na altura se não for fornecido
  const calculatedBorderRadius = borderRadius ?? height / 2;

  return (
    <div className="progress-bar-container" 
      style={{
        width: '100%',
        backgroundColor,
        borderRadius: `${calculatedBorderRadius}px`,
        height: `${height}px`,
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
      }}
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div 
        className="progress-bar-fill" 
        style={{ 
          width: `${clampedProgress}%`,
          backgroundColor: color,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: showText ? 'flex-end' : 'center',
          paddingRight: showText ? '10px' : '0',
          color: textColor,
          fontWeight: 'bold',
          fontSize: `${Math.max(10, height * 0.5)}px`,
          transition: `width ${transitionSpeed}ms ease-in-out`,
          borderRadius: clampedProgress === 100 ? 
            `${calculatedBorderRadius}px` : 
            `${calculatedBorderRadius}px 0 0 ${calculatedBorderRadius}px`
        }}
      >
        {showText && `${clampedProgress}%`}
      </div>
    </div>
  );
};

export default ProgressBar;