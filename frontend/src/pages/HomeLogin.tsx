import React, { useState, useEffect } from "react";
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
  progresso_projeto?: number;
  user_role?: string;
}

const api = axios.create({
  baseURL: 'http://localhost:5000',
});

const Home = () => {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [currentDate] = useState(new Date().toISOString().split('T')[0]);
  const navigate = useNavigate();

  // Estados para os modais
  const [modalAberto, setModalAberto] = useState(false);
  const [modalAbertoProj, setModalAbertoProj] = useState(false);
  const [modalAtualizar, setModalAtualizar] = useState(false);
  
  // Estados para o formulário
  const [nomeProjeto, setNomeProjeto] = useState("");
  const [descricaoProjeto, setDescricaoProjeto] = useState("");
  const [datafimProjeto, setDatafimProjeto] = useState("");
  const [projetoSelecionado, setProjetoSelecionado] = useState<Projeto | null>(null);

  // Carrega projetos ao montar o componente
  useEffect(() => {
    const carregarProjetos = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        const response = await api.get('/user_projects', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const projetosFormatados = response.data.map((projeto: any) => ({
          ...projeto,
          responsavel: projeto.user_role === 'responsavel' ? 'Você' : 'Equipe',
          data_inicio_proj: formatarDataParaExibicao(projeto.data_inicio_proj),
          data_fim_proj: formatarDataParaExibicao(projeto.data_fim_proj)
        }));
        
        setProjetos(projetosFormatados);
      } catch (error) {
        console.error('Erro ao carregar projetos:', error);
        alert('Erro ao carregar projetos');
      }
    };

    carregarProjetos();
  }, [navigate]);

  const navegarParaProjeto = (projeto: Projeto) => {
    navigate(`/projeto/${projeto.id_projeto}`, {state: { projeto }});
  };

  // Formata para exibição (dd/mm/yyyy)
  const formatarDataParaExibicao = (dataString: string) => {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  // Formata para input date (yyyy-mm-dd)
  const formatarDataParaInput = (dataString: string) => {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toISOString().split('T')[0];
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
      const token = localStorage.getItem('token');
      await api.put(`/update_project/${projetoSelecionado.id_projeto}`, {
        nome_projeto: projetoSelecionado.nome_projeto,
        descricao_projeto: projetoSelecionado.descricao_projeto,
        data_fim_proj: projetoSelecionado.data_fim_proj
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Atualiza a lista de projetos localmente
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
      const token = localStorage.getItem('token');
      await api.delete(`/delete_project/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
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
      const response = await api.post('/create_projects', {
        nome_projeto: nomeProjeto,
        descricao_projeto: descricaoProjeto,
        data_fim_proj: datafimProjeto
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
      const token = localStorage.getItem('token');
      const response = await api.get(`/get_projectdetails?id_projeto=${projeto.id_projeto}`, {
        headers: {
          Authorization: `Bearer ${token}`
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
      console.error('Erro ao carregar detalhes do projeto:', error);
      alert('Erro ao carregar detalhes do projeto');
    }
  };

  return (
    <div className="container">
      <main>
        <SuperiorMenu />
        <div className="container-button"> 
          <button className="botao-criar" onClick={criarNovoProjeto}>
            Criar Novo Projeto
          </button>
        </div>
    
        <div className="lista-projetos">
          {projetos.map((projeto) => (
            <div key={projeto.id_projeto} className="projeto" onClick={() => navegarParaProjeto(projeto)} style={{ cursor: "pointer" }}>
              <div className="projeto-header">
                <button className="botao-modal" onClick={(e) => { 
                  e.stopPropagation();
                  abrirModalDetalhes(projeto);
                }}>
                  ...
                </button>
                <h2>{projeto.nome_projeto}</h2>
                <p>{projeto.descricao_projeto}</p>
                <p>{projeto.responsavel}</p>
                <p><strong>Data de Inicio: </strong>{projeto.data_inicio_proj}</p>
                <p><strong>Data de Entrega: </strong>{projeto.data_fim_proj}</p>
                <ProgressBar progress={projeto.progresso_projeto || 0} />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal de Detalhes do Projeto */}
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

      {/* Modal de Atualização do Projeto */}
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

      {/* Modal de Criação de Projeto */}
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