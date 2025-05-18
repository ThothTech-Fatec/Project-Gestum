import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import "../css/Dashboard.css";
import SuperiorMenu from "../components/MenuSuperior.tsx";
import axios from "axios";

Chart.register(...registerables);

interface DashboardData {
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
}

interface Projeto {
  id_projeto: number;
  nome_projeto: string;
}

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projeto = location.state?.projeto as Projeto | undefined;
  const projectId = projeto?.id_projeto;

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

        setData({
          ...response.data,
          tasksByStatus,
          participants: response.data.participants || [],
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
      fetchDashboardData();
    }
  }, [projectId, navigate]);

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

      const chartData = {
        labels: ["Tarefas"],
        datasets: [
          {
            label: "Restantes",
            data: [remainingTasks],
            backgroundColor: "#f6ad55", // laranja
          },
          {
            label: "Concluídas",
            data: [data.completedTasks],
            backgroundColor: "#4bc0c0", // azul claro
          },
          {
            label: "Atrasadas",
            data: [data.overdueTasks],
            backgroundColor: "#ff6384", // vermelho claro
          },
        ],
      };



      const chartOptions = {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context: any) => `${context.dataset.label}: ${context.raw}`,
          },
        },
        legend: {
          position: "top" as const,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Quantidade de Tarefas",
          },
          ticks: {
            stepSize: 1,
          },
        },
      },
    };


  return (
    <div className="dashboard-container">
      <SuperiorMenu />

      <div className="dashboard-main-card">
        <h2>Dashboard do Projeto #{projectId}</h2>

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
          <h3>Progresso Total por Status</h3>
          <Bar data={chartData} options={chartOptions} />
        </div>

        {data.tasksByStatus && (
          <div className="status-distribution">
            <h3>Distribuição por Status</h3>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
