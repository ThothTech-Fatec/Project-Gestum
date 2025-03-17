import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/HomeLogin.tsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/home" component={Home} />
      </Routes>
    </Router>
  );
}

export default App;
