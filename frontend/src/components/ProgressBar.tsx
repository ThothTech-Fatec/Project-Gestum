import React, { useState } from "react";
import "../css/ProgressBar.css"; // Importando o CSS

const ProgressBar = () => {
  const [progress, setProgress] = useState(0);

  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

export default ProgressBar;
