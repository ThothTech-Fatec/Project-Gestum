import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/HomeLogin.tsx';
import ProjetoPage from './pages/ProjetoPage.tsx'
import Atividades from './pages/Atividades.tsx'
import Participantes from './pages/Participantes.tsx';



function App() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projeto/:id" element={<ProjetoPage />} />
        <Route path="/atividades" element={<Atividades />} />
        <Route path="/participantes" element={<Participantes />} />

      </Routes>

  );
}

export default App;
