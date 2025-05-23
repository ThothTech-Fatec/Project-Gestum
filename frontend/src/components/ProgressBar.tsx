import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ProgressBarProps {
  projetoId: number;
  height?: number;
  showText?: boolean;
  showStatus?: boolean;
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

const getStatusFromProgress = (progresso: number): 'nao_iniciado' | 'em_andamento' | 'concluido' => {
  if (progresso <= 0) return 'nao_iniciado';
  if (progresso >= 100) return 'concluido';
  return 'em_andamento';
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  projetoId,
  height = 16,
  showText = true,
  showStatus = false,
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
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        const response = await axios.get<StoryPointsResponse>(
          `http://localhost:5000/progressStoryPoints/${projetoId}`
        );
        
        const { concluido, total } = response.data;
        const calculatedProgress = total > 0 ? Math.round((concluido / total) * 100) : 0;
        setProgress(calculatedProgress);
      } catch (err) {
        console.error('Erro ao buscar progresso:', err);
        setError('Erro ao carregar progresso');
        setProgress(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [projetoId]);

  const clampedProgress = Math.min(100, Math.max(0, progress));
  const status = getStatusFromProgress(clampedProgress);

  const statusTextMap = {
    'nao_iniciado': 'Não Iniciado',
    'em_andamento': 'Em Andamento',
    'concluido': 'Concluído'
  };

  const statusColors = {
    'nao_iniciado': '#ef4444',
    'em_andamento': '#f59e0b',
    'concluido': '#10b981'
  };

  return (
    <div className="progress-container">
      <div 
        className="progress-bar-background" 
        style={{
          height: `${height}px`,
          backgroundColor,
          borderRadius: borderRadius ? `${borderRadius}px` : `${height/2}px`,
          overflow: 'hidden'
        }}
      >
        <div
          className="progress-bar-fill"
          style={{
            width: `${clampedProgress}%`,
            backgroundColor: color,
            height: '100%',
            transition: `width ${transitionSpeed}ms ease-in-out`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '8px',
            color: textColor,
            fontSize: `${Math.max(10, height * 0.6)}px`,
            fontWeight: 'bold'
          }}
        >
          {showText && `${clampedProgress}%`}
        </div>
      </div>

      {showStatus && (
        <div 
          className="status-indicator"
          style={{
            marginTop: '4px',
            color: statusColors[status],
            fontSize: '12px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <div 
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: statusColors[status],
              marginRight: '6px'
            }} 
          />
          {statusTextMap[status]}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;