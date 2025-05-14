import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const PieChart = ({ onSelectionChange }) => {
  const [data, setData] = useState([]);
  const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });
  const [selectedMethods, setSelectedMethods] = useState([]);
  const svgRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/pie-chart`)
      .then(res => res.json())
      .then(json => setData(json))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 360;
    const height = 360;
    const radius = Math.min(width, height) / 2;

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(data.map(d => d.discoverymethod));

    const pie = d3.pie().value(d => d.count);
    const arc = d3.arc().outerRadius(radius).innerRadius(0);

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => colorScale(d.data.discoverymethod))
      .attr('stroke', 'white')
      .attr('stroke-width', '2px')
      .style('opacity', d => selectedMethods.length === 0 || selectedMethods.includes(d.data.discoverymethod) ? 1 : 0.4)
      .on('mouseover', (event, d) => {
        setTooltip({
          visible: true,
          content: `${d.data.discoverymethod}: ${d.data.count}`,
          x: event.pageX,
          y: event.pageY
        });
      })
      .on('mousemove', event => {
        setTooltip(t => ({ ...t, x: event.pageX, y: event.pageY }));
      })
      .on('mouseout', () => {
        setTooltip(t => ({ ...t, visible: false }));
      })
      .on('click', (event, d) => {
        const method = d.data.discoverymethod;
        const updated = selectedMethods.includes(method)
          ? selectedMethods.filter(m => m !== method)
          : [...selectedMethods, method];
        setSelectedMethods(updated);
        onSelectionChange(updated);
      });

    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('dy', '0.35em')
      .style('text-anchor', 'middle')
      .text(d => d.data.discoverymethod);
  }, [data, selectedMethods]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      <h3 style={{ marginBottom: '10px' }}>Count by Discovery Method</h3>
      <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
        <svg ref={svgRef} />
      </div>
      {tooltip.visible && (
        <div
          style={{
            position: 'absolute',
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y + 10}px`,
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid #ccc',
            padding: '5px 10px',
            borderRadius: '5px',
            pointerEvents: 'none'
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
  
};

export default PieChart;
