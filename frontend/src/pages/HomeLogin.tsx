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
  status?: string;
  instituicoes_parceiras?: Instituicao[];
  instituicoes_financiadoras?: Instituicao[];
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

type StatusProjeto = 'todos' | 'nao_iniciado' | 'em_andamento' | 'concluido';

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

const getStatusProjeto = (progresso: number = 0): Exclude<StatusProjeto, 'todos'> => {
  if (progresso <= 0) return 'nao_iniciado';
  if (progresso >= 100) return 'concluido';
  return 'em_andamento';
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
  const [selectedParceiras, setSelectedParceiras] = useState<number[]>([]);
  const [selectedFinanciadoras, setSelectedFinanciadoras] = useState<number[]>([]);
  const [modalInstituicaoAberto, setModalInstituicaoAberto] = useState(false);

  const [filtroArea, setFiltroArea] = useState<number | null>(null);
  const [filtroInstituicao, setFiltroInstituicao] = useState<number | null>(null);
  const [filtroResponsavel, setFiltroResponsavel] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<StatusProjeto>('todos');
  const [isOpen, setIsOpen] = useState(false);
  const [valorOrcamento, setValorOrcamento] = useState<string>("");

  const [isParceirasExpanded, setIsParceirasExpanded] = useState(false);
  const [isFinanciadorasExpanded, setIsFinanciadorasExpanded] = useState(false);

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
        const areaCorrespondente = areasAtuacao.find(a => 
          a.id === Number(projeto.area_atuacao_id) || 
          a.nome.toLowerCase() === projeto.nome_area?.toLowerCase()
        );

        // Calcula o status baseado no progresso
        const progresso = projeto.progresso_projeto || 0;
        const status = getStatusProjeto(progresso);
  
        return {
          ...projeto,
          area_atuacao_id: areaCorrespondente ? areaCorrespondente.id : null,
          nome_area: areaCorrespondente ? areaCorrespondente.nome : projeto.nome_area || 'Não definida',
          data_inicio_formatada: formatarDataParaExibicao(projeto.data_inicio_proj),
          data_fim_formatada: formatarDataParaExibicao(projeto.data_fim_proj),
          user_role: projeto.user_role || 'equipe',
          progresso_projeto: progresso,
          status: status, // Adiciona o status calculado
          instituicoes_parceiras: projeto.instituicoes_parceiras || [],
          instituicoes_financiadoras: projeto.instituicoes_financiadoras || []
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
      // Filtro por status
      if (filtroStatus !== 'todos') {
        const progresso = projeto.progresso_projeto || 0;
        const statusProjeto = getStatusProjeto(progresso);
        
        if (statusProjeto !== filtroStatus) {
          return false;
        }
      }

      // Outros filtros...
      if (filtroArea !== null && Number(projeto.area_atuacao_id) !== Number(filtroArea)) {
        return false;
      }

      if (filtroInstituicao !== null && projeto.id_empresa !== filtroInstituicao) {
        return false;
      }

      if (filtroResponsavel) {
        if (filtroResponsavel === 'meus' && projeto.user_role !== 'responsavel') return false;
        if (filtroResponsavel === 'equipe' && projeto.user_role === 'responsavel') return false;
      }
      
      return true;
    });
  }, [projetos, filtroStatus, filtroArea, filtroInstituicao, filtroResponsavel]);

  const projetosFiltrados = filtrarProjetos();
  console.log('Projetos filtrados:', projetosFiltrados.map(p => ({
    nome: p.nome_projeto,
    progresso: p.progresso_projeto,
    status: getStatusProjeto(p.progresso_projeto || 0)
  })));

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
          const areasResponse = await api.get('/areas');
          const areasFormatadas = areasResponse.data.map((area: any) => ({
            id: Number(area.id),
            nome: area.nome
          }));
          setAreasAtuacao(areasFormatadas);

          const instituicoesResponse = await api.get('/getinstituicoes');
          setInstituicoes(instituicoesResponse.data.map((inst: any) => ({
            ...inst,
            cnpj: inst.cnpj || ''
          })));

          const projetosResponse = await api.get('/user_projects', { 
            params: { userId: id }
          });

          const projetosFormatados = projetosResponse.data.map((projeto: any) => {
            const areaCorrespondente = areasFormatadas.find(a => 
              a.id === Number(projeto.area_atuacao_id) || 
              a.nome.toLowerCase() === projeto.nome_area?.toLowerCase()
            );

            // Calcula o status baseado no progresso
            const progresso = projeto.progresso_projeto || 0;
            const status = getStatusProjeto(progresso);

            return {
              ...projeto,
              area_atuacao_id: areaCorrespondente ? areaCorrespondente.id : null,
              nome_area: areaCorrespondente ? areaCorrespondente.nome : projeto.nome_area || 'Não definida',
              data_inicio_formatada: formatarDataParaExibicao(projeto.data_inicio_proj),
              data_fim_formatada: formatarDataParaExibicao(projeto.data_fim_proj),
              user_role: projeto.user_role || 'equipe',
              progresso_projeto: progresso,
              status: status, // Adiciona o status calculado
              instituicoes_parceiras: projeto.instituicoes_parceiras || [],
              instituicoes_financiadoras: projeto.instituicoes_financiadoras || []
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
    setSelectedParceiras(projeto.instituicoes_parceiras?.map(i => i.id_empresa) || []);
    setSelectedFinanciadoras(projeto.instituicoes_financiadoras?.map(i => i.id_empresa) || []);
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
        userId,
        instituicoes_parceiras: selectedParceiras,
        instituicoes_financiadoras: selectedFinanciadoras,
        valor: valorOrcamento ? parseFloat(valorOrcamento.replace(',', '.')) : undefined
      });

      const instituicaoAtual = instituicoes.find(i => i.id_empresa === selectedInstituicao);
      const parceirasAtuais = instituicoes.filter(i => selectedParceiras.includes(i.id_empresa));
      const financiadorasAtuais = instituicoes.filter(i => selectedFinanciadoras.includes(i.id_empresa));
  
      const projetosAtualizados = projetos.map(proj => 
        proj.id_projeto === projetoSelecionado.id_projeto ? {
          ...projetoSelecionado,
          data_inicio_formatada: formatarDataParaExibicao(projetoSelecionado.data_inicio_proj),
          data_fim_formatada: formatarDataParaExibicao(projetoSelecionado.data_fim_proj),
          nome_area: areasAtuacao.find(a => a.id === projetoSelecionado.area_atuacao_id)?.nome || 
                    projetoSelecionado.nome_area,
          nome_empresa: instituicaoAtual?.nome_empresa || projetoSelecionado.nome_empresa,
          cnpj: instituicaoAtual?.cnpj || projetoSelecionado.cnpj || '',
          progresso_projeto: projetoSelecionado.progresso_projeto || 0,
          instituicoes_parceiras: parceirasAtuais,
          instituicoes_financiadoras: financiadorasAtuais
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
      setInstituicoes(prev => [...prev, instituicao]);
      setSelectedInstituicao(instituicao.id_empresa);
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
    setSelectedParceiras([]);
    setSelectedFinanciadoras([]);
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
    setSelectedParceiras([]);
    setSelectedFinanciadoras([]);
    setValorOrcamento("");
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

  const toggleInstituicaoParceira = (id: number) => {
    setSelectedParceiras(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        if (prev.length >= 5) {
          alert('Limite máximo de 5 instituições parceiras atingido');
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const toggleInstituicaoFinanciadora = (id: number) => {
    setSelectedFinanciadoras(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        if (prev.length >= 3) {
          alert('Limite máximo de 3 instituições financiadoras atingido');
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const salvarProjeto = async () => {
    if (nomeProjeto.trim() === "" || descricaoProjeto.trim() === "" || datafimProjeto.trim() === "" || valorOrcamento.trim() === "") {
      alert("Preencha todos os campos!");
      return;
    }
  
    if (!selectedArea) {
      alert("Selecione uma área de atuação!");
      return;
    }

    const valorNumerico = parseFloat(valorOrcamento.replace(',', '.'));
    if (isNaN(valorNumerico)) {
      alert("Valor do orçamento inválido!");
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
        id_empresa: selectedInstituicao,
        instituicoes_parceiras: selectedParceiras,
        instituicoes_financiadoras: selectedFinanciadoras,
        valor: valorNumerico
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
        cnpj: instituicaoCompleta?.cnpj || response.data.cnpj || '',
        progresso_projeto: response.data.progresso_projeto || 0,
        instituicoes_parceiras: response.data.instituicoes_parceiras || [],
        instituicoes_financiadoras: response.data.instituicoes_financiadoras || []
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
      <label className="input-label">Instituição Principal</label>
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

      <button
        type="button"
        className="botao-nova-instituicao"
        onClick={() => setModalInstituicaoAberto(true)}
      >
        <span>+</span> Cadastrar nova instituição
      </button>
    </div>
  );

  const renderInstituicoesParceiras = () => (
    <div className="instituicoes-container">
      <div className="instituicoes-header">
        <label className="input-label">Instituições Parceiras (máx. 5)</label>
        <button 
          className="botao-expandir"
          onClick={() => setIsParceirasExpanded(!isParceirasExpanded)}
        >
          {isParceirasExpanded ? '▲' : '▼'}
        </button>
      </div>
      {isParceirasExpanded && (
        <div className="instituicoes-list">
          {instituicoes.map(inst => (
            <div key={`parceira-${inst.id_empresa}`} className="instituicao-checkbox">
              <input
                type="checkbox"
                id={`parceira-${inst.id_empresa}`}
                checked={selectedParceiras.includes(inst.id_empresa)}
                onChange={() => toggleInstituicaoParceira(inst.id_empresa)}
                disabled={!selectedParceiras.includes(inst.id_empresa) && selectedParceiras.length >= 5}
              />
              <label htmlFor={`parceira-${inst.id_empresa}`}>
                {inst.nome_empresa} ({formatCNPJ(inst.cnpj)})
              </label>
            </div>
          ))}
        </div>
      )}
      {selectedParceiras.length > 0 && (
        <div className="instituicoes-selecionadas">
          <strong>Selecionadas:</strong> {selectedParceiras.map(id => {
            const inst = instituicoes.find(i => i.id_empresa === id);
            return inst ? `${inst.nome_empresa.substring(0, 15)}...` : '';
          }).join(', ')}
        </div>
      )}
    </div>
  );

  const renderInstituicoesFinanciadoras = () => (
    <div className="instituicoes-container">
      <div className="instituicoes-header">
        <label className="input-label">Instituições Financiadoras (máx. 3)</label>
        <button 
          className="botao-expandir"
          onClick={() => setIsFinanciadorasExpanded(!isFinanciadorasExpanded)}
        >
          {isFinanciadorasExpanded ? '▲' : '▼'}
        </button>
      </div>
      {isFinanciadorasExpanded && (
        <div className="instituicoes-list">
          {instituicoes.map(inst => (
            <div key={`financiadora-${inst.id_empresa}`} className="instituicao-checkbox">
              <input
                type="checkbox"
                id={`financiadora-${inst.id_empresa}`}
                checked={selectedFinanciadoras.includes(inst.id_empresa)}
                onChange={() => toggleInstituicaoFinanciadora(inst.id_empresa)}
                disabled={!selectedFinanciadoras.includes(inst.id_empresa) && selectedFinanciadoras.length >= 3}
              />
              <label htmlFor={`financiadora-${inst.id_empresa}`}>
                {inst.nome_empresa} ({formatCNPJ(inst.cnpj)})
              </label>
            </div>
          ))}
        </div>
      )}
      {selectedFinanciadoras.length > 0 && (
        <div className="instituicoes-selecionadas">
          <strong>Selecionadas:</strong> {selectedFinanciadoras.map(id => {
            const inst = instituicoes.find(i => i.id_empresa === id);
            return inst ? `${inst.nome_empresa.substring(0, 15)}...` : '';
          }).join(', ')}
        </div>
      )}
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
        <ProgressBar 
          projetoId={projeto.id_projeto} 
          showStatus={true}
        />
      </div>
    </div>
  );

  const renderDetalhesProjeto = () => {
    if (!projetoSelecionado) {
      return (
        <div className="modal-proj">
          <button className="botao-fechar-proj" onClick={fecharModal}>
            &times;
          </button>
          <div className="no-project-selected">
            <h2>Nenhum projeto selecionado</h2>
            <p>Selecione um projeto para visualizar os detalhes</p>
          </div>
        </div>
      );
    }

    return (
      <div className="modal-proj">
        <button className="botao-fechar-proj" onClick={fecharModal}>
          &times;
        </button>
        <h2>Detalhes do {projetoSelecionado.nome_projeto}</h2>  
        <p><strong>Área:</strong> {projetoSelecionado.nome_area || 'Não definida'}</p>
        
        <div className="instituicao-detalhes">
          <h3>Instituição Responsável</h3>
          <p><strong>Nome:</strong> {projetoSelecionado.nome_empresa || 'Não definida'}</p>
          {projetoSelecionado.cnpj && (
            <div className="cnpj-container">
              <span className="cnpj-label">CNPJ:</span>
              <p className="cnpj-value">
                {formatCNPJ(projetoSelecionado.cnpj)}
              </p>
            </div>
          )}
        </div>

        {projetoSelecionado.instituicoes_parceiras && projetoSelecionado.instituicoes_parceiras.length > 0 && (
          <div className="instituicoes-lista">
            <h3>Instituições Parceiras</h3>
            <ul>
              {projetoSelecionado.instituicoes_parceiras.map(inst => (
                <li key={`detalhe-parceira-${inst.id_empresa}`}>
                  {inst.nome_empresa} ({formatCNPJ(inst.cnpj)})
                </li>
              ))}
            </ul>
          </div>
        )}

        {projetoSelecionado.instituicoes_financiadoras && projetoSelecionado.instituicoes_financiadoras.length > 0 && (
          <div className="instituicoes-lista">
            <h3>Instituições Financiadoras</h3>
            <ul>
              {projetoSelecionado.instituicoes_financiadoras.map(inst => (
                <li key={`detalhe-financiadora-${inst.id_empresa}`}>
                  {inst.nome_empresa} ({formatCNPJ(inst.cnpj)})
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <p><strong>Descrição:</strong> {projetoSelecionado.descricao_projeto}</p>
        <p><strong>Responsável:</strong> {projetoSelecionado.responsavel}</p>
        <p><strong>Data de Início:</strong> {projetoSelecionado.data_inicio_formatada}</p>
        <p><strong>Data de Entrega:</strong> {projetoSelecionado.data_fim_formatada}</p>
        
        <div className="progress-container">
          <ProgressBar 
            projetoId={projetoSelecionado.id_projeto} 
            showStatus={true}
          />
        </div>
        
        {usuarioPodeEditar(projetoSelecionado) ? (
          <div className="botoes">
            <button 
              className="excluir-proj-home" 
              onClick={() => excluirProjeto(projetoSelecionado.id_projeto)}
            >
              Excluir
            </button>
            <button 
              className="atualizar-proj-home" 
              onClick={() => abrirModalAtualizar(projetoSelecionado)}
            >
              Atualizar
            </button>
          </div>
        ) : (
          <p className="info-permissao">Você tem permissão apenas para visualizar este projeto.</p>
        )}
      </div>
    );
  };

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
                  {(filtroStatus !== 'todos' || filtroArea || filtroInstituicao || filtroResponsavel) && (
                    <span className="badge-filtro">
                      {[
                        filtroStatus !== 'todos' ? 1 : 0,
                        filtroArea ? 1 : 0,
                        filtroInstituicao ? 1 : 0,
                        filtroResponsavel ? 1 : 0
                      ].reduce((a, b) => a + b, 0)}
                    </span>
                  )}
                </button>
                
                <div className={`dropdown-menu-container ${isOpen ? 'show' : ''}`}>
                  <div 
                    className="dropdown-menu-item dropdown-submenu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Status</span>
                    <div className="submenu">
                      {['todos', 'nao_iniciado', 'em_andamento', 'concluido'].map((status) => (
                        <div
                          key={status}
                          className={`submenu-item ${filtroStatus === status ? 'active' : ''}`}
                          onClick={() => setFiltroStatus(status as StatusProjeto)}
                        >
                          {status === 'todos' && 'Todos os status'}
                          {status === 'nao_iniciado' && 'Não iniciados'}
                          {status === 'em_andamento' && 'Em andamento'}
                          {status === 'concluido' && 'Concluídos'}
                        </div>
                      ))}
                    </div>
                  </div>
                  
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
                      {filtroStatus === 'todos' && !filtroArea && !filtroInstituicao && !filtroResponsavel ? (
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
                              setFiltroStatus('todos');
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
          {renderDetalhesProjeto()}
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
              <label className="input-label">Orçamento (R$)</label>
              <input
                type="text"
                value={valorOrcamento}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9,.]/g, '');
                  setValorOrcamento(value);
                }}
                className="input-field"
                placeholder="Digite o valor do orçamento"
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
            {renderInstituicoesParceiras()}
            {renderInstituicoesFinanciadoras()}
            
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
          <div className="modal modal-horizontal">
            <button className="botao-fechar-proj" onClick={fecharModal}>
              &times;
            </button>
            <h2>Criar Novo Projeto</h2>
            
            <div className="modal-columns">
              <div className="modal-left">
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
                    rows={5}
                  />
                </div>

                <div className="input-container">
                  <label className="input-label">Orçamento (R$)</label>
                  <input
                    type="text"
                    value={valorOrcamento}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9,.]/g, '');
                      setValorOrcamento(value);
                    }}
                    className="input-field"
                    placeholder="Digite o valor do orçamento"
                  />
                </div>
              </div>
              
              <div className="modal-right">
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
                
                {renderInstituicoesParceiras()}
                {renderInstituicoesFinanciadoras()}
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