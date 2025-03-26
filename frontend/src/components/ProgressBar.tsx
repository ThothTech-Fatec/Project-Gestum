import React from 'react';

interface ProgressBarProps {
  progress: number; 
  height?: number;
  showText?: boolean; 
  color?: string;
  backgroundColor?: string; 
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 20,
  showText = true,
  color = '#4CAF50',
  backgroundColor = '#e0e0e0'
}) => {
  // Garante que o progresso esteja entre 0 e 100
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div 
      className="progress-container" 
      style={{
        width: '100%',
        backgroundColor,
        borderRadius: `${height / 2}px`,
        height: `${height}px`,
        overflow: 'hidden'
      }}
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div 
        className="progress-bar" 
        style={{ 
          width: `${clampedProgress}%`,
          backgroundColor: color,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: showText ? 'flex-end' : 'center',
          paddingRight: showText ? '8px' : '0',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: `${Math.max(10, height * 0.6)}px`,
          transition: 'width 0.3s ease-in-out'
        }}
      >
        {showText && `${clampedProgress}%`}
      </div>
    </div>
  );
};

export default ProgressBar;