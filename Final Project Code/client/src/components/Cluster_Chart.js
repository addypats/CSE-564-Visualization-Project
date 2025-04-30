// src/components/ClusterChart.js
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const ClusterChart = ({ facility }) => {
  const [data, setData] = useState([]);
  const svgRef = useRef(null);

  useEffect(() => {
    // Fetch cluster data for selected facility (or "undefined" for all)
    fetch(`${API_BASE}/data/dbscanChart/${facility}`)
      .then(res => res.json())
      .then(json => setData(json))
      .catch(console.error);
  }, [facility]);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const width = 600;
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove();

    // Extract unique cluster labels
    const clusters = Array.from(new Set(data.map(d => d.cluster))).sort((a,b) => a - b);

    // Scales: x = distance_from_earth, y = cluster index
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.distance_from_earth))
      .range([0, innerWidth])
      .nice();

    const yScale = d3.scalePoint()
      .domain(clusters)
      .range([innerHeight, 0])
      .padding(1);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(clusters);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Labels
    svg.append('text')
      .attr('x', margin.left + innerWidth / 2)
      .attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Distance from Earth');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', - (margin.top + innerHeight / 2))
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Cluster Label');

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(`DBSCAN Clusters (${facility})`);

    // Tooltip
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background', '#fff')
      .style('border', '1px solid #ccc')
      .style('padding', '5px')
      .style('display', 'none');

    // Points with slight jitter on y to avoid overlap
    g.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.distance_from_earth))
      .attr('cy', d => yScale(d.cluster) + (Math.random() - 0.5) * 10)
      .attr('r', 5)
      .style('fill', d => colorScale(d.cluster))
      .style('opacity', 0.8)
      .on('mouseover', (event, d) => {
        tooltip.style('display', 'block')
          .html(`Name: ${d.pl_name}<br/>Cluster: ${d.cluster}<br/>Dist: ${d.distance_from_earth.toFixed(2)}`)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 10}px`);
      })
      .on('mousemove', (event) => {
        tooltip.style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 10}px`);
      })
      .on('mouseout', () => {
        tooltip.style('display', 'none');
      });
  }, [data, facility]);

  return <svg ref={svgRef}></svg>;
};

export default ClusterChart;
