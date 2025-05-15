import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/HomeLogin.tsx';
import ProjetoPage from './pages/ProjetoPage.tsx'
import Atividades from './pages/Atividades.tsx'
import Participantes from './pages/Participantes.tsx';
import Dashboard from './pages/Dashboard.tsx';



function App() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projeto/:id" element={<ProjetoPage />} />
        <Route path="/atividades" element={<Atividades />} />
        <Route path="/participantes" element={<Participantes />} />
        <Route path="/dashboard" element={<Dashboard />} />


      </Routes>

  );
}

export default App;
