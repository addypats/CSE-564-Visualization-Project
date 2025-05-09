// import React, { useState } from 'react';
// import '../styles/ColumnSelector.css';
// import { color, gray } from 'd3';

// function ColumnSelector({ columns, onSelectColumn, selectedColumn }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const toggleMenu = () => setIsOpen(!isOpen);

//   const handleSelect = (column) => {
//     onSelectColumn(column);
//     setIsOpen(false); // Close the menu after selection
//   };

//   return (
//     <div className="column-selector">
//       <button className="menu-button" onClick={toggleMenu}>
//         {isOpen ? 'Close' : selectedColumn} {/* Toggle button text */}
//       </button>
//       {isOpen && (
//         <ul className="menu-list">
//           {columns.map((column, index) => (
//             <li key={index} className="menu-item" onClick={() => handleSelect(column)}>
//               {column}
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }

// export default ColumnSelector;



// // src/components/ColumnSelector.js
// import React, { useState } from 'react';
// import '../styles/ColumnSelector.css';

// function ColumnSelector({ columns, selected, onSelect }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const toggleMenu = () => setIsOpen(open => !open);

//   const handleSelect = column => {
//     onSelect(column);
//     setIsOpen(false);
//   };

//   return (
//     <div className="column-selector">
//       <button className="menu-button" onClick={toggleMenu}>
//         {isOpen ? 'Close' : selected || 'Select Metric'}
//       </button>
//       {isOpen && (
//         <ul className="menu-list">
//           {columns.map((col, i) => (
//             <li
//               key={i}
//               className="menu-item"
//               onClick={() => handleSelect(col)}
//             >
//               {col}
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }

// export default ColumnSelector;


// src/components/ColumnSelector.js
import React, { useState } from 'react';
import '../styles/ColumnSelector.css';

// Utility to convert column keys into human-readable labels
const prettyName = col => {
  // Remove prefix, replace underscores, capitalize words
  const base = col.replace(/^pl_/, '').replace(/_/g, ' ');
  return base
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

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