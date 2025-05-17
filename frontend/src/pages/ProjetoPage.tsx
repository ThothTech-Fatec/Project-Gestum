import React, { useState, useEffect } from "react";
import SuperiorMenu from "../components/MenuSuperior.tsx";
import "../css/ProjetoPage.css";  
import { useParams, useLocation } from "react-router-dom";
import CalendarioProjeto from "../components/Calendario.tsx";
import ProgressBar from "../components/ProgressBar.tsx"; 
import { listarNotificacoes, Notificacao } from "../components/services/notificationService.ts";

interface Projeto {
  id_projeto: number;
  nome_projeto: string;
  descricao_projeto: string;
  responsavel: string;
  data_inicio_proj: string;
  data_fim_proj: string;
}

const ProjetoPage = () => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const projeto = location.state?.projeto as Projeto | undefined;
  const projetoId = id ? parseInt(id) : null;

  useEffect(() => {
    if (!projetoId) return;
    
    const carregarNotificacoes = async () => {
      try {
        setLoading(true);
        const data = await listarNotificacoes(projetoId);
        setNotificacoes(data);
      } catch (error) {
        console.error("Erro ao carregar notificações:", error);
        setNotificacoes([]);
      } finally {
        setLoading(false);
      }
    };

    carregarNotificacoes();

    // Atualiza notificações a cada 30 segundos
    const interval = setInterval(carregarNotificacoes, 30000);
    return () => clearInterval(interval);
  }, [projetoId]);


  if (!projeto) {
    return (
      <div className="container">
        <SuperiorMenu />
        <div className="project-not-found">
          <p>Projeto não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <SuperiorMenu />
      
      <div className="project-dashboard">
        {/* Informações do Projeto */}
        <div className="project-info">
          <h1>Informações do Projeto</h1>
          <h2>{projeto.nome_projeto}</h2>
          <p>{projeto.descricao_projeto}</p>
          <div className="project-meta">
            <p><strong>Responsável:</strong> {projeto.responsavel}</p>
            <p><strong>Início:</strong> {new Date(projeto.data_inicio_proj).toLocaleDateString()}</p>
            {projeto.data_fim_proj && (
              <p><strong>Prazo:</strong> {new Date(projeto.data_fim_proj).toLocaleDateString()}</p>
            )}
          </div>
        </div>

        {/* Notificações */}
        <div className="notifications">
          <div className="notifications-header">
            <h1>Notificações</h1>
          </div>
          
          <div className="notifications-list">
            {loading ? (
              <div className="loading-notifications">Carregando notificações...</div>
            ) : notificacoes.length === 0 ? (
              <p className="no-notifications">Nenhuma notificação recente</p>
            ) : (
              [...notificacoes]
                .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
                .map(notificacao => (
                  <div 
                    key={notificacao.id} 
                    className={`notification-item ${notificacao.lida ? 'read' : 'unread'}`}
                  >
                    <div className="notification-content">
                      <p className="notification-message">{notificacao.mensagem}</p>
                      <small className="notification-date">
                        {new Date(notificacao.criado_em).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </small>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Calendário */}
        <div className="calendar-container">
          <CalendarioProjeto 
            projetoId={projeto.id_projeto} 
            dataInicio={projeto.data_inicio_proj} 
            dataFim={projeto.data_fim_proj} 
          />
        </div>

        {/* Barra de Progresso */}
        <div className="progress-container">
          <h2>Andamento do Projeto</h2>
          <ProgressBar projetoId={projeto.id_projeto} />
        </div>
      </div>
    </div>
  );
};

export default ProjetoPage;