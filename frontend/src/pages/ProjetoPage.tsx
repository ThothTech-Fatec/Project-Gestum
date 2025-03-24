import React, { useState } from "react";
import SuperiorMenu from "../components/MenuSuperior.tsx";
import "../css/ProjetoPage.css";  

const ProjetoPage = () => {
  const [atividades, setAtividades] = useState([
  ]);


  return (
        <div className="container">
          <main>
            <SuperiorMenu />
        <div className="container-detalhes">
            <div className="box-informações">
                <p>Não Há Informações</p>

        </div>
     </div>
     </main>

        <div className = "container-calendario">
            <div className = "calendario">
                <p>KLNLKNL</p>
            </div>
        </div>
    </div>



  )}
        
      
        
export default ProjetoPage;
