import React, { useState, useEffect, useCallback } from "react";
import "../css/HomeLogin.css";  
import SuperiorMenu from "../components/MenuSuperior.tsx";
import ProgressBar from "../components/ProgressBar.tsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";

type Projeto = {
  id_projeto: number
  nome_projeto: string
  descricao_projeto: string
  responsavel: string
  data_inicio_proj: string
  data_fim_proj: string
  data_inicio_formatada?: string
  data_fim_formatada?: string
  progresso_projeto?: number
  user_role?: string
};

const api = axios.create({
  baseURL: 'http://localhost:5000',
});

const Home = () => {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate] = useState(new Date().toISOString().split('T')[0]);
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>('');

  // Estados para os modais
  const [modalAberto, setModalAberto] = useState(false);
  const [modalAbertoProj, setModalAbertoProj] = useState(false);
  const [modalAtualizar, setModalAtualizar] = useState(false);
  
  // Estados para o formulário
  const [nomeProjeto, setNomeProjeto] = useState("");
  const [descricaoProjeto, setDescricaoProjeto] = useState("");
  const [datafimProjeto, setDatafimProjeto] = useState("");
  const [projetoSelecionado, setProjetoSelecionado] = useState<Projeto | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false); // Novo estado para controle de login

  // Formata para exibição (dd/mm/yyyy)
  const formatarDataParaExibicao = useCallback((dataString: string) => {
    if (!dataString) return '';
    
    // Se já estiver no formato DD/MM/YYYY, retorna diretamente
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataString)) {
      return dataString;
    }
    
    try {
      // Tenta converter de YYYY-MM-DD para DD/MM/YYYY
      if (/^\d{4}-\d{2}-\d{2}/.test(dataString)) {
        const [year, month, day] = dataString.split('-');
        return `${day}/${month}/${year}`;
      }
      
      // Tenta converter de outros formatos
      const date = new Date(dataString);
      if (isNaN(date.getTime())) return dataString; // Retorna o original se inválido
      
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dataString; // Retorna o original em caso de erro
    }
  }, []);

  // Formata para input date (yyyy-mm-dd)
  const formatarDataParaInput = useCallback((dataString: string) => {
    if (!dataString) return '';
    
    // Se já estiver no formato YYYY-MM-DD, retorna diretamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataString)) {
      return dataString;
    }
    
    try {
      // Tenta converter de DD/MM/YYYY para YYYY-MM-DD
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataString)) {
        const [day, month, year] = dataString.split('/');
        return `${year}-${month}-${day}`;
      }
      
      // Tenta converter de outros formatos
      const date = new Date(dataString);
      if (isNaN(date.getTime())) return '';
      
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Erro ao formatar data para input:', error);
      return '';
    }
  }, []);

  // Função para carregar projetos
  const carregarProjetos = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const response = await api.get('/user_projects', {
        params: { userId }
      });
      
      const projetosFormatados = response.data.map((projeto: any) => ({
        ...projeto,
        responsavel: projeto.user_role === 'responsavel' ? 'Você' : 'Equipe',
        // Mantemos o formato original vindo do backend
        data_inicio_proj: projeto.data_inicio_proj,
        data_fim_proj: projeto.data_fim_proj,
        // Adicionamos campos formatados para exibição
        data_inicio_formatada: formatarDataParaExibicao(projeto.data_inicio_proj),
        data_fim_formatada: formatarDataParaExibicao(projeto.data_fim_proj)
      }));
  
      console.log('Projetos recebidos:', response.data);
      
      setProjetos(projetosFormatados);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      alert('Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  }, [formatarDataParaExibicao]);

  // Carrega userId e verifica login ao montar o componente
  useEffect(() => {
    const loadUserId = () => {
      const id = localStorage.getItem('UserID');
      const loggedIn = localStorage.getItem('Logado') === 'true';
      
      setIsLoggedIn(loggedIn);
      
      if (!id || !loggedIn) {
        return null;
      }
      
      setUserId(id);
      return id;
    };

    const id = loadUserId();
    if (id) {
      carregarProjetos(id);
    }
  }, [navigate, carregarProjetos]);

  const navegarParaProjeto = (projeto: Projeto) => {
    navigate(`/projeto/${projeto.id_projeto}`, {state: { projeto }});
  };

  const abrirModalAtualizar = (projeto: Projeto) => {
    setProjetoSelecionado({
      ...projeto,
      data_inicio_proj: formatarDataParaInput(projeto.data_inicio_proj),
      data_fim_proj: formatarDataParaInput(projeto.data_fim_proj)
    });
    setModalAtualizar(true);
  };

  const atualizarProjeto = async () => {
    if (!projetoSelecionado) return;

    try {
      await api.put(`/update_project/${projetoSelecionado.id_projeto}`, {
        nome_projeto: projetoSelecionado.nome_projeto,
        descricao_projeto: projetoSelecionado.descricao_projeto,
        data_fim_proj: projetoSelecionado.data_fim_proj,
        userId
      });

      const projetosAtualizados = projetos.map(proj => 
        proj.id_projeto === projetoSelecionado.id_projeto ? {
          ...projetoSelecionado,
          data_inicio_proj: formatarDataParaExibicao(projetoSelecionado.data_inicio_proj),
          data_fim_proj: formatarDataParaExibicao(projetoSelecionado.data_fim_proj)
        } : proj
      );

      setProjetos(projetosAtualizados);
      setModalAtualizar(false);
      alert('Projeto atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      alert('Erro ao atualizar projeto');
    }
  };

  const excluirProjeto = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este projeto?')) return;
    
    try {
      await api.delete(`/delete_project/${id}`, {
        data: { userId }
      });
      
      const projetosAtualizados = projetos.filter((projeto) => projeto.id_projeto !== id);
      setProjetos(projetosAtualizados);
      fecharModal();
      alert('Projeto excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      alert('Erro ao excluir projeto');
    }
  };

  const criarNovoProjeto = () => {
    setModalAberto(true); 
  };

  const fecharModal = () => {
    setModalAberto(false);
    setModalAbertoProj(false);
    setModalAtualizar(false);
    setNomeProjeto("");
    setDescricaoProjeto("");
    setDatafimProjeto("");
    setProjetoSelecionado(null);
  };

  const salvarProjeto = async () => {
    if (nomeProjeto.trim() === "" || descricaoProjeto.trim() === "" || datafimProjeto.trim() === "") {
      alert("Preencha todos os campos!");
      return;
    }
  
    try {
      const userId = localStorage.getItem('UserID');
      if (!userId) {
        alert('Usuário não identificado. Faça login novamente.');
        navigate('/');
        return;
      }
  
      const response = await api.post('/create_projects', {
        nome_projeto: nomeProjeto,
        descricao_projeto: descricaoProjeto,
        data_fim_proj: datafimProjeto,
        userId: userId
      });
  
      const novoProjeto = {
        id_projeto: response.data.projectId,
        nome_projeto: nomeProjeto,
        descricao_projeto: descricaoProjeto,
        responsavel: 'Você',
        data_inicio_proj: formatarDataParaExibicao(new Date().toISOString()),
        data_fim_proj: formatarDataParaExibicao(datafimProjeto),
        user_role: 'responsavel',
        progresso_projeto: 0
      };
  
      setProjetos([...projetos, novoProjeto]);
      fecharModal();
      alert('Projeto criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      alert('Erro ao criar projeto. Verifique os dados e tente novamente.');
    }
  };

  const abrirModalDetalhes = async (projeto: Projeto) => {
    try {
      const userId = localStorage.getItem('UserID');
      if (!userId) {
        alert('Usuário não identificado. Faça login novamente.');
        navigate('/');
        return;
      }
  
      const response = await api.get(`/get_projectdetails`, {
        params: {
          id_projeto: projeto.id_projeto,
          userId: userId
        }
      });
      
      setProjetoSelecionado({
        ...response.data,
        responsavel: response.data.user_role === 'responsavel' ? 'Você' : 'Equipe',
        data_inicio_proj: formatarDataParaExibicao(response.data.data_inicio_proj),
        data_fim_proj: formatarDataParaExibicao(response.data.data_fim_proj)
      });
      
      setModalAbertoProj(true);
    } catch (error) {
      console.error('Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      alert('Erro ao carregar detalhes do projeto. Verifique o console para mais informações.');
    }
  };

  // Conteúdo para usuários não logados
  const NotLoggedContent = () => (
    <div className="not-logged-container">
      <div className="not-logged-message">
        <h2 className="title">Gerencie seus projetos de forma simples</h2>
        <p className="subtitle">
          Faça login clicando no ícone de perfil no canto superior direito 
          para começar a criar e gerenciar seus projetos.
        </p>
        <div className="project-examples">
          <div className="example-project">
            <h3>Desenvolvimento Web</h3>
            <p>Um projeto exemplo de desenvolvimento web</p>
            <div className="progress-bar-container">
              <ProgressBar progress={45} />
            </div>
          </div>
          <div className="example-project">
            <h3>Projeto Exemplo 2</h3>
            <p>Outro projeto exemplo mostrando as possibilidades</p>
            <div className="progress-bar-container">
              <ProgressBar progress={80} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container">
      <SuperiorMenu />
      <main>
        {!isLoggedIn ? (
          <NotLoggedContent />
        ) : (
          <>
            <div className="container-button">
              <button className="botao-criar" onClick={criarNovoProjeto}>
                Criar Novo Projeto
              </button>
            </div>

            {loading ? (
              <div className="loading-message">Carregando projetos...</div>
            ) : (
              <div className="lista-projetos">
                {projetos.length > 0 ? (
                  projetos.map((projeto) => (
                    <div 
                      key={projeto.id_projeto} 
                      className="projeto" 
                      onClick={() => navegarParaProjeto(projeto)}
                    >
                      <div className="projeto-header">
                        <button 
                          className="botao-modal" 
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirModalDetalhes(projeto);
                          }}
                        >
                          ...
                        </button>
                        <h2>{projeto.nome_projeto}</h2>
                        <p>{projeto.descricao_projeto}</p>
                        <p>{projeto.responsavel}</p>
                        <p><strong>Data de Inicio: </strong>{projeto.data_inicio_formatada}</p>
                        <p><strong>Data de Entrega: </strong>{projeto.data_fim_formatada}</p>
                        <ProgressBar progress={projeto.progresso_projeto || 0} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-projects-message">
                    <h3>Você ainda não tem projetos</h3>
                    <p>Clique no botão acima para criar seu primeiro projeto</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {modalAbertoProj && projetoSelecionado && (
        <div className="modal-overlay">
          <div className="modal-proj">
            <button className="botao-fechar-proj" onClick={fecharModal}>
              x
            </button>
            <h2>Detalhes do {projetoSelecionado.nome_projeto}</h2>  
            <p><strong>Descrição:</strong> {projetoSelecionado.descricao_projeto}</p>
            <p><strong>Responsável:</strong> {projetoSelecionado.responsavel}</p>
            <p><strong>Data de Inicio:</strong> {projetoSelecionado.data_inicio_proj}</p>
            <p><strong>Data de Entrega:</strong> {projetoSelecionado.data_fim_proj}</p>
            <div style={{ margin: '20px 0' }}>
              <ProgressBar progress={projetoSelecionado.progresso_projeto || 0} />
            </div>
            <div className="botoes">
              <button className="excluir-proj-home" onClick={() => excluirProjeto(projetoSelecionado.id_projeto)}>
                Excluir
              </button>
              <button className="atualizar-proj-home" onClick={() => abrirModalAtualizar(projetoSelecionado)}>
                Atualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAtualizar && projetoSelecionado && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Atualizar Projeto</h2>
            <input
              className="input-projeto"
              type="text"
              value={projetoSelecionado.nome_projeto}
              onChange={(e) => setProjetoSelecionado({ 
                ...projetoSelecionado, 
                nome_projeto: e.target.value 
              })}
            />
            <input
              className="input-projeto"
              value={projetoSelecionado.descricao_projeto}
              onChange={(e) => setProjetoSelecionado({ 
                ...projetoSelecionado, 
                descricao_projeto: e.target.value 
              })}
            />
            <div className="container-data">
              <div className="campo-data">
                <label>Data de Inicio</label>   
                <input
                  type="text" 
                  value={projetoSelecionado.data_inicio_proj}
                  className="input-dataini"
                  disabled
                />
              </div>
              <div className="campo-data">
                <label>Data de Encerramento</label>   
                <input
                  type="date" 
                  value={projetoSelecionado.data_fim_proj}
                  onChange={(e) => setProjetoSelecionado({
                    ...projetoSelecionado,
                    data_fim_proj: e.target.value
                  })}
                  className="input-datafim"
                  min={currentDate} 
                />
              </div>
            </div>
            <button className="atualizar-proj-home" onClick={atualizarProjeto}>
              Salvar
            </button>
            <button className="excluir-proj-home" onClick={() => setModalAtualizar(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Criar Novo Projeto</h2>
            <input
              type="text"
              placeholder="Nome do Projeto"
              value={nomeProjeto}
              onChange={(e) => setNomeProjeto(e.target.value)}
              className="input-projeto"
            />
            <input
              placeholder="Descrição do Projeto"
              value={descricaoProjeto}  
              onChange={(e) => setDescricaoProjeto(e.target.value)}
              className="input-projeto"
            />
            <div className="container-data">
              <div className="campo-data">
                <label>Data de Inicio</label>   
                <input
                  type="text" 
                  value={formatarDataParaExibicao(currentDate)}
                  className="input-dataini"
                  disabled
                />
              </div>
              <div className="campo-data">
                <label>Data de Entrega</label>   
                <input
                  type="date" 
                  value={datafimProjeto}
                  onChange={(e) => setDatafimProjeto(e.target.value)}
                  className="input-datafim"
                  min={currentDate} 
                />
              </div>
            </div>
            <div className="botoes">
              <button className="botao-salvar" onClick={salvarProjeto}>
                Salvar
              </button>
              <button className="botao-fechar" onClick={fecharModal}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;