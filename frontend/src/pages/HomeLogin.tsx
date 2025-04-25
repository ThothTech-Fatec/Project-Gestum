import React, { useState, useEffect, useCallback } from "react";
import "../css/HomeLogin.css";
import SuperiorMenu from "../components/MenuSuperior.tsx";
import ProgressBar from "../components/ProgressBar.tsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CadastroInstituicao from "../components/CadastroInstituicao.tsx";

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
  id_empresa?: number;
  nome_empresa?: string;
  cnpj?: string;
};

type AreaAtuacao = {
  id: number;
  nome: string;
};

type Instituicao = {
  id_empresa: number;
  nome_empresa: string;
  cnpj: string;
};

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

const Home = () => {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate] = useState(new Date().toISOString().split('T')[0]);
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>('');

  const [modalAberto, setModalAberto] = useState(false);
  const [modalAbertoProj, setModalAbertoProj] = useState(false);
  const [modalAtualizar, setModalAtualizar] = useState(false);
  
  const [nomeProjeto, setNomeProjeto] = useState("");
  const [descricaoProjeto, setDescricaoProjeto] = useState("");
  const [datafimProjeto, setDatafimProjeto] = useState("");
  const [projetoSelecionado, setProjetoSelecionado] = useState<Projeto | null>(null);

  const [areasAtuacao, setAreasAtuacao] = useState<AreaAtuacao[]>([]);
  const [novaArea, setNovaArea] = useState("");
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [showNewAreaInput, setShowNewAreaInput] = useState(false);
    
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [selectedInstituicao, setSelectedInstituicao] = useState<number | null>(null);
  const [modalInstituicaoAberto, setModalInstituicaoAberto] = useState(false);

  const [filtroArea, setFiltroArea] = useState<number | null>(null);
  const [filtroInstituicao, setFiltroInstituicao] = useState<number | null>(null);
  const [filtroResponsavel, setFiltroResponsavel] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && !(e.target as Element).closest('.filter-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const usuarioPodeEditar = (projeto: Projeto) => {
    return projeto.user_role === 'responsavel';
  };

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

  const carregarAreasAtuacao = useCallback(async () => {
    try {
      const response = await api.get('/areas');
      const areasFormatadas = response.data.map((area: any) => ({
        id: Number(area.id),
        nome: area.nome
      }));
      setAreasAtuacao(areasFormatadas);
    } catch (error) {
      console.error('Erro ao carregar áreas de atuação:', error);
    }
  }, []);

  const carregarInstituicoes = useCallback(async () => {
    try {
      const response = await api.get('/getinstituicoes');
      setInstituicoes(response.data.map((inst: any) => ({
        ...inst,
        cnpj: inst.cnpj || ''
      })));
    } catch (error) {
      console.error('Erro ao carregar instituições:', error);
    }
  }, []);

  const carregarProjetos = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const response = await api.get('/user_projects', { 
        params: { userId }
      });
  
      const projetosFormatados = response.data.map((projeto: any) => {
        // Encontra a área correspondente pelo ID ou pelo nome
        const areaCorrespondente = areasAtuacao.find(a => 
          a.id === Number(projeto.area_atuacao_id) || 
          a.nome.toLowerCase() === projeto.nome_area?.toLowerCase()
        );
  
        return {
          ...projeto,
          area_atuacao_id: areaCorrespondente ? areaCorrespondente.id : null,
          nome_area: areaCorrespondente ? areaCorrespondente.nome : projeto.nome_area || 'Não definida',
          data_inicio_formatada: formatarDataParaExibicao(projeto.data_inicio_proj),
          data_fim_formatada: formatarDataParaExibicao(projeto.data_fim_proj),
          // Garante que o user_role está definido
          user_role: projeto.user_role || 'equipe'
        };
      });
  
      setProjetos(projetosFormatados);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    } finally {
      setLoading(false);
    }
  }, [formatarDataParaExibicao, areasAtuacao]);


  const filtrarProjetos = useCallback(() => {
    return projetos.filter(projeto => {
      // Filtro por área (convertendo ambos para número para garantir)
      if (filtroArea !== null && Number(projeto.area_atuacao_id) !== Number(filtroArea)) {
        return false;
      }
  
      // Filtro por instituição
      if (filtroInstituicao !== null && projeto.id_empresa !== filtroInstituicao) {
        return false;
      }
  
      // Filtro por responsável
      if (filtroResponsavel) {
        if (filtroResponsavel === 'meus' && projeto.user_role !== 'responsavel') return false;
        if (filtroResponsavel === 'equipe' && projeto.user_role === 'responsavel') return false;
      }
  
      return true;
    });
  }, [projetos, filtroArea, filtroInstituicao, filtroResponsavel]);

  const projetosFiltrados = filtrarProjetos();

useEffect(() => {
  const loadUserId = () => {
    const id = localStorage.getItem('UserID');
    const loggedIn = localStorage.getItem('Logado') === 'true';
    
    setIsLoggedIn(loggedIn);
    
    if (!id || !loggedIn) {
      navigate('/');
      return null;
    }
    
    setUserId(id);
    return id;
  };

  const id = loadUserId();
  if (id) {
    const loadData = async () => {
      try {
        // Carrega áreas de atuação primeiro
        const areasResponse = await api.get('/areas');
        const areasFormatadas = areasResponse.data.map((area: any) => ({
          id: Number(area.id),
          nome: area.nome
        }));
        setAreasAtuacao(areasFormatadas);

        // Depois carrega instituições
        const instituicoesResponse = await api.get('/getinstituicoes');
        setInstituicoes(instituicoesResponse.data.map((inst: any) => ({
          ...inst,
          cnpj: inst.cnpj || ''
        })));

        // Finalmente carrega projetos com as áreas já disponíveis
        const projetosResponse = await api.get('/user_projects', { 
          params: { userId: id }
        });

        const projetosFormatados = projetosResponse.data.map((projeto: any) => {
          // Encontra a área correspondente
          const areaCorrespondente = areasFormatadas.find(a => 
            a.id === Number(projeto.area_atuacao_id) || 
            a.nome.toLowerCase() === projeto.nome_area?.toLowerCase()
          );

          return {
            ...projeto,
            area_atuacao_id: areaCorrespondente ? areaCorrespondente.id : null,
            nome_area: areaCorrespondente ? areaCorrespondente.nome : projeto.nome_area || 'Não definida',
            data_inicio_formatada: formatarDataParaExibicao(projeto.data_inicio_proj),
            data_fim_formatada: formatarDataParaExibicao(projeto.data_fim_proj),
            user_role: projeto.user_role || 'equipe'
          };
        });

        setProjetos(projetosFormatados);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }
}, [navigate, formatarDataParaExibicao]);

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
    setSelectedInstituicao(projeto.id_empresa || null);
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
        id_empresa: selectedInstituicao,
        userId
      });

      const instituicaoAtual = instituicoes.find(i => i.id_empresa === selectedInstituicao);
  
      const projetosAtualizados = projetos.map(proj => 
        proj.id_projeto === projetoSelecionado.id_projeto ? {
          ...projetoSelecionado,
          data_inicio_formatada: formatarDataParaExibicao(projetoSelecionado.data_inicio_proj),
          data_fim_formatada: formatarDataParaExibicao(projetoSelecionado.data_fim_proj),
          nome_area: areasAtuacao.find(a => a.id === projetoSelecionado.area_atuacao_id)?.nome || 
                    projetoSelecionado.nome_area,
          nome_empresa: instituicaoAtual?.nome_empresa || projetoSelecionado.nome_empresa,
          cnpj: instituicaoAtual?.cnpj || projetoSelecionado.cnpj || ''
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

  const salvarNovaInstituicao = async (instituicao: Instituicao) => {
    try {
      // Adiciona a nova instituição à lista
      setInstituicoes(prev => [...prev, instituicao]);
      // Define a nova instituição como selecionada
      setSelectedInstituicao(instituicao.id_empresa);
      // Fecha o modal
      setModalInstituicaoAberto(false);
      return Promise.resolve();
    } catch (error) {
      console.error('Erro ao salvar nova instituição:', error);
      return Promise.reject(error);
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
    setSelectedArea(null);
    setSelectedInstituicao(null);
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
    setSelectedArea(null);
    setSelectedInstituicao(null);
  };

  const criarNovaArea = async () => {
    if (novaArea.trim() === "") {
      alert("Digite um nome para a nova área!");
      return;
    }

    try {
      const response = await api.post('/criar_area', { nome: novaArea });
      setAreasAtuacao(prev => [...prev, response.data]);
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
        id_empresa: selectedInstituicao
      });
  
      setProjetos(prev => [...prev, response.data]);
      fecharModal();
      window.location.reload();
      alert('Projeto criado com sucesso!');
  
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      alert('Erro ao criar projeto. Verifique os dados e tente novamente.');
      
      if (error.response?.data?.message?.includes('usuário não encontrado')) {
        localStorage.clear();
        navigate('/');
      }
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
      
      const instituicaoCompleta = instituicoes.find(i => i.id_empresa === response.data.id_empresa);
      
      setProjetoSelecionado({
        ...response.data,
        responsavel: response.data.user_role === 'responsavel' ? 'Você' : 'Equipe',
        data_inicio_proj: response.data.data_inicio_proj,
        data_fim_proj: response.data.data_fim_proj,
        data_inicio_formatada: formatarDataParaExibicao(response.data.data_inicio_proj), 
        data_fim_formatada: formatarDataParaExibicao(response.data.data_fim_proj), 
        nome_empresa: response.data.nome_empresa || 'Não definida',
        cnpj: instituicaoCompleta?.cnpj || response.data.cnpj || ''
      });
      
      setModalAbertoProj(true);
    } catch (error) {
      console.error('Detalhes do erro:', error);
      alert('Erro ao carregar detalhes do projeto.');
    }
  };

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

  const renderInstituicaoSelect = () => (
    <div className="instituicao-select-container">
      <label className="input-label">Instituição</label>
      <select
        value={selectedInstituicao || ""}
        onChange={(e) => {
          const id = Number(e.target.value);
          setSelectedInstituicao(id);
        }}
        className="select-instituicao"
      >
        <option value="">Selecione uma instituição</option>
        {instituicoes.map((inst) => (
          <option key={inst.id_empresa} value={inst.id_empresa}>
            {inst.nome_empresa}
          </option>
        ))}
      </select>

      {selectedInstituicao && (
        <div className="instituicao-selecionada-card">
          <div className="instituicao-selecionada-header">
            <span className="instituicao-selecionada-icon">🏛️</span>
            <div className="instituicao-selecionada-info">
              <div className="instituicao-selecionada-nome">
                {instituicoes.find(i => i.id_empresa === selectedInstituicao)?.nome_empresa}
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        className="botao-nova-instituicao"
        onClick={() => setModalInstituicaoAberto(true)}
      >
        <span>+</span> Cadastrar nova instituição
      </button>
    </div>
  );

  const renderProjetoCard = (projeto: Projeto) => (
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
        <div className="instituicao-projeto">
          <div className="instituicao-info">
            <strong>Instituição:</strong> {projeto.nome_empresa || 'Não definida'}
            {projeto.cnpj && (
              <div className="cnpj-container">
                <span className="cnpj-value">
                  CNPJ: {formatCNPJ(projeto.cnpj)}
                </span>
              </div>
            )}
          </div>
        </div>
        <p>{projeto.responsavel}</p>
        <p><strong>Data de Inicio: </strong>{projeto.data_inicio_formatada}</p>
        <p><strong>Data de Entrega: </strong>{projeto.data_fim_formatada}</p>
        <ProgressBar progress={projeto.progresso_projeto || 0} />
      </div>
    </div>
  );

  const renderDetalhesProjeto = () => (
    <div className="modal-proj">
      <button className="botao-fechar-proj" onClick={fecharModal}>
        &times;
      </button>
      <h2>Detalhes do {projetoSelecionado?.nome_projeto}</h2>  
      <p><strong>Área:</strong> {projetoSelecionado?.nome_area}</p>
      
      <div className="instituicao-detalhes">
      <h3>Instituição Responsável</h3>
      <p><strong>Nome:</strong> {projetoSelecionado?.nome_empresa}</p>
      {projetoSelecionado?.cnpj && (
        <div className="cnpj-container">
          <span className="cnpj-label">CNPJ:</span>
          <p className="cnpj-value">
            {formatCNPJ(projetoSelecionado.cnpj)}
          </p>
        </div>
      )}
      </div>
      
      <p><strong>Descrição:</strong> {projetoSelecionado?.descricao_projeto}</p>
      <p><strong>Responsável:</strong> {projetoSelecionado?.responsavel}</p>
      <p><strong>Data de Início:</strong> {projetoSelecionado?.data_inicio_formatada}</p>
      <p><strong>Data de Entrega:</strong> {projetoSelecionado?.data_fim_formatada}</p>
      
      <div className="progress-container">
        <ProgressBar progress={projetoSelecionado?.progresso_projeto || 0} />
      </div>
      
      {projetoSelecionado && usuarioPodeEditar(projetoSelecionado) ? (
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
              <div className="filter-container">
                <button 
                  className="custom-dropdown-toggle"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  Filtrar Projetos
                  {(filtroArea || filtroInstituicao || filtroResponsavel) && (
                    <span className="badge-filtro">
                      {[filtroArea, filtroInstituicao, filtroResponsavel].filter(Boolean).length}
                    </span>
                  )}
                </button>
                
                <div className={`dropdown-menu-container ${isOpen ? 'show' : ''}`}>
                  <div 
                    className="dropdown-menu-item dropdown-submenu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Área de Atuação</span>
                    <div className="submenu">
                      <div 
                        className="submenu-item"
                        onClick={() => setFiltroArea(null)}
                      >
                        Todas as áreas
                      </div>
                      {areasAtuacao.map(area => (
                        <div
                          key={area.id}
                          className={`submenu-item ${filtroArea === area.id ? 'active' : ''}`}
                          onClick={() => setFiltroArea(area.id)}
                        >
                          {area.nome}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div 
                    className="dropdown-menu-item dropdown-submenu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Instituição</span>
                    <div className="submenu">
                      <div 
                        className="submenu-item"
                        onClick={() => setFiltroInstituicao(null)}
                      >
                        Todas as instituições
                      </div>
                      {instituicoes.map(inst => (
                        <div
                          key={inst.id_empresa}
                          className={`submenu-item ${filtroInstituicao === inst.id_empresa ? 'active' : ''}`}
                          onClick={() => setFiltroInstituicao(inst.id_empresa)}
                        >
                          {inst.nome_empresa}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div 
                    className="dropdown-menu-item dropdown-submenu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Responsável</span>
                    <div className="submenu">
                      <div 
                        className="submenu-item"
                        onClick={() => setFiltroResponsavel(null)}
                      >
                        Todos
                      </div>
                      <div
                        className={`submenu-item ${filtroResponsavel === 'meus' ? 'active' : ''}`}
                        onClick={() => setFiltroResponsavel('meus')}
                      >
                        Meus projetos
                      </div>
                      <div
                        className={`submenu-item ${filtroResponsavel === 'equipe' ? 'active' : ''}`}
                        onClick={() => setFiltroResponsavel('equipe')}
                      >
                        Projetos da equipe
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <button className="botao-criar" onClick={criarNovoProjeto}>
                Criar Novo Projeto
              </button>
            </div>
            
            {loading ? (
                <div className="loading-message">Carregando projetos...</div>
              ) : (
                <div className="lista-projetos">
                  {projetosFiltrados.length > 0 ? (
                    projetosFiltrados.map(renderProjetoCard)
                  ) : (
                    <div className="no-projects-message">
                      {/* Mensagem condicional */}
                      {!filtroArea && !filtroInstituicao && !filtroResponsavel ? (
                        <>
                          <h3>Você não está participando de nenhum projeto no momento</h3>
                          <p>Clique no botão "Criar Novo Projeto" para começar</p>
                        </>
                      ) : (
                        <>
                          <h3>Nenhum projeto encontrado com os filtros aplicados</h3>
                          <button 
                            className="botao-limpar-filtros" 
                            onClick={() => {
                              setFiltroArea(null);
                              setFiltroInstituicao(null);
                              setFiltroResponsavel(null);
                            }}
                          >
                            Limpar filtros
                          </button>
                        </>
                      )}
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
              &times;
            </button>
            <h2>Detalhes do {projetoSelecionado?.nome_projeto}</h2>  
            <p><strong>Área:</strong> {projetoSelecionado?.nome_area}</p>
            
            <div className="instituicao-detalhes">
              <h3>Instituição Responsável</h3>
              <p><strong>Nome:</strong> {projetoSelecionado?.nome_empresa}</p>
              {projetoSelecionado?.cnpj && (
                <div className="cnpj-container">
                  <span className="cnpj-label">CNPJ:</span>
                  <p className="cnpj-value">
                    {formatCNPJ(projetoSelecionado.cnpj)}
                  </p>
                </div>
              )}
            </div>
            
            <p><strong>Descrição:</strong> {projetoSelecionado?.descricao_projeto}</p>
            <p><strong>Responsável:</strong> {projetoSelecionado?.responsavel}</p>
            <p><strong>Data de Início:</strong> {projetoSelecionado?.data_inicio_formatada}</p>
            <p><strong>Data de Entrega:</strong> {projetoSelecionado?.data_fim_formatada}</p>
            
            <div className="progress-container">
              <ProgressBar progress={projetoSelecionado?.progresso_projeto || 0} />
            </div>
            
            {projetoSelecionado && usuarioPodeEditar(projetoSelecionado) ? (
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
              <textarea
                className="input-field"
                value={projetoSelecionado.descricao_projeto}
                onChange={(e) => setProjetoSelecionado({ 
                  ...projetoSelecionado, 
                  descricao_projeto: e.target.value 
                })}
                placeholder="Descreva o projeto"
                rows={3}
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
  
            {renderInstituicaoSelect()}
            
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
              <textarea
                value={descricaoProjeto}  
                onChange={(e) => setDescricaoProjeto(e.target.value)}
                className="input-field"
                placeholder="Descreva o projeto"
                rows={3}
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
  
            {renderInstituicaoSelect()}
            
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
            
            <CadastroInstituicao 
              open={modalInstituicaoAberto}
              onClose={() => setModalInstituicaoAberto(false)}
              onSave={salvarNovaInstituicao}
            />
            
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