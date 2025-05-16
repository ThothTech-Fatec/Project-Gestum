import React from "react";
import "../css/Dashboard.css";
import SuperiorMenu from "../components/MenuSuperior.tsx";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <SuperiorMenu />
      <div className="dashboard-grid">
        <div className="card big-number">
          <h3>Opportunity Count</h3>
          <p className="number">487</p>
        </div>

        <div className="card">
          <h3>Opportunity by Size & Stage</h3>
          <div className="chart-placeholder"></div>
        </div>

        <div className="card">
          <h3>Opportunities by Sales Stage</h3>
          <div className="chart-placeholder"></div>
        </div>

        <div className="card">
          <h3>Opportunity by Region</h3>
          <div className="chart-placeholder pie"></div>
        </div>

        <div className="card revenue">
          <h3>Revenue</h3>
          <p className="number">$2bn</p>
        </div>

        <div className="card">
          <h3>Monthly Opportunity</h3>
          <div className="chart-placeholder bar"></div>
        </div>

        <div className="card">
          <h3>Opportunities by Region & Size</h3>
          <div className="chart-placeholder bar-horizontal"></div>
        </div>

        <div className="card">
          <h3>Opportunities by Sales Stage</h3>
          <div className="chart-placeholder bar-horizontal"></div>
        </div>

        <div className="card">
          <h3>Revenue by Stage</h3>
          <div className="chart-placeholder bar"></div>
        </div>

        <div className="card">
          <h3>Average Revenue</h3>
          <div className="chart-placeholder bar"></div>
        </div>

        <div className="card">
          <h3>Factored Revenue</h3>
          <p className="number">$461M</p>
        </div>

        <div className="card">
          <h3>Factored Revenue by Size</h3>
          <div className="chart-placeholder bar"></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
