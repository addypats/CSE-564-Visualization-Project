import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";

const ScatterPlot = ({ x = "pl_orbeccen", y, onPointClick }) => {
  const [data, setData] = useState({ xVals: [], yVals: [], names: [] });
  const [tooltip, setTooltip] = useState({ visible: false, content: "", x: 0, y: 0 });
  const svgRef = useRef(null);

const FEATURE_LABELS = {
  pl_orbeccen: "Orbital Eccentricity",
  pl_rade: "Radius (Earth radii)",
  pl_bmasse: "Mass (Earth masses)",
  pl_orbper: "Orbital Period (days)",
  sy_dist: "System Distance (pc)",
  st_met: "Stellar Metallicity [Fe/H]",
  st_teff: "Stellar Temperature (K)",
  st_mass: "Stellar Mass (Solar)",
  st_rad: "Stellar Radius (Solar)",
  pl_eqt: "Equilibrium Temp (K)",
  pl_insol: "Insolation Flux",
  pl_orbsmax: "Semi-Major Axis (AU)",
  pl_name: "Planet Name"
};


  useEffect(() => {
    if (!x || !y) return;
    fetch(`${API_BASE}/scatter_data?x=${x}&y=${y}`)
      .then((res) => res.json())
      .then((json) => {
        setData({
          xVals: json[x],
          yVals: json[y],
          names: json.pl_name
        });
      })
      .catch(console.error);
  }, [x, y]);

  useEffect(() => {
    const { xVals, yVals } = data;
    if (!xVals || !yVals || xVals.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // ViewBox setup (responsive)
    const viewBoxWidth = 800;
    const viewBoxHeight = 600;
    const margin = { top: 50, right: 30, bottom: 90, left: 100 };
    const width = viewBoxWidth - margin.left - margin.right;
    const height = viewBoxHeight - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain(d3.extent(xVals)).range([0, width]).nice();
    const yScale = d3.scaleLinear().domain(d3.extent(yVals)).range([height, 0]).nice();

    g.selectAll("circle")
      .data(xVals.map((xVal, i) => ({ x: xVal, y: yVals[i], name: data.names[i] })))
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 5)
      .style("fill", "#1f77b4")
      .on("mouseenter", (event, d) => {
        setTooltip({
          visible: true,
          content: `<strong>${d.name}</strong><br/>${FEATURE_LABELS[y] || y}: ${d.y.toFixed(2)}`,
          x: event.clientX,
          y: event.clientY,
        });
      })
      .on("mouseleave", () =>
        setTooltip((t) => ({ ...t, visible: false }))
      )
      .on("click", (event, d) => onPointClick && onPointClick(d.name));

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append("g").call(d3.axisLeft(yScale));

    g.append("text")
      .attr("class", "x axis-label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 60)
      .style("fill", "black")
      .style("font-size", "14px")
      .text(FEATURE_LABELS[x] || x);

    g.append("text")
      .attr("class", "y axis-label")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${-60},${height / 2}) rotate(-90)`)
      .style("fill", "black")
      .style("font-size", "14px")
      .text(FEATURE_LABELS[y] || y);

    svg
      .append("text")
      .attr("x", viewBoxWidth / 2)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("text-decoration", "underline")
      .text(`Scatter: ${FEATURE_LABELS[x] || x} vs. ${FEATURE_LABELS[y] || y}`);
  }, [data, x, y, onPointClick]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <svg
        ref={svgRef}
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "100%" }}
      />
      {tooltip.visible && (
      <div
        style={{
          position: "absolute",
          left: tooltip.x + 10,
          top: tooltip.y + 10,
          background: "white",
          border: "1px solid black",
          padding: "5px",
          pointerEvents: "none",
          zIndex: 10,
        }}
        dangerouslySetInnerHTML={{ __html: tooltip.content }}
      />
    )}
    </div>
  );
};

export default ScatterPlot;
