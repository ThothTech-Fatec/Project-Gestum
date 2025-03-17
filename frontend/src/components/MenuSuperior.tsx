import React, { useState } from "react";
import "../css/MenuSuperior.css";  
import ImageAvatars from "./Avatar.tsx";

const SuperiorMenu = () => {
    return (
      <nav className="superior-menu">
        <ul>
          <li><a href="#">Início</a></li>
          <li><a href="#">Sobre</a></li>
          <li><a href="#">Serviços</a></li>
          <li><a href="#">Contato</a></li>
        </ul>
        <div className="avatar">
          {ImageAvatars()}

        </div>
      </nav>
    );
  };


export default SuperiorMenu
