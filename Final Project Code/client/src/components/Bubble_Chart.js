// src/components/BubbleChart.js
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const BubbleChart = ({ facility }) => {
  const [data, setData] = useState([]);
  const svgRef = useRef(null);

  useEffect(() => {
    // Fetch bubble data for selected facility (or "undefined" for all)
    fetch(`${API_BASE}/data/bubbleChart/${facility}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
      })
      .catch(console.error);
  }, [facility]);

  useEffect(() => {
    if (!data.length) return;

    const width = 600;
    const height = 400;
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove();

    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Scales: x = sy_dist, y = pl_bmasse, r = pl_rade
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.sy_dist))
      .range([0, innerWidth])
      .nice();

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.pl_bmasse))
      .range([innerHeight, 0])
      .nice();

    const rScale = d3.scaleSqrt()
      .domain(d3.extent(data, d => d.pl_rade))
      .range([3, 15]);

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
      .text('Stellar Distance (sy_dist)');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', - (margin.top + innerHeight / 2))
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Planet Mass (pl_bmasse)');

    // Chart Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(`Bubble Chart: Facility = ${facility}`);

    // Bubbles
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background', '#fff')
      .style('border', '1px solid #ccc')
      .style('padding', '5px')
      .style('display', 'none');

    g.selectAll('circle')
      .data(data)
      .enter().append('circle')
      .attr('cx', d => xScale(d.sy_dist))
      .attr('cy', d => yScale(d.pl_bmasse))
      .attr('r', d => rScale(d.pl_rade))
      .style('fill', '#ffa500')
      .style('opacity', 0.7)
      .on('mouseover', (event, d) => {
        tooltip.style('display', 'block')
          .html(`Name: ${d.pl_name}<br/>Mass: ${d.pl_bmasse}<br/>Radius: ${d.pl_rade}`)
          .style('left', `${event.pageX+10}px`)
          .style('top', `${event.pageY+10}px`);
      })
      .on('mousemove', (event) => {
        tooltip.style('left', `${event.pageX+10}px`)
          .style('top', `${event.pageY+10}px`);
      })
      .on('mouseout', () => {
        tooltip.style('display', 'none');
      });
  }, [data, facility]);

  return <svg ref={svgRef}></svg>;
};

export default BubbleChart;
