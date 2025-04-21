import React, { useState, useEffect, useCallback } from "react";
import "../css/HomeLogin.css";  
import SuperiorMenu from "../components/MenuSuperior.tsx";
import ProgressBar from "../components/ProgressBar.tsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";

type Projeto = {
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
};

type AreaAtuacao = {
  id: number;
  nome: string;
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

  // Estados para áreas de atuação
  const [areasAtuacao, setAreasAtuacao] = useState<AreaAtuacao[]>([]);
  const [novaArea, setNovaArea] = useState("");
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [showNewAreaInput, setShowNewAreaInput] = useState(false);
    
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Função para verificar permissões
  const usuarioPodeEditar = (projeto: Projeto) => {
    return projeto.user_role === 'responsavel';
  };

  // Formata para exibição (dd/mm/yyyy)
  const formatarDataParaExibicao = useCallback((dataString: string) => {
    if (!dataString) return '';
    
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataString)) {
      return dataString;
    }
    
    try {
      if (/^\d{4}-\d{2}-\d{2}/.test(dataString)) {
        const [year, month, day] = dataString.split('-');
        return `${day}/${month}/${year}`;
      }
      
      const date = new Date(dataString);
      if (isNaN(date.getTime())) return dataString;
      
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dataString;
    }
  }, []);

  // Formata para input date (yyyy-mm-dd)
  const formatarDataParaInput = useCallback((dataString: string) => {
    if (!dataString) return '';
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataString)) {
      return dataString;
    }
    
    try {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataString)) {
        const [day, month, year] = dataString.split('/');
        return `${year}-${month}-${day}`;
      }
      
      const date = new Date(dataString);
      if (isNaN(date.getTime())) return '';
      
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Erro ao formatar data para input:', error);
      return '';
    }
  }, []);

  // Carrega áreas de atuação
  const carregarAreasAtuacao = useCallback(async () => {
    try {
      const response = await api.get('/areas');
      setAreasAtuacao(response.data);
    } catch (error) {
      console.error('Erro ao carregar áreas de atuação:', error);
    }
  }, []);

  // Função para carregar projetos
  const carregarProjetos = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const response = await api.get('/user_projects', { 
        params: { userId }
      });
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Formato de dados inválido');
      }
  
      const projetosFormatados = response.data.map((projeto: any) => ({
        ...projeto,
        responsavel: projeto.user_role === 'responsavel' ? 'Você' : 'Equipe',
        data_inicio_formatada: formatarDataParaExibicao(projeto.data_inicio_proj),
        data_fim_formatada: formatarDataParaExibicao(projeto.data_fim_proj),
        progresso_projeto: projeto.progresso_projeto || 0,
        nome_area: projeto.nome_area || 'Não definida'
      }));
  
      setProjetos(projetosFormatados);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      alert('Erro ao carregar projetos. Verifique o console para detalhes.');
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
      carregarAreasAtuacao();
    }
  }, [navigate, carregarProjetos, carregarAreasAtuacao]);

  const navegarParaProjeto = (projeto: Projeto) => {
    localStorage.setItem('Id_Project', projeto.id_projeto.toString());
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
  
    if (!projetoSelecionado.nome_projeto || !projetoSelecionado.descricao_projeto || 
        !projetoSelecionado.data_fim_proj || !projetoSelecionado.area_atuacao_id) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }
  
    try {
      await api.put(`/update_project/${projetoSelecionado.id_projeto}`, {
        nome_projeto: projetoSelecionado.nome_projeto,
        descricao_projeto: projetoSelecionado.descricao_projeto,
        data_fim_proj: projetoSelecionado.data_fim_proj,
        area_atuacao_id: projetoSelecionado.area_atuacao_id,
        userId
      });
  
      const projetosAtualizados = projetos.map(proj => 
        proj.id_projeto === projetoSelecionado.id_projeto ? {
          ...projetoSelecionado,
          data_inicio_formatada: formatarDataParaExibicao(projetoSelecionado.data_inicio_proj),
          data_fim_formatada: formatarDataParaExibicao(projetoSelecionado.data_fim_proj),
          nome_area: areasAtuacao.find(a => a.id === projetoSelecionado.area_atuacao_id)?.nome || 
                    projetoSelecionado.nome_area
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
      
      setProjetos(projetos.filter((projeto) => projeto.id_projeto !== id));
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
    setShowNewAreaInput(false);
    setNovaArea("");
  };

  // Função para criar nova área
  const criarNovaArea = async () => {
    if (novaArea.trim() === "") {
      alert("Digite um nome para a nova área!");
      return;
    }

    try {
      const response = await api.post('/criar_area', { nome: novaArea });
      setAreasAtuacao([...areasAtuacao, response.data]);
      setSelectedArea(response.data.id);
      setNovaArea("");
      setShowNewAreaInput(false);
      alert("Área criada com sucesso!");
    } catch (error) {
      console.error('Erro ao criar área:', error);
      alert("Erro ao criar nova área");
    }
  };

  const salvarProjeto = async () => {
    if (nomeProjeto.trim() === "" || descricaoProjeto.trim() === "" || datafimProjeto.trim() === "") {
      alert("Preencha todos os campos!");
      return;
    }

    if (!selectedArea) {
      alert("Selecione uma área de atuação!");
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
        userId: userId,
        area_atuacao_id: selectedArea,
      });

      const areaSelecionada = areasAtuacao.find(area => area.id === selectedArea);

      const novoProjeto = {
        id_projeto: response.data.projectId,
        nome_projeto: nomeProjeto,
        descricao_projeto: descricaoProjeto,
        responsavel: 'Você',
        data_inicio_proj: formatarDataParaExibicao(new Date().toISOString()),
        data_fim_proj: formatarDataParaExibicao(datafimProjeto),
        user_role: 'responsavel',
        progresso_projeto: 0,
        nome_area: areaSelecionada?.nome || 'Não definida',
        area_atuacao_id: selectedArea
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
      console.error('Detalhes do erro:', error);
      alert('Erro ao carregar detalhes do projeto.');
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
      </div>
    </div>
  );

  return (
    <div className="container">
      <SuperiorMenu />
      <main style={{ marginTop: '100px' }}>
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
                        <p className="area-projeto">
                          {projeto.nome_area || 'Área não definida'}
                        </p>
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

      {/* Modal de Detalhes do Projeto */}
      {modalAbertoProj && projetoSelecionado && (
        <div className="modal-overlay">
          <div className="modal-proj">
            <button className="botao-fechar-proj" onClick={fecharModal}>
              &times;
            </button>
            <h2>Detalhes do {projetoSelecionado.nome_projeto}</h2>  
            <p><strong>Área:</strong> {projetoSelecionado.nome_area}</p>
            <p><strong>Descrição:</strong> {projetoSelecionado.descricao_projeto}</p>
            <p><strong>Responsável:</strong> {projetoSelecionado.responsavel}</p>
            <p><strong>Data de Início:</strong> {projetoSelecionado.data_inicio_formatada}</p>
            <p><strong>Data de Entrega:</strong> {projetoSelecionado.data_fim_formatada}</p>
            
            <div className="progress-container">
              <ProgressBar progress={projetoSelecionado.progresso_projeto || 0} />
            </div>
            
            {usuarioPodeEditar(projetoSelecionado) ? (
              <div className="botoes">
                <button className="excluir-proj-home" onClick={() => excluirProjeto(projetoSelecionado.id_projeto)}>
                  Excluir
                </button>
                <button className="atualizar-proj-home" onClick={() => abrirModalAtualizar(projetoSelecionado)}>
                  Atualizar
                </button>
              </div>
            ) : (
              <p className="info-permissao">Você tem permissão apenas para visualizar este projeto.</p>
            )}
          </div>
        </div>
      )}

      {/* Modal de Atualização de Projeto */}
      {modalAtualizar && projetoSelecionado && usuarioPodeEditar(projetoSelecionado) && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="botao-fechar-proj" onClick={() => setModalAtualizar(false)}>
              &times;
            </button>
            <h2>Atualizar Projeto</h2>
            
            <div className="input-container">
              <label className="input-label">Nome do Projeto</label>
              <input
                type="text"
                className="input-field"
                value={projetoSelecionado.nome_projeto}
                onChange={(e) => setProjetoSelecionado({ 
                  ...projetoSelecionado, 
                  nome_projeto: e.target.value 
                })}
                placeholder="Digite o nome do projeto"
              />
            </div>
            
            <div className="input-container">
              <label className="input-label">Descrição</label>
              <input
                className="input-field"
                value={projetoSelecionado.descricao_projeto}
                onChange={(e) => setProjetoSelecionado({ 
                  ...projetoSelecionado, 
                  descricao_projeto: e.target.value 
                })}
                placeholder="Descreva o projeto"
              />
            </div>

            <div className="input-container">
              <label className="input-label">Área de Atuação</label>
              {!showNewAreaInput ? (
                <div className="area-selection">
                  <select
                    value={projetoSelecionado.area_atuacao_id || ""}
                    onChange={(e) => setProjetoSelecionado({
                      ...projetoSelecionado,
                      area_atuacao_id: Number(e.target.value) || undefined
                    })}
                    className="input-field"
                  >
                    <option value="">Selecione uma área</option>
                    {areasAtuacao.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.nome}
                      </option>
                    ))}
                  </select>
                  <button 
                    type="button"
                    className="botao-nova-area"
                    onClick={() => setShowNewAreaInput(true)}
                  >
                    + Nova Área
                  </button>
                </div>
              ) : (
                <div className="new-area-container">
                  <input
                    type="text"
                    value={novaArea}
                    onChange={(e) => setNovaArea(e.target.value)}
                    className="input-field"
                    placeholder="Digite o nome da nova área"
                  />
                  <div className="area-buttons">
                    <button
                      type="button"
                      className="botao-cancelar-area"
                      onClick={() => setShowNewAreaInput(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="botao-salvar-area"
                      onClick={criarNovaArea}
                    >
                      Salvar Área
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="container-data">
              <div className="input-container">
                <label className="input-label">Data de Início</label>
                <input
                  type="text" 
                  value={projetoSelecionado.data_inicio_proj}
                  className="input-field"
                  disabled
                />
              </div>
              <div className="input-container">
                <label className="input-label">Data de Encerramento</label>
                <input
                  type="date" 
                  value={projetoSelecionado.data_fim_proj}
                  onChange={(e) => setProjetoSelecionado({
                    ...projetoSelecionado,
                    data_fim_proj: e.target.value
                  })}
                  className="input-field"
                  min={currentDate}
                />
              </div>
            </div>
            
            <div className="botoes">
              <button 
                className="botao-fechar" 
                onClick={() => setModalAtualizar(false)}
              >
                Cancelar
              </button>
              <button 
                className="botao-salvar" 
                onClick={atualizarProjeto}
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação de Projeto */}
      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="botao-fechar-proj" onClick={fecharModal}>
              &times;
            </button>
            <h2>Criar Novo Projeto</h2>
            
            <div className="input-container">
              <label className="input-label">Nome do Projeto</label>
              <input
                type="text"
                value={nomeProjeto}
                onChange={(e) => setNomeProjeto(e.target.value)}
                className="input-field"
                placeholder="Digite o nome do projeto"
              />
            </div>
            
            <div className="input-container">
              <label className="input-label">Descrição</label>
              <input
                value={descricaoProjeto}  
                onChange={(e) => setDescricaoProjeto(e.target.value)}
                className="input-field"
                placeholder="Descreva o projeto"
              />
            </div>
            
            <div className="input-container">
              <label className="input-label">Área de Atuação</label>
              {!showNewAreaInput ? (
                <div className="area-selection">
                  <select
                    value={selectedArea || ""}
                    onChange={(e) => setSelectedArea(Number(e.target.value))}
                    className="input-field"
                  >
                    <option value="">Selecione uma área</option>
                    {areasAtuacao.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.nome}
                      </option>
                    ))}
                  </select>
                  <button 
                    type="button"
                    className="botao-nova-area"
                    onClick={() => setShowNewAreaInput(true)}
                  >
                    + Nova Área
                  </button>
                </div>
              ) : (
                <div className="new-area-container">
                  <input
                    type="text"
                    value={novaArea}
                    onChange={(e) => setNovaArea(e.target.value)}
                    className="input-field"
                    placeholder="Digite o nome da nova área"
                  />
                  <div className="area-buttons">
                    <button
                      type="button"
                      className="botao-cancelar-area"
                      onClick={() => setShowNewAreaInput(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="botao-salvar-area"
                      onClick={criarNovaArea}
                    >
                      Salvar Área
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="container-data">
              <div className="input-container">
                <label className="input-label">Data de Início</label>
                <input
                  type="text" 
                  value={formatarDataParaExibicao(currentDate)}
                  className="input-field"
                  disabled
                />
              </div>
              <div className="input-container">
                <label className="input-label">Data de Entrega</label>
                <input
                  type="date" 
                  value={datafimProjeto}
                  onChange={(e) => setDatafimProjeto(e.target.value)}
                  className="input-field"
                  min={currentDate} 
                />
              </div>
            </div>
            
            <div className="botoes">
              <button className="botao-fechar" onClick={fecharModal}>
                Cancelar
              </button>
              <button className="botao-salvar" onClick={salvarProjeto}>
                Criar Projeto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;