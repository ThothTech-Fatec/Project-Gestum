import React from "react";
import "../css/MenuSuperior.css";
import { useLocation , useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import ImageAvatars from "./LoggedIn/AvatarMenu.tsx";
import { IoHomeOutline } from "react-icons/io5";
import { FaBell } from "react-icons/fa";
import { GoProjectSymlink } from "react-icons/go";
import { FaBook } from "react-icons/fa";
import { MdOutlinePeople } from "react-icons/md";
import { FiActivity } from "react-icons/fi";

const SuperiorMenu = () => {
  const { id } = useParams(); 
  const location = useLocation();
  const projeto = location.state?.projeto;
  

  const idProjeto = parseInt(localStorage.getItem("Id_Project") || "0");
  console.log(idProjeto)




  const isProjetoPage = location.pathname.startsWith("/projeto") || location.pathname.startsWith("/Atividades") || location.pathname.startsWith("/Participantes") || location.pathname.startsWith("/Dashboard")

  return (
    <nav className="superior-menu">
      <ul>
        <li>
          <Link to="/">
            <IoHomeOutline className="home-icon" />
          </Link>
        </li>
        <li>
          <Link to="/">
            <FaBell className="bell-icon" />
          </Link>
        </li>
      </ul>

      {isProjetoPage && (
        <ul>
          <li>
            <Link to={`/projeto/${idProjeto}`} state={{ projeto: projeto }}>
              <GoProjectSymlink className="project-icon" />
            </Link>
          </li>
          <li>
            <Link to="/Atividades" state={{ projeto: projeto }}>
              <FaBook className="atividade-icon" />
            </Link>
          </li>
          <li>
            <Link to="/Participantes" state={{ projeto: projeto }}>
              <MdOutlinePeople className="adicionar-icon" />
            </Link>
          </li>
          <li>
            <Link to="/Dashboard" state={{ projeto: projeto}}>
              <FiActivity className="dashboard-icon" />
            </Link>
          </li>
        </ul>
      )}

      <div className="avatar">
        {ImageAvatars()}
      </div>
    </nav>
  );
};

export default SuperiorMenu;
