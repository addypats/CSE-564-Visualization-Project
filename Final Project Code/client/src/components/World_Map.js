import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const WorldMap = ({ selectedObservatories, onSelectObservatories }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/data/map`)
      .then(res => res.json())
      .then(geojson => {
        drawMap(geojson);
      })
      .catch(console.error);
  }, [selectedObservatories]);

  const toggleObservatory = (name) => {
    const updated = selectedObservatories.includes(name)
      ? selectedObservatories.filter(o => o !== name)
      : [...selectedObservatories, name];

    onSelectObservatories(updated);
  };

  const drawMap = (geojson) => {
    const width = 800;
    const height = 500;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove();

    const baseProjection = d3.geoMercator().fitSize([width, height], geojson);
    const [x, y] = baseProjection.translate();

    const projection = d3.geoMercator()
      .fitSize([width, height], geojson)
      .translate([x, y - height * 0.15]);

    const path = d3.geoPath().projection(projection);

    const land = geojson.features.filter(f => f.geometry.type !== 'Point');
    const points = geojson.features.filter(f => f.geometry.type === 'Point');

    svg.append('g')
      .selectAll('path')
      .data(land)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('fill', '#e0e0e0')
      .attr('stroke', '#999');

    svg.append('g')
      .selectAll('circle')
      .data(points)
      .enter()
      .append('circle')
      .attr('cx', d => projection(d.geometry.coordinates)[0])
      .attr('cy', d => projection(d.geometry.coordinates)[1])
      .attr('r', d => selectedObservatories.includes(d.properties.name) ? 6 : 4)
      .attr('fill', d => selectedObservatories.includes(d.properties.name) ? '#d62728' : '#1f77b4')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        toggleObservatory(d.properties.name);
      })
      .append('title')
      .text(d => d.properties.name);
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <svg ref={svgRef} style={{ flex: 1, height: '100%' }} />
      <div
        className="legend"
        style={{
          width: '200px',
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderLeft: '1px solid #ccc',
          overflowY: 'auto'
        }}
      >
        <h4 style={{ marginTop: 0 }}>Selected Observatories</h4>
        {selectedObservatories.length === 0 ? (
          <p style={{ fontStyle: 'italic' }}>None selected</p>
        ) : (
          <ul style={{ paddingLeft: '20px' }}>
            {selectedObservatories.map((name, i) => (
              <li key={i} style={{ color: '#d62728' }}>{name}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default WorldMap;
