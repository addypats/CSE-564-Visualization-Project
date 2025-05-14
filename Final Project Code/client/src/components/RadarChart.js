import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import '../styles/RadarChart.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Axes to visualise – keep consistent order for readability
export const FEATURES = [
  'pl_orbeccen', // Orbital eccentricity
  'pl_rade',     // Radius (Earth radii)
  'pl_bmasse',   // Mass (Earth masses)
  'pl_orbper',   // Orbital period (days)
  'sy_dist',     // System distance (parsecs)
  'st_met'       // Stellar metallicity [Fe/H]
];

const FEATURE_LABELS = {
  'pl_orbeccen': 'Orbital Eccentricity',
  'pl_rade':     'Radius',
  'pl_bmasse':   'Mass',
  'pl_orbper':   'Orbital Period (days)',
  'sy_dist':     'System Distance',
  'st_met':      'Stellar Metallicity [Fe/H]',
};

const colorScale = d3.scaleOrdinal(d3.schemeCategory10);


const RadarChart = ({ observatories }) => {
  const containerRef = useRef(null);
  const svgRef       = useRef(null);
  const tooltipRef   = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  /* ---------- Observe container size so the chart always fills its cell ---------- */
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    // Initial size
    const updateSize = () => {
      const { width, height } = node.getBoundingClientRect();
      setDims({ width, height });
    };
    updateSize();

    // ResizeObserver for live responsiveness
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

  /* ---------- Fetch data whenever the selection changes ---------- */
  useEffect(() => {
    if (!observatories || observatories.length === 0) {
      // Clear chart if nothing is selected
      d3.select(svgRef.current).selectAll('*').remove();
      return;
    }

    fetch(`${API_BASE}/radar-data`, {
      method: 'GET',
      headers: { 'Selected-Observatories': JSON.stringify(observatories) }
    })
      .then(res => res.json())
      .then(json => {
        if (Array.isArray(json)) drawChart(json);
      })
      .catch(console.error);
  }, [observatories, dims]); // redraw on resize as well

  /* ---------- Main drawing routine ---------- */
  const drawChart = (data) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // clear before redraw

    /** Responsive sizing */
    const outerW = dims.width  || 400;
    const outerH = dims.height || 400;
    const size   = Math.min(outerW, outerH);         // enforce square
    const margin = size * 0.1;                       // 10% margin all around
    const radius = (size - 2 * margin) / 2;          // chart radius

    svg
      .attr('width',  outerW)
      .attr('height', outerH)
      .attr('viewBox', `0 0 ${outerW} ${outerH}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const chartGroup = svg.append('g')
      .attr('transform', `translate(${outerW / 2}, ${outerH / 2})`);

    /* ---------- Feature‑wise min‑max normalisation ---------- */
    const GLOBAL_FEATURE_STATS = {
      pl_orbeccen: { min: 0, max: 1 },
      pl_rade:     { min: 0, max: 20 },
      pl_bmasse:   { min: 0, max: 200 },
      pl_orbper:   { min: 0, max: 10000 },
      sy_dist:     { min: 0, max: 2000 },
      st_met:      { min: -1, max: 1 }
    };

    const featureStats = FEATURES.map(f => GLOBAL_FEATURE_STATS[f]);


    // Fall‑back to avoid zero‑extent ranges (division by zero)
    featureStats.forEach(stat => {
      if (stat.max === stat.min) stat.max = stat.min + 1;
    });

    const levels     = 5;                     // concentric grid levels
    const angleSlice = (2 * Math.PI) / FEATURES.length;

    /* ---------- Grid ---------- */
    d3.range(1, levels + 1).forEach(lvl => {
      chartGroup.append('circle')
        .attr('r', (radius / levels) * lvl)
        .attr('fill', lvl % 2 === 0 ? '#f9f9f9' : '#fff')
        .attr('stroke', '#ddd');
    });

    /* ---------- Axes ---------- */
    const axis = chartGroup.selectAll('.axis')
      .data(FEATURES)
      .enter()
      .append('g')
      .attr('class', 'axis');

    axis.append('line')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', (_, i) => radius * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y2', (_, i) => radius * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('stroke', '#999');

    axis.append('text')
      .attr('x', (_, i) => (radius + 12) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y', (_, i) => (radius + 12) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', 12)
      .style('fill', '#333')
      .text(d => FEATURE_LABELS[d] || d);

    /* ---------- Line generator ---------- */
    const radarLine = d3.lineRadial()
      .radius((d, i) => {
        const { min, max } = featureStats[i];
        const normalized = (d.value - min) / (max - min);
        const clamped = Math.max(0, Math.min(1, normalized));
        return clamped * radius;
      })

      .angle((_, i) => i * angleSlice)
      .curve(d3.curveCardinalClosed);

    /* ---------- Wrapper group for each observatory ---------- */
    const blobWrapper = chartGroup.selectAll('.radar-wrapper')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'radar-wrapper');

    /* Area fills */
    blobWrapper.append('path')
      .attr('d', d => radarLine(FEATURES.map(f => ({ axis: f, value: +d[f] || 0 }))))
      .style('fill', (_, i) => colorScale(i))
      .style('fill-opacity', 0.35)
      .style('stroke', (_, i) => colorScale(i))
      .style('stroke-width', 2)
      .on('mouseover', function () {
        d3.select(this).transition().duration(150).style('fill-opacity', 0.6);
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(150).style('fill-opacity', 0.35);
      });

    /* Data points + tooltip */
    blobWrapper.selectAll('.radar-circle')
      .data(d => FEATURES.map(f => ({ axis: f, value: +d[f] || 0, observatory: d.observatory })))
      .enter()
      .append('circle')
      .attr('class', 'radar-circle')
      .attr('r', 3)
      .attr('cx', (d, i) => {
        const { min, max } = featureStats[i];
        const rVal = ((d.value - min) / (max - min)) * radius;
        return rVal * Math.cos(angleSlice * i - Math.PI / 2);
      })
      .attr('cy', (d, i) => {
        const { min, max } = featureStats[i];
        const rVal = ((d.value - min) / (max - min)) * radius;
        return rVal * Math.sin(angleSlice * i - Math.PI / 2);
      })
      .style('fill', (_, i, nodes) => colorScale(nodes[i].parentNode.__dataIndex__))
      .style('pointer-events', 'all')
      .on('mouseover', (event, d) => {
        const tooltip = d3.select(tooltipRef.current);
        tooltip
          .style('opacity', 1)
          .style('left', `${event.pageX + 8}px`)
          .style('top',  `${event.pageY - 28}px`)
          .html(`<strong>${d.observatory}</strong><br/>${FEATURE_LABELS[d.axis] || d.axis}: ${d.value}`);
      })
      .on('mouseout', () => {
        d3.select(tooltipRef.current).style('opacity', 0);
      });

    /* ---------- Legend ---------- */
    const legendGroup = svg.append('g')
      .attr('transform', `translate(${margin}, ${margin})`);

    const legendItem = legendGroup.selectAll('.legend-item')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (_, i) => `translate(0, ${i * 18})`);

    legendItem.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', (_, i) => colorScale(i));

    legendItem.append('text')
      .attr('x', 18)
      .attr('y', 10)
      .style('font-size', 12)
      .style('fill', '#333')
      .text(d => d.observatory);
  };

  return (
    <div ref={containerRef} className="radar-chart-wrapper">
      <svg ref={svgRef} />
      <div ref={tooltipRef} className="radar-tooltip" />
    </div>
  );
};

export default RadarChart;