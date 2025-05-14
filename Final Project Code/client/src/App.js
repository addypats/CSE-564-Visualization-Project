import React, { useState, useEffect } from 'react';
import './App.css';

import ColumnSelector from './components/Column_Selector';
import WorldMap from './components/World_Map';
import ScatterPlot from './components/Scatter_Plot';
import PieChart from './components/Pie_Chart';
import PCP from './components/PCP';
import RadarChart from './components/RadarChart';

function App() {
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  const [columnNames, setColumnNames] = useState([]);
  const [selectedX, setSelectedX] = useState('pl_orbeccen');
  const [selectedY, setSelectedY] = useState('pl_rade');
  const [selectedObservatories, setSelectedObservatories] = useState([]);
  const [selectedDiscoveryMethods, setSelectedDiscoveryMethods] = useState([]);
  const [showRadar, setShowRadar] = useState(false); // <--- New toggle state

  useEffect(() => {
    fetch(`${API_BASE}/columns`)
      .then(res => res.json())
      .then(cols => setColumnNames(cols.filter(c => c.startsWith('pl_'))))
      .catch(console.error);
  }, []);

  return (
    <div className="app-container">
      <header className="banner">
        <div className="banner-left" />

        <div className="banner-center">
          <h1 className="title">Exoplanet Dashboard</h1>
        </div>

        <div className="banner-right">
        <div className="axis-selector-group" style={{ visibility: showRadar ? 'hidden' : 'visible' }}>
          <div className="axis-selector">
            <label>X-Axis:</label>
            <ColumnSelector columns={columnNames} selected={selectedX} onSelect={setSelectedX} />
          </div>
          <div className="axis-selector">
            <label>Y-Axis:</label>
            <ColumnSelector columns={columnNames} selected={selectedY} onSelect={setSelectedY} />
          </div>
        </div>
        <button className="toggle-button" onClick={() => setShowRadar(prev => !prev)}>
          {showRadar ? 'Show Scatterplot' : 'Show Radar Chart'}
        </button>
      </div>
      </header>


      <main className="grid">
        <section className="chart map-chart">
          <WorldMap
            selectedObservatories={selectedObservatories}
            onSelectObservatories={setSelectedObservatories}
          />
        </section>

        <section className="chart scatter-chart">
          {!showRadar ? (
            <ScatterPlot x={selectedX} y={selectedY} onPointClick={() => {}} />
          ) : (
            <RadarChart observatories={selectedObservatories} />
          )}
        </section>

        <section className="chart pcp-chart">
          <PCP selectedDiscoveryMethods={selectedDiscoveryMethods} />
        </section>

        <section className="chart pie-chart">
          <PieChart onSelectionChange={setSelectedDiscoveryMethods} />
        </section>
      </main>
    </div>
  );
}

export default App;
