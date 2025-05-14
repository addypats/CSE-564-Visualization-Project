import React, { useState } from 'react';
import '../styles/ColumnSelector.css';

const FEATURE_LABELS = {
  pl_name: "Planet Name",
  pl_insol: "Insolation Flux (Earth flux)",
  pl_orbeccen: "Orbital Eccentricity",
  pl_rade: "Radius (Earth radii)",
  pl_bmasse: "Mass (Earth masses)",
  pl_orbper: "Orbital Period (days)",
  pl_orbsmax: "Semi-Major Axis (AU)",
  sy_dist: "System Distance (pc)",
  st_met: "Stellar Metallicity [Fe/H]",
  st_teff: "Stellar Temperature (K)",
  st_mass: "Stellar Mass (Solar)",
  st_rad: "Stellar Radius (Solar)",
  pl_eqt: "Equilibrium Temp (K)",
};

const prettyName = col => FEATURE_LABELS[col] || col;

function ColumnSelector({ columns, selected, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(open => !open);

  const handleSelect = column => {
    onSelect(column);
    setIsOpen(false);
  };

  return (
    <div className="column-selector">
      <button className="menu-button" onClick={toggleMenu}>
        {isOpen ? 'Close' : (selected ? prettyName(selected) : 'Select Metric')}
      </button>
      {isOpen && (
        <ul className="menu-list">
          {columns.map((col, i) => (
            <li
              key={i}
              className="menu-item"
              onClick={() => handleSelect(col)}
            >
              {prettyName(col)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ColumnSelector;
