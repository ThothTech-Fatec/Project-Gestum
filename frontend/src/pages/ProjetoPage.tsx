import React, { useState } from "react";
import SuperiorMenu from "../components/MenuSuperior.tsx";
import "../css/ProjetoPage.css";  
import { useLocation } from "react-router-dom";
import Calendario from "../components/Calendario.tsx";
import ProgessBar from "../components/ProgressBar.tsx";




const ProjetoPage = () => {
  const [atividades, setAtividades] = useState([
  ]);
  const location = useLocation()
  const projeto = location.state?.projeto

  if (!projeto){
    return <p>Projeto não encontrado</p>
  }


  return (
        <div className="container">
          <main>
            <SuperiorMenu />
        <div className="container-detalhes">
            <div className="box-informações">
              <h1>Informações do Projeto</h1>
              <p>{projeto.nome}</p>
              <p> {projeto.descricao}</p>
              <p><strong>Responsável:</strong> {projeto.responsavel}</p>
        </div>
     </div>
     </main>

        <div className = "container-calendario">
            <div className = "calendario">
            <Calendario dataInicio={projeto.dataini} dataFim={projeto.dataFim} />
            </div>
        </div>

        <div className = "container-progresso">
            <div className = "progresso">
            <h1>0%</h1>
            
            </div>
        </div>

        <div className = "container-notificacao">
            <div className = "notificacao">
            <h1>Notificações</h1>
            <div className="mostrar-noti">
              
              
              </div>
            </div>
        </div>
    </div>



  )}
        
      
        
export default ProjetoPage;
