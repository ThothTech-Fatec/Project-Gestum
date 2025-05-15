import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ProgressBarProps {
  projetoId: number;
  height?: number;
  showText?: boolean;
  color?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  transitionSpeed?: number;
}

interface StoryPointsResponse {
  concluido: number;
  naoConcluido: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  projetoId,
  height = 16,
  showText = true,
  color = '#2563eb',
  backgroundColor = '#e2e8f0',
  textColor = '#ffffff',
  borderRadius,
  transitionSpeed = 300
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoryPoints = async () => {
      try {
        setLoading(true);
        const response = await axios.get<StoryPointsResponse>(
          `http://localhost:5000/progressStoryPoints/${projetoId}`
        );
        
        const { concluido, total } = response.data;

        console.log(response.data)
        const calculatedProgress = total > 0 ? Math.round((concluido / total) * 100) : 0;
        setProgress(calculatedProgress);
      } catch (err) {
        console.error('Erro ao buscar storypoints:', err);
        setError('Erro ao carregar progresso');
        setProgress(0);
      } finally {
        setLoading(false);
      }
    };

    fetchStoryPoints();
  }, [projetoId]);

  const clampedProgress = Math.min(100, Math.max(0, progress));
  const calculatedBorderRadius = borderRadius ?? height / 2;

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

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