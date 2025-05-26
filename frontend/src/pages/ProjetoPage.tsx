import React, { useState, useEffect } from "react";
import SuperiorMenu from "../components/MenuSuperior.tsx";
import "../css/ProjetoPage.css";  
import { useParams, useLocation } from "react-router-dom";
import CalendarioProjeto from "../components/Calendario.tsx";
import ProgressBar from "../components/ProgressBar.tsx"; 
import { listarNotificacoes, Notificacao } from "../components/services/notificationService.ts";
import axios from "axios";

interface Instituicao {
  id_empresa: number;
  nome_empresa: string;
  cnpj: string;
}

interface Projeto {
  id_projeto: number;
  nome_projeto: string;
  descricao_projeto: string;
  responsavel: string;
  data_inicio_proj: string;
  data_fim_proj: string;
  id_empresa?: number;
  nome_empresa?: string;
  cnpj?: string;
  instituicoes_parceiras?: Instituicao[];
  instituicoes_financiadoras?: Instituicao[];
}

const api = axios.create({
  baseURL: 'http://localhost:5000',
});

const formatCNPJ = (cnpj: string) => {
  if (!cnpj) return '';
  const nums = cnpj.replace(/\D/g, '');
  if (nums.length === 14) {
    return nums.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5"
    );
  }
  return cnpj;
};

const ProjetoPage = () => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProjeto, setLoadingProjeto] = useState(true);
  const [projetoDetalhado, setProjetoDetalhado] = useState<Projeto | null>(null);
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

    const carregarDetalhesProjeto = async () => {
      try {
        setLoadingProjeto(true);
        const userId = localStorage.getItem('UserID');
        if (!userId) return;

        const response = await api.get(`/get_projectdetails`, {
          params: {
            id_projeto: projetoId,
            userId: userId
          }
        });

        setProjetoDetalhado({
          ...response.data,
          responsavel: response.data.user_role === 'responsavel' ? 'Você' : 'Equipe',
          data_inicio_proj: response.data.data_inicio_proj,
          data_fim_proj: response.data.data_fim_proj,
          instituicoes_parceiras: response.data.instituicoes_parceiras || [],
          instituicoes_financiadoras: response.data.instituicoes_financiadoras || []
        });
      } catch (error) {
        console.error('Erro ao carregar detalhes do projeto:', error);
      } finally {
        setLoadingProjeto(false);
      }
    };

    carregarNotificacoes();
    carregarDetalhesProjeto();

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
        {/* Informações Básicas do Projeto */}
        <div className="project-info">
          <h1 className="project-name">{projeto.nome_projeto}</h1>
          <p className="project-description">{projeto.descricao_projeto}</p>
          
          <div className="project-meta">
            <div className="meta-item">
              <span className="meta-label">Início: </span>
              <span className="meta-value">
                {projeto.data_inicio_proj}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Término: </span>
              <span className="meta-value">
                {projeto.data_fim_proj}
              </span>
            </div>
          </div>
        </div>

        {/* Notificações */}
        <div className="notifications">
          <div className="notifications-header">
            <h2>Notificações</h2>
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

        {/* Instituições Relacionadas */}
        <div className="instituicoes-card">
          <div className="instituicoes-header">
            <h2 className="instituicoes-title">Instituições Relacionadas</h2>
          </div>
          
          <div className="instituicoes-grid">
            {/* Instituição Principal */}
            {projetoDetalhado?.id_empresa && (
              <div className="instituicao-card">
                <div className="instituicao-header">
                  <div className="instituicao-tipo">
                    <span className="instituicao-tag" style={{backgroundColor: 'var(--primary-color)'}}>Principal</span>
                  </div>
                </div>
                <div className="instituicao-body">
                  <h3 className="instituicao-nome">{projetoDetalhado.nome_empresa}</h3>
                  {projetoDetalhado.cnpj && (
                    <p className="instituicao-cnpj">{formatCNPJ(projetoDetalhado.cnpj)}</p>
                  )}
                </div>
              </div>
            )}

            {/* Instituições Parceiras */}
            {projetoDetalhado?.instituicoes_parceiras?.map(inst => (
              <div key={`parceira-${inst.id_empresa}`} className="instituicao-card">
                <div className="instituicao-header">
                  <div className="instituicao-tipo">
                    <span className="instituicao-tag" style={{backgroundColor: 'var(--success-dark)'}}>Parceira</span>
                  </div>
                </div>
                <div className="instituicao-body">
                  <h3 className="instituicao-nome">{inst.nome_empresa}</h3>
                  {inst.cnpj && <p className="instituicao-cnpj">{formatCNPJ(inst.cnpj)}</p>}
                </div>
              </div>
            ))}

            {/* Instituições Financiadoras */}
            {projetoDetalhado?.instituicoes_financiadoras?.map(inst => (
              <div key={`financiadora-${inst.id_empresa}`} className="instituicao-card">
                <div className="instituicao-header">
                  <div className="instituicao-tipo">
                    <span className="instituicao-tag" style={{backgroundColor: 'var(--warning-color)'}}>Financiadora</span>
                  </div>
                </div>
                <div className="instituicao-body">
                  <h3 className="instituicao-nome">{inst.nome_empresa}</h3>
                  {inst.cnpj && <p className="instituicao-cnpj">{formatCNPJ(inst.cnpj)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjetoPage;