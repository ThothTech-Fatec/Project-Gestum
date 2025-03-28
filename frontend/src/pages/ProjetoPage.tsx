import React, { useState } from "react";
import SuperiorMenu from "../components/MenuSuperior.tsx";
import "../css/ProjetoPage.css";  
import { useLocation } from "react-router-dom";
import Calendario from "../components/Calendario.tsx";
import ProgessBar from "../components/ProgressBar.tsx";
import { Grid, Box } from "@mui/material";

const ProjetoPage = () => {
  const [atividades, setAtividades] = useState([]);
  const location = useLocation();
  const projeto = location.state?.projeto;

  if (!projeto) {
    return <p>Projeto não encontrado</p>;
  }

  const exemplosNotificacoes = [
    { id: 1, mensagem: "Nova tarefa adicionada: Revisar documentação", data: "28/03/2025" },
    { id: 2, mensagem: "Lembrete: Reunião de planejamento às 14h", data: "29/03/2025" },
    { id: 3, mensagem: "Atualização: Status do projeto alterado para 'Em andamento'", data: "30/03/2025" }
  ];

  return (
    <div className="container">
      <SuperiorMenu />
      
      <div className="project-dashboard">
        {/* Informações do Projeto */}
        <div className="project-info">
          <h1>Informações do Projeto</h1>
          <h2>{projeto.nome_projeto}</h2>
          <p>{projeto.descricao_projeto}</p>
          <p>
            <strong>Responsável:</strong> {projeto.responsavel}
          </p>
        </div>

        {/* Notificações */}
        <div className="notifications">
          <h1>Notificações</h1>
          <div className="notifications-list">
            {exemplosNotificacoes.map((notificacao) => (
              <div key={notificacao.id} className="notification-item">
                <p>{notificacao.mensagem}</p>
                <small>{notificacao.data}</small>
              </div>
            ))}
          </div>
        </div>

        {/* Calendário */}
        <div className="calendar-container">
          <Calendario 
            dataInicio={projeto.data_inicio_proj} 
            dataFim={projeto.data_fim_proj} 
          />
        </div>

        {/* Barra de Progresso */}
        <div className="progress-container">
          <h2>Andamento do Projeto</h2>
          <div className="progress-percentage">0%</div>
          <ProgessBar progress={0} />
        </div>
      </div>
    </div>
  );
};

export default ProjetoPage;
