import React from "react";
import SuperiorMenu from "../components/MenuSuperior.tsx";
import "../css/Participantes.css";
import { Avatar } from "@mui/material";

const participants = [
  { name: "Márcio Gabriel", email: "marcio.gabriel@gmail.com", owner: true, image: "URL_DA_IMAGEM" },
  { name: "Flávio Gonçalves", email: "flaviogoncalves@gmail.com", image: "URL_DA_IMAGEM" },
  { name: "Lucas Azuma", email: "lucas.azuma@gmail.com", image: "URL_DA_IMAGEM" },
  { name: "Gustavo Badim", email: "gustavo.badim@gmail.com", image: "URL_DA_IMAGEM" },
  { name: "Gustavo Braga", email: "gustavo.braga@gmail.com", image: "URL_DA_IMAGEM" },
  { name: "Vinicius Henrique", email: "vinicius.henrique@gmail.com", image: "URL_DA_IMAGEM" },
];

const Participantes = () => {
  return (
    <div className="container">
      <SuperiorMenu />
      <div className="participantes">
        <h1>Participantes</h1>
        <div className="participants-grid">
          {/* Card para adicionar participantes */}
          <div className="participant-card add-card">
            <div className="add-icon">➕</div>
            <p>Adicionar Participantes</p>
          </div>

          {/* Listagem de participantes */}
          {participants.map((participant, index) => (
            <div key={index} className="participant-card">
              <Avatar className="avatar-participante" ></Avatar>
              <strong>{participant.name}</strong>
              <p>{participant.email}</p>
              {participant.owner && <span className="owner-badge">Owner</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Participantes;
