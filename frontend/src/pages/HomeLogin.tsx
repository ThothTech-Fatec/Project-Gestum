import React, { useState } from "react";
import "../css/HomeLogin.css";  
import SuperiorMenu from "../components/MenuSuperior.tsx";
import ProgressBar from "../components/ProgressBar.tsx";
import { useNavigate } from "react-router-dom";



const Home = () => {
  const [projetos, setProjetos] = useState([
    { id: 1, nome: "Projeto A", descricao: "Descrição do Projeto A", responsavel: "Maria",dataini:"10/03/2024",datafim:"20/03/2024"},
    { id: 2, nome: "Projeto B", descricao: "Descrição do Projeto B", responsavel: "João",dataini:"10/03/2025",datafim:"20/03/2025"}
  ]);
  const [currentDate] = useState(new Date().toISOString().substr(0,10))


  const navigate = useNavigate();

  const navegarParaProjeto = (id: number) => {
    navigate(`/projeto/${id}`);
  };
  
  type Projeto = {
    id:number
    nome:string
    descricao:string
    responsavel:string
    dataini: string
    datafim:string
    progresso?: string
  }

  const [modalAberto, setModalAberto] = useState(false);
  const [modalAbertoProj, setModalAbertoProj] = useState(false);
  const [modalAtualizar, setModalAtualizar] = useState(false);
  const [nomeProjeto, setNomeProjeto] = useState("");
  const [descricaoProjeto, setDescricaoProjeto] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [datainiProjeto, setDatainiProjeto] = useState("");
  const [datafimProjeto, setDatafimProjeto] = useState("");
  const [mostrarOpcoes, setMostrarOpcoes] = useState(false);
  const [progresso, setProgresso] = useState("");
  const [projetoSelecionado , setProjetoSelecionado] = useState<Projeto | null>(null);


  const formatarData = (data: string) =>{
    const [ano,mes,dia] = data.split("-");
    return `${dia}/${mes}/${ano}`
  }

  const abrirModalProj = () => {
    setModalAbertoProj(true);
  }

  const abrirModalAtualizar = (projeto: Projeto) => {
    setProjetoSelecionado({
      ...projeto,
      dataini: projeto.dataini.split("/").reverse().join("-"),
      datafim: projeto.datafim.split("/").reverse().join("-"),
    })
    setModalAtualizar(true);
  };

  const atualizarProjeto = () => {
    if (!projetoSelecionado) return;

    const projetoAtualizado = {
      ...projetoSelecionado,
      dataini: formatarData(projetoSelecionado.dataini),
      datafim: formatarData(projetoSelecionado.datafim),
    }

    setProjetos(projetos.map(proj => proj.id === projetoSelecionado.id ? projetoAtualizado : proj));
    setModalAtualizar(false);
  };

  const excluirProjeto = (id: number) => {
    const projetosAtualizados = projetos.filter((projeto) => projeto.id !== id);
    setProjetos(projetosAtualizados);
    fecharModal(); 
  };
  

  const criarNovoProjeto = () => {
    setModalAberto(true); 
  };

  const fecharModal = () => {
    setModalAberto(false);
    setModalAbertoProj(false);
    setNomeProjeto("");
    setDescricaoProjeto("");
    setResponsavel("");
    setProgresso("");
    setDatainiProjeto("");
    setDatafimProjeto("");
    setProjetoSelecionado(null);

  };

  const listaResponsaveis = ["Maria", "João", "Carlos", "Ana", "Juliana"];


  const salvarProjeto = () => {
    if (nomeProjeto.trim() === "" || descricaoProjeto.trim() === "" || responsavel.trim() === "" || datafimProjeto.trim() === "") {
      alert("Preencha todos os campos!");
      return;
    }

    const novoProjeto = {
      id: projetos.length + 1,
      nome: nomeProjeto,
      descricao: descricaoProjeto,
      responsavel :responsavel,
      progresso : progresso,
      dataini: formatarData(currentDate),
      datafim: formatarData(datafimProjeto)

    };

    setProjetos([...projetos, novoProjeto]);
    fecharModal();
  };

  const abrirModalDetalhes = (projeto: Projeto) => {
    setProjetoSelecionado({
      ...projeto,
      dataini: projeto.dataini.includes("-") ? projeto.dataini : projeto.dataini.split("/").reverse().join("-"),
      datafim: projeto.datafim.includes("-") ? projeto.datafim : projeto.datafim.split("/").reverse().join("-"),
    });
    setModalAbertoProj(true);
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

            <div key={projeto.id} className="projeto" onClick={() => navegarParaProjeto(projeto.id)} style={{ cursor: "pointer" }}>
              <div className="projeto-header">
              <button className="botao-modal" onClick={(e) => { e.stopPropagation();
               abrirModalDetalhes(projeto) 
              }}>
                ...
              </button>
                <h2>{projeto.nome}</h2>
                <p>{projeto.descricao}</p>
                <p>{projeto.responsavel}</p>
                <p><strong>Data de Inicio: </strong>{projeto.dataini}</p>
                <p><strong>Data de Entrega: </strong>{projeto.datafim}</p>
              <ProgressBar/>
            </div>
            </div>
          ))}
        </div>
      </main>

      {modalAbertoProj && projetoSelecionado && (
      <div className="modal-overlay">
        <div className="modal-proj">
        <button className="botao-fechar-proj" onClick={fecharModal}>
              x
            </button>
          <h2>Detalhes do  {projetoSelecionado.nome}</h2>  
          <p><strong>Descrição:</strong> {projetoSelecionado.descricao}</p>
          <p><strong>Responsável:</strong> {projetoSelecionado.responsavel}</p>
          <p><strong>Data de Inicio:</strong> {formatarData(projetoSelecionado.dataini)}</p>
          <p><strong>Data de Entrega:</strong> {formatarData(projetoSelecionado.datafim)}</p>
          <p style={{ marginLeft: '7%', display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          width: '100%',}}><ProgressBar/></p>
              <div className="botoes">
                <button className="excluir-proj-home" onClick={() => excluirProjeto(projetoSelecionado.id)}>
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
              value={projetoSelecionado.nome}
              onChange={(e) => setProjetoSelecionado({ ...projetoSelecionado, nome: e.target.value })}
            />
            <input
              className="input-projeto"
              value={projetoSelecionado.descricao}
              onChange={(e) => setProjetoSelecionado({ ...projetoSelecionado, descricao: e.target.value })}
            />

<div className="container-data">
              <div className="campo-data">
                <label>Data de Inicio</label>   
                <input
                  type="date" 
                  placeholder="Data de Inicio do Projeto"  
                  value={projetoSelecionado.dataini}
                  onChange={(e) => setProjetoSelecionado({...projetoSelecionado, dataini: e.target.value})}
                  className="input-dataini"
                  disabled
                />
                </div>
              <div className="campo-data">
                <label>Data de Encerramento</label>   
                <input
                  type="date" 
                  placeholder="Data de Fim do Projeto"  
                  value={projetoSelecionado.datafim}
                  onChange={(e) => setProjetoSelecionado({...projetoSelecionado, datafim: e.target.value})}
                  className="input-datafim"
                  min={currentDate} 
                  />
                </div>
            </div>
            <button className="atualizar-proj-home" onClick={atualizarProjeto}>Salvar</button>
            <button className="excluir-proj-home" onClick={() => setModalAtualizar(false)}>Cancelar</button>
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
                        {/* Seletor de Responsável */}
                        <div className="seletor-responsavel">
              <button className="botao-responsavel" onClick={() => setMostrarOpcoes(!mostrarOpcoes)}>
                {responsavel ? `Responsável: ${responsavel}` : "Selecionar Responsável"}
              </button>

              {mostrarOpcoes && (
                <ul className="lista-responsaveis">
                  {listaResponsaveis.map((nome, index) => (
                    <li key={index} onClick={() => { setResponsavel(nome); setMostrarOpcoes(false); }}>
                      {nome}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
          
            <div className="container-data">
              <div className="campo-data">
                <label>Data de Inicio</label>   
                <input
                  type="date" 
                  placeholder="Data de Inicio do Projeto"  
                  value={currentDate}
                  onChange={(e) => setDatainiProjeto(e.target.value)}
                  className="input-dataini"
                  disabled
                />
                </div>
              <div className="campo-data">
                <label>Data de Entrega</label>   
                <input
                  type="date" 
                  placeholder="Data de Fim do Projeto"  
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
