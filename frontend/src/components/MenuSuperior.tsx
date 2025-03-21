import React, { useState } from "react";
import "../css/MenuSuperior.css";  
import ImageAvatars from "./LoggedIn/AvatarMenu.tsx";
import { IoHomeOutline } from "react-icons/io5";
import { FaBell } from "react-icons/fa";


const SuperiorMenu = () => {
    return (
      <nav className="superior-menu">
        <ul>
          <a href="/HomeLogin.tsx"><IoHomeOutline className="home-icon" /></a>

          <a href="#"><FaBell className="bell-icon"/></a>
        </ul>
        <div className="avatar">
          {ImageAvatars()}

        </div>
      </nav>
    );
  };


export default SuperiorMenu
