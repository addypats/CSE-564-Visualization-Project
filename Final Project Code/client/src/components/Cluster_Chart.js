// src/components/ClusterChart.js
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const ClusterChart = ({ facility }) => {
  const [data, setData] = useState([]);
  const svgRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/data/dbscanChart/${facility}`)
      .then(res => res.json())
      .then(json => setData(json))
      .catch(console.error);
  }, [facility]);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const viewBoxWidth = 800;
    const viewBoxHeight = 600;
    const margin = { top: 40, right: 30, bottom: 60, left: 70 };
    const width = viewBoxWidth - margin.left - margin.right;
    const height = viewBoxHeight - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const clusters = Array.from(new Set(data.map(d => d.cluster))).sort((a, b) => a - b);

    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.distance_from_earth))
      .range([0, width])
      .nice();

    const yScale = d3.scalePoint()
      .domain(clusters)
      .range([height, 0])
      .padding(1);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(clusters);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale));

    g.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.distance_from_earth))
      .attr('cy', d => yScale(d.cluster) + (Math.random() - 0.5) * 10) // jitter
      .attr('r', 5)
      .style('fill', d => colorScale(d.cluster))
      .style('opacity', 0.8)
      .on('mouseover', (event, d) => {
        d3.select('#cluster-tooltip')
          .style('display', 'block')
          .html(`Name: ${d.pl_name}<br/>Cluster: ${d.cluster}<br/>Dist: ${d.distance_from_earth.toFixed(2)}`)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 10}px`);
      })
      .on('mousemove', (event) => {
        d3.select('#cluster-tooltip')
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 10}px`);
      })
      .on('mouseout', () => {
        d3.select('#cluster-tooltip').style('display', 'none');
      });

    // Labels
    svg.append('text')
      .attr('x', margin.left + width / 2)
      .attr('y', viewBoxHeight - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Distance from Earth');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', - (margin.top + height / 2))
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Cluster Label');

    svg.append('text')
      .attr('x', viewBoxWidth / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(`DBSCAN Clusters (${facility})`);
  }, [data, facility]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%' }}
      />
      <div
        id="cluster-tooltip"
        style={{
          position: 'absolute',
          display: 'none',
          background: '#fff',
          border: '1px solid #ccc',
          padding: '5px',
          pointerEvents: 'none',
          zIndex: 10
        }}
      />
    </div>
  );
};

export default ClusterChart;
