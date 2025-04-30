// import './App.css';
// import { useState, useEffect } from 'react';
// import WorldMap from './components/WorldMap';
// import ColumnSelector from './components/ColumnSelector';
// import ScatterPlot from './components/Scatterplot';
// import PieChart from './components/PieChart';
// import PCP from './components/PCP';
// import WorldRadar from './components/WorldRadar';

// function App() {
//   const [columnNames, setColumnNames] = useState([]);

//   useEffect(() => {
//     // Function to fetch column names from the backend
//     const fetchColumnNames = async () => {
//       try {
//         // Adjust the URL as needed based on your Flask app's URL
//         const response = await fetch('http://localhost:5000/columns');
//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }
//         const data = await response.json();
//         setColumnNames(data);
//       } catch (error) {
//         console.error('Failed to fetch column names:', error);
//       }
//     };

//     fetchColumnNames();
//   }, []);
//   const [selectedColumn, setSelectedColumn] = useState("GDP per capita");
//   const [selectedCountries, setSelectedCountries] = useState([]);
//   const [selectedRegion, setSelectedRegion] = useState(["Africa", "Asia", "Europe", "North America", "Oceania", "South America"]);
//   const [highlightedCountries, setHighlightedCountries] = useState([]);

//   const handleColumnSelect = column => {
//     setSelectedColumn(column);
//   };

//   const handleCountryClick = country => {
//     setSelectedCountries(country)
//   };

//   const handleChangeRegion = region => {
//     setSelectedRegion(region);
//   }

//   const handleHighlightedCountries = countries => {
//     setHighlightedCountries(countries);
//   }

//   return (
//     <div className="app-container">
//       <div className="banner">
//       <ColumnSelector columns={columnNames} onSelectColumn={handleColumnSelect} selectedColumn={selectedColumn} />
//         <div className="title">World Stats and Understanding Happiness
// </div>
        
//       </div>
//       <div className="component">
//         <WorldMap selectedColumn={selectedColumn} onCountryClick={handleCountryClick} selectedRegion={selectedRegion} highlightedCountries={highlightedCountries}/>
//       </div>
//       <div className="component">
//         <ScatterPlot selectedColumn={selectedColumn} handleHighlightedCountries={handleHighlightedCountries} selectedCountries={selectedCountries} selectedRegion={selectedRegion}/>
//       </div>
//       <div className="component">
//         <WorldRadar selectedCountries={selectedCountries}/>
//       </div>
//       <div className="component">
//         <PieChart handleChangeRegion={handleChangeRegion} selectedCountries={selectedCountries} highlightedCountries={highlightedCountries}/>
//       </div>
//       <div className="component">
//         <PCP selectedRegion={selectedRegion} highlightedCountries={highlightedCountries} selectedCountries={selectedCountries}/>
//       </div>
//     </div>
//   );
// }

// export default App;



// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';

import ColumnSelector   from './components/Column_Selector';
import WorldMap         from './components/World_Map';
import BubbleChart      from './components/Bubble_Chart';
import ClusterChart     from './components/Cluster_Chart';
import ScatterPlot      from './components/Scatter_Plot';
import PieChart         from './components/Pie_Chart';
import PCP              from './components/PCP';

function App() {
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Numeric columns for scatter Y-axis
  const [columnNames, setColumnNames] = useState([]);
  // Observatory names for filtering bubble & cluster charts
  const [observatoryNames, setObservatoryNames] = useState([]);

  // Currently selected metric and observatory
  const [selectedColumn, setSelectedColumn]       = useState('pl_rade');
  const [selectedObservatory, setSelectedObservatory] = useState('undefined');

  useEffect(() => {
    // 1) Load exoplanet numeric columns
    fetch(`${API_BASE}/columns`)
      .then(res => res.json())
      .then(cols => {
        setColumnNames(cols.filter(c => c.startsWith('pl_')));
      })
      .catch(console.error);

    // 2) Load observatory names from the map endpoint
    fetch(`${API_BASE}/data/map`)
      .then(res => res.json())
      .then(geojson => {
        const names = Array.from(new Set(
          geojson.features
            .filter(f => f.properties?.name)
            .map(f => f.properties.name)
        ));
        setObservatoryNames(names);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="app-container">

      {/* Top banner */}
      <div className="banner">
        <ColumnSelector
          columns={columnNames}
          selected={selectedColumn}
          onSelect={setSelectedColumn}
        />
        <div className="title">Exoplanet Dashboard</div>
      </div>

      {/* Main grid */}
      <div className="grid">

        {/* World map */}
        <div className="chart map-chart">
          <WorldMap
            selectedObservatory={selectedObservatory}
            onSelectObservatory={setSelectedObservatory}
          />
        </div>

        {/* Bubble chart */}
        <div className="chart">
          <BubbleChart facility={selectedObservatory} />
        </div>

        {/* Cluster chart */}
        <div className="chart">
          <ClusterChart facility={selectedObservatory} />
        </div>

        {/* Scatter plot */}
        <div className="chart">
          <ScatterPlot
            y={selectedColumn}
            onPointClick={() => {}}
          />
        </div>

        {/* Pie chart */}
        <div className="chart">
          <PieChart />
        </div>

        {/* Parallel coordinates */}
        <div className="chart">
          <PCP />
        </div>
      </div>
    </div>
  );
}

export default App;