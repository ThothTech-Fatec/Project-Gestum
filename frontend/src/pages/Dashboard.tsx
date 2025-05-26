import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Pie } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import "../css/Dashboard.css";
import SuperiorMenu from "../components/MenuSuperior.tsx";
import axios from "axios";
import PdfExportButton from "../components/pdfButton.tsx";

Chart.register(...registerables);

export interface DashboardData {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksByStatus: {
    label: string;
    count: number;
  }[];
  weeklyProgress: {
    date: string;
    completed: number;
  }[];
  totalStoryPoints: number;
  completedStoryPoints: number;
  participants?: {
    id_usuario: number;
    email_usuario: string;
    nome_usuario: string;
    tipo: string;
  }[];
  budget?: {
    total: number;
    used: number;
    remaining: number;
  };
}

export interface OrcamentoResumo {
  orcamento_total: number;
  orcamento_utilizado: number;
  orcamento_disponivel: number;
  percentual_utilizado: number;
}

export type Projeto = {
  id_projeto: number;
  nome_projeto: string;
  descricao_projeto: string;
  responsavel: string;
  data_inicio_proj: string;
  data_fim_proj: string;
  data_inicio_formatada?: string;
  data_fim_formatada?: string;
  progresso_projeto?: number;
  user_role?: string;
  nome_area: string;
  area_atuacao_id?: number;
  id_empresa?: number;
  nome_empresa?: string;
  cnpj?: string;
  status?: string;
};

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projeto = location.state?.projeto as Projeto | undefined;
  const projectId = projeto?.id_projeto;

  const [orcamentoResumo, setOrcamentoResumo] = useState<OrcamentoResumo>({
    orcamento_total: 0,
    orcamento_utilizado: 0,
    orcamento_disponivel: 0,
    percentual_utilizado: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!projectId) throw new Error("ID do projeto não encontrado");

        const response = await axios.get<DashboardData>(
          `http://localhost:5000/api/dashboard/${projectId}`
        );

        const tasksByStatus = [
          { label: "Concluída", count: response.data.completedTasks },
          { label: "Atrasada", count: response.data.overdueTasks },
          {
            label: "Em andamento",
            count:
              (response.data.totalTasks || 0) -
              (response.data.completedTasks || 0) -
              (response.data.overdueTasks || 0),
          },
        ];

        const budgetData = response.data.budget || {
          total: 10000,
          used: 0,
          remaining: 10000
        };

        setData({
          ...response.data,
          tasksByStatus,
          participants: response.data.participants || [],
          budget: budgetData
        });
      } catch (err: any) {
        console.error("Erro ao buscar dados:", err);
        setError(err.message);
        setTimeout(() => navigate("/projects"), 3000);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchOrcamentoResumo();
      fetchDashboardData();
    }
  }, [projectId, navigate]);

  const fetchOrcamentoResumo = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/projetos/${projectId}/orcamento/resumo`);
      const data = response.data.data;
      
      setOrcamentoResumo({
        orcamento_total: Number(data.orcamento_total) || 0,
        orcamento_utilizado: Number(data.orcamento_utilizado) || 0,
        orcamento_disponivel: Number(data.orcamento_disponivel) || 0,
        percentual_utilizado: Number(data.percentual_utilizado) || 0
      });
    } catch (error) {
      console.error('Erro ao buscar resumo de orçamento:', error);
      setOrcamentoResumo({
        orcamento_total: 0,
        orcamento_utilizado: 0,
        orcamento_disponivel: 0,
        percentual_utilizado: 0
      });
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <SuperiorMenu />
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Carregando dashboard do projeto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <SuperiorMenu />
        <div className="error-state">
          <h3>Erro ao carregar dashboard</h3>
          <p>{error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-container">
        <SuperiorMenu />
        <div className="no-data">
          <p>Nenhum dado disponível para este projeto</p>
          <p>Este projeto pode não ter atividades cadastradas ainda.</p>
        </div>
      </div>
    );
  }

  const totalTasks = data.totalTasks || 0;
  const completionPercentage =
    totalTasks > 0 ? Math.round((data.completedTasks / totalTasks) * 100) : 0;

  const storyPointsPercentage =
    (data.totalStoryPoints || 0) > 0
      ? Math.round((data.completedStoryPoints / data.totalStoryPoints) * 100)
      : 0;

  const remainingTasks = data.totalTasks - data.completedTasks;

  const pieChartData = {
    labels: ["Concluídas", "Atrasadas", "Em andamento"],
    datasets: [
      {
        data: [data.completedTasks, data.overdueTasks, remainingTasks],
        backgroundColor: [
          "#4bc0c0",
          "#ff6384",
          "#f6ad55",
        ],
        borderColor: "#fff",
        borderWidth: 1,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="dashboard-container">
      <SuperiorMenu />

      <div className="dashboard-main-card">
        <h2>Dashboard do Projeto: {projeto?.nome_projeto || `#${projectId}`}</h2>

        <div className="metrics-grid">
          <div className="metric-item">
            <h3>Tarefas Totais</h3>
            <p className="metric-value">{totalTasks}</p>
          </div>

          <div className="metric-item">
            <h3>Concluídas</h3>
            <p className="metric-value">{data.completedTasks || 0}</p>
          </div>

          <div className="metric-item warning">
            <h3>Atrasadas</h3>
            <p className="metric-value">{data.overdueTasks || 0}</p>
          </div>

          <div className="metric-item">
            <h3>Taxa de Conclusão</h3>
            <p className="metric-value">{completionPercentage}%</p>
          </div>

          <div className="metric-item">
            <h3>Story Points</h3>
            <p className="metric-value">
              {data.completedStoryPoints}/{data.totalStoryPoints} ({storyPointsPercentage}%)
            </p>
          </div>
        </div>

        <div className="dashboard-chart">
          <h3>Distribuição de Tarefas por Status</h3>
          <div className="chart-container">
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
        </div>

        <div className="budget-section">
          <h3>Orçamento do Projeto</h3>
          <div className="budget-metrics">
            <div className="budget-item">
              <h4>Total</h4>
              <p className="budget-value">R$ {orcamentoResumo.orcamento_total.toLocaleString('pt-BR') || '0'}</p>
            </div>
            <div className="budget-item">
              <h4>Utilizado</h4>
              <p className="budget-value used">R$ {orcamentoResumo.orcamento_utilizado.toLocaleString('pt-BR') || '0'}</p>
            </div>
            <div className="budget-item">
              <h4>Disponível</h4>
              <p className="budget-value remaining">R$ {orcamentoResumo.orcamento_disponivel.toLocaleString('pt-BR') || '0'}</p>
            </div>
            <div className="budget-item">
              <h4>Percentual Utilizado</h4>
              <p className="budget-value percentage">{orcamentoResumo.percentual_utilizado}%</p>
            </div>
          </div>
          <div className="budget-bar-container">
            <div className="budget-bar">
              <div 
                className="budget-progress" 
                style={{ width: `${orcamentoResumo.percentual_utilizado}%` }}
              ></div>
            </div>
            <div className="budget-labels">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {data.tasksByStatus && (
          <div className="status-distribution">
            <h3>Detalhes por Status</h3>
            <div className="status-bars">
              {data.tasksByStatus.map((status, index) => (
                <div key={index} className="status-bar">
                  <div className="status-label">
                    <span>{status.label}</span>
                    <span>{status.count}</span>
                  </div>
                  <div className="bar-container">
                    <div
                      className="bar"
                      style={{
                        width: `${(status.count / (totalTasks || 1)) * 100}%`,
                        backgroundColor:
                          status.label === "Concluída"
                            ? "#4bc0c0"
                            : status.label === "Atrasada"
                            ? "#ff6384"
                            : "#36a2eb",
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            {!loading && !error && data && (
              <PdfExportButton 
                projeto={projeto!} 
                dashboardData={data} 
                orcamentoResumo={orcamentoResumo} 
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;