import React from 'react';
import html2pdf from 'html2pdf.js';
import { OrcamentoResumo, DashboardData, Projeto } from '../pages/Dashboard.tsx'; 

interface PdfExportButtonProps {
  projeto: Projeto;
  dashboardData: DashboardData;
  orcamentoResumo: OrcamentoResumo;
}

const PdfExportButton: React.FC<PdfExportButtonProps> = ({ projeto, dashboardData, orcamentoResumo }) => {
  const generatePdf = () => {
    // Cria um elemento HTML temporário para o PDF
    const element = document.createElement('div');
    element.style.padding = '20px';
    
    // Template do PDF com estilos embutidos
    element.innerHTML = `
      <style>
        .pdf-container {
          font-family: 'Arial', sans-serif;
          color: #333;
          max-width: 100%;
        }
        .pdf-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #2c3e50;
          padding-bottom: 20px;
        }
        .pdf-title {
          color: #2c3e50;
          font-size: 24px;
          margin-bottom: 10px;
        }
        .pdf-subtitle {
          color: #7f8c8d;
          font-size: 16px;
        }
        .pdf-section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .pdf-section-title {
          background-color: #2c3e50;
          color: white;
          padding: 10px 15px;
          font-size: 18px;
          margin-bottom: 15px;
          border-radius: 4px;
        }
        .project-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        .project-info-item {
          margin-bottom: 10px;
        }
        .project-info-label {
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 5px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 25px;
        }
        .metric-item {
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          background-color: #f9f9f9;
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #2c3e50;
          margin: 10px 0;
        }
        .chart-container {
          width: 100%;
          max-width: 400px;
          margin: 0 auto 30px;
        }
        .budget-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 15px;
        }
        .budget-item {
          text-align: center;
          padding: 10px;
          border-radius: 6px;
          background-color: #f9f9f9;
        }
        .budget-value {
          font-weight: bold;
          font-size: 18px;
        }
        .budget-bar {
          height: 20px;
          background-color: #ecf0f1;
          border-radius: 10px;
          margin-bottom: 5px;
          overflow: hidden;
        }
        .budget-progress {
          height: 100%;
          background-color: #3498db;
        }
        .status-bar {
          margin-bottom: 15px;
        }
        .status-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        .bar-container {
          height: 10px;
          background-color: #ecf0f1;
          border-radius: 5px;
          overflow: hidden;
        }
        .bar {
          height: 100%;
        }
        .page-break {
          page-break-after: always;
        }
        @media print {
          body {
            padding: 20px;
          }
        }
      </style>

      <div class="pdf-container">
        <!-- Cabeçalho -->
        <div class="pdf-header">
          <h1 class="pdf-title">Relatório do Projeto: ${projeto.nome_projeto}</h1>
          <p class="pdf-subtitle">Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <!-- Informações do Projeto -->
        <div class="pdf-section">
          <h2 class="pdf-section-title">Informações do Projeto</h2>
          <div class="project-info-grid">
            <div class="project-info-item">
              <div class="project-info-label">Empresa</div>
              <div>${projeto.nome_empresa || 'Não informado'}</div>
            </div>
            <div class="project-info-item">
              <div class="project-info-label">Área de Atuação</div>
              <div>${projeto.nome_area || 'Não informado'}</div>
            </div>
            <div class="project-info-item">
              <div class="project-info-label">Período</div>
              <div>${projeto.data_inicio_formatada || projeto.data_inicio_proj} a ${projeto.data_fim_formatada || projeto.data_fim_proj}</div>
            </div>
            <div class="project-info-item">
              <div class="project-info-label">Descrição</div>
              <div>${projeto.descricao_projeto || 'Não informada'}</div>
            </div>
          </div>
        </div>

        <!-- Métricas Principais -->
        <div class="pdf-section">
          <h2 class="pdf-section-title">Métricas do Projeto</h2>
          <div class="metrics-grid">
            <div class="metric-item">
              <h3>Tarefas Totais</h3>
              <p class="metric-value">${dashboardData.totalTasks || 0}</p>
            </div>
            <div class="metric-item">
              <h3>Concluídas</h3>
              <p class="metric-value">${dashboardData.completedTasks || 0}</p>
            </div>
            <div class="metric-item">
              <h3>Atrasadas</h3>
              <p class="metric-value">${dashboardData.overdueTasks || 0}</p>
            </div>
            <div class="metric-item">
              <h3>Taxa de Conclusão</h3>
              <p class="metric-value">${dashboardData.totalTasks > 0 ? Math.round((dashboardData.completedTasks / dashboardData.totalTasks) * 100) : 0}%</p>
            </div>
          </div>
        </div>

        <!-- Orçamento -->
        <div class="pdf-section">
          <h2 class="pdf-section-title">Orçamento</h2>
          <div class="budget-grid">
            <div class="budget-item">
              <h4>Total</h4>
              <p class="budget-value">R$ ${orcamentoResumo.orcamento_total.toLocaleString('pt-BR') || '0'}</p>
            </div>
            <div class="budget-item">
              <h4>Utilizado</h4>
              <p class="budget-value">R$ ${orcamentoResumo.orcamento_utilizado.toLocaleString('pt-BR') || '0'}</p>
            </div>
            <div class="budget-item">
              <h4>Disponível</h4>
              <p class="budget-value">R$ ${orcamentoResumo.orcamento_disponivel.toLocaleString('pt-BR') || '0'}</p>
            </div>
            <div class="budget-item">
              <h4>Percentual</h4>
              <p class="budget-value">${orcamentoResumo.percentual_utilizado}%</p>
            </div>
          </div>
          <div class="budget-bar-container">
            <div class="budget-bar">
              <div class="budget-progress" style="width: ${orcamentoResumo.percentual_utilizado}%"></div>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <!-- Status das Tarefas -->
        <div class="pdf-section">
          <h2 class="pdf-section-title">Detalhes por Status</h2>
          ${dashboardData.tasksByStatus?.map(status => `
            <div class="status-bar">
              <div class="status-label">
                <span>${status.label}</span>
                <span>${status.count}</span>
              </div>
              <div class="bar-container">
                <div class="bar" style="width: ${(status.count / (dashboardData.totalTasks || 1)) * 100}%; 
                  background-color: ${status.label === "Concluída" ? "#4bc0c0" : 
                                    status.label === "Atrasada" ? "#ff6384" : "#36a2eb"}">
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Configurações do PDF
    const opt = {
      margin: 10,
      filename: `relatorio_projeto_${projeto.nome_projeto}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        logging: true,
        useCORS: true,
        allowTaint: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Gerar PDF
    html2pdf().from(element).set(opt).save();
  };

  return (
    <div style={{ textAlign: 'center', margin: '30px 0' }}>
      <button 
        onClick={generatePdf}
        style={{
          backgroundColor: '#2c3e50',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: 'pointer',
          transition: 'background-color 0.3s',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1a252f'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2c3e50'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
          <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
        </svg>
        Exportar Relatório (PDF)
      </button>
    </div>
  );
};

export default PdfExportButton;