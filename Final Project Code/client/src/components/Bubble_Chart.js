// src/components/BubbleChart.js
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const BubbleChart = ({ facility }) => {
  const [data, setData] = useState([]);
  const svgRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/data/bubbleChart/${facility}`)
      .then(res => res.json())
      .then(json => setData(json))
      .catch(console.error);
  }, [facility]);

  useEffect(() => {
    if (!data.length) return;

    const viewBoxWidth = 800;
    const viewBoxHeight = 600;
    const margin = { top: 40, right: 30, bottom: 60, left: 70 };
    const width = viewBoxWidth - margin.left - margin.right;
    const height = viewBoxHeight - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.sy_dist))
      .range([0, width])
      .nice();

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.pl_bmasse))
      .range([height, 0])
      .nice();

    const rScale = d3.scaleSqrt()
      .domain(d3.extent(data, d => d.pl_rade))
      .range([3, 15]);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale));

    g.selectAll('circle')
      .data(data)
      .enter().append('circle')
      .attr('cx', d => xScale(d.sy_dist))
      .attr('cy', d => yScale(d.pl_bmasse))
      .attr('r', d => rScale(d.pl_rade))
      .style('fill', '#ffa500')
      .style('opacity', 0.7)
      .on('mouseover', (event, d) => {
        d3.select('#bubble-tooltip')
          .style('display', 'block')
          .html(`Name: ${d.pl_name}<br/>Mass: ${d.pl_bmasse}<br/>Radius: ${d.pl_rade}`)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 10}px`);
      })
      .on('mousemove', (event) => {
        d3.select('#bubble-tooltip')
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 10}px`);
      })
      .on('mouseout', () => {
        d3.select('#bubble-tooltip').style('display', 'none');
      });

    // Labels
    svg.append('text')
      .attr('x', margin.left + width / 2)
      .attr('y', viewBoxHeight - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Stellar Distance (sy_dist)');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', - (margin.top + height / 2))
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Planet Mass (pl_bmasse)');

    svg.append('text')
      .attr('x', viewBoxWidth / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(`Bubble Chart: Facility = ${facility}`);
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
        id="bubble-tooltip"
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

export default BubbleChart;
