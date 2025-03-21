import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Home from './pages/HomeLogin.tsx'; // Certifique-se de que o caminho está correto
import { BrowserRouter as Router } from 'react-router-dom'; // Importando o Router
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Router>  {/* Envolvendo a aplicação com o Router */}
      <App />
      <Home />
    </Router>
  </React.StrictMode>
);

// Se quiser começar a medir o desempenho, passe uma função para registrar os resultados (por exemplo: reportWebVitals(console.log))
reportWebVitals();
