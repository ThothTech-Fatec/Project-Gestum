import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/HomeLogin.tsx';
import ProjetoPage from './pages/ProjetoPage.tsx'


function App() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>

  );
}

export default App;
