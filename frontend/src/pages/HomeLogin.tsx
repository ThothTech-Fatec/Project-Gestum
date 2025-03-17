import React, { useState } from "react";
import "../css/HomeLogin.css";  
import SuperiorMenu from "../components/MenuSuperior.tsx";
import ProgressBar from "../components/ProgressBar.tsx";

const Home = () => {
  const [projetos, setProjetos] = useState([
    { id: 1, nome: "Projeto A", descricao: "Descrição do Projeto A", responsavel: "Maria"  },
    { id: 2, nome: "Projeto B", descricao: "Descrição do Projeto B", responsavel: "João"}
  ]);

  type Projeto = {
    id:number
    nome:string
    descricao:string
    responsavel:string
    progresso?: string
  }

  const [modalAberto, setModalAberto] = useState(false);
  const [modalAbertoProj, setModalAbertoProj] = useState(false);
  const [nomeProjeto, setNomeProjeto] = useState("");
  const [descricaoProjeto, setDescricaoProjeto] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [mostrarOpcoes, setMostrarOpcoes] = useState(false);
  const [progresso, setProgresso] = useState("");
  const [projetoSelecionado , setProjetoSelecionado] = useState<Projeto | null>(null);



  const abrirModalProj = () => {
    setModalAbertoProj(true);
  }

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
    setProjetoSelecionado(null);

  };

  const listaResponsaveis = ["Maria", "João", "Carlos", "Ana", "Juliana"];


  const salvarProjeto = () => {
    if (nomeProjeto.trim() === "" || descricaoProjeto.trim() === "" || responsavel.trim() === "") {
      alert("Preencha todos os campos!");
      return;
    }

    const novoProjeto = {
      id: projetos.length + 1,
      nome: nomeProjeto,
      descricao: descricaoProjeto,
      responsavel :responsavel,
      progresso : progresso,
    };

    setProjetos([...projetos, novoProjeto]);
    fecharModal();
  };

  const abrirModalDetalhes = (projeto) => {
    setProjetoSelecionado(projeto);
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
            <div key={projeto.id} className="projeto">
              <div className="projeto-header">
              <button className="botao-modal" onClick={(e) => { e.stopPropagation();
               abrirModalDetalhes(projeto) 
              }}>
                ...
              </button>
              <h2>{projeto.nome}</h2>
              <p>{projeto.descricao}</p>
              <p>{projeto.responsavel}</p>
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
      <p style={{ marginLeft: '7%', display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  width: '100%',}}><ProgressBar/></p>
      <div className="botoes">
        <button className="excluir-proj-home" onClick={() => excluirProjeto(projetoSelecionado.id)}>
           Excluir
          </button>
          <button className="atualizar-proj-home">
           Atualizar
          </button>

      </div>
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
