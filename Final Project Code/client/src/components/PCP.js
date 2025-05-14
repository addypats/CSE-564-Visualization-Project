import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";

const PCP = ({ selectedDiscoveryMethods }) => {
  const [data, setData] = useState([]);
  const [mappings, setMappings] = useState({});
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);

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
  pl_eqt: "Equilibrium Temp (K)"
};


  useEffect(() => {
    fetch(`${API_BASE}/pcp`)
      .then((res) => res.json())
      .then(({ data, mappings }) => {
        setData(data);
        setMappings(mappings);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (data.length > 0 && Object.keys(mappings).length > 0) {
      const svg = d3.select(svgRef.current);
      const tooltip = d3.select(tooltipRef.current);
      svg.selectAll("*").remove();

      const margin = { top: 50, right: 20, bottom: 50, left: 50 };
      const width = 960 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      // Filter data based on selectedDiscoveryMethods
      const filteredData =
        selectedDiscoveryMethods && selectedDiscoveryMethods.length > 0
          ? data.filter((d) =>
              selectedDiscoveryMethods.includes(mappings.discoverymethod[d.discoverymethod])
            )
          : data;

      if (filteredData.length === 0) return;

      const dimensions = Object.keys(data[0]);

      const methodLabels = Object.values(mappings.discoverymethod);
      const colorScale = d3
        .scaleOrdinal(d3.schemeCategory10)
        .domain(methodLabels);

      const y = {};
      dimensions.forEach((dim) => {
        y[dim] = d3
          .scaleLinear()
          .domain(d3.extent(data, (d) => +d[dim]))
          .range([height, 0])
          .nice();
      });

      const x = d3
        .scalePoint()
        .range([0, width])
        .padding(0)
        .domain(dimensions);

      const line = d3
        .line()
        .defined(([, v]) => v != null)
        .x(([k]) => x(k))
        .y(([k, v]) => y[k](v));

      const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Draw filtered lines
      g.selectAll("path")
        .data(filteredData)
        .enter()
        .append("path")
        .attr("d", (d) =>
          line(Object.entries(d).filter(([k]) => dimensions.includes(k)))
        )
        .style("fill", "none")
        .style("stroke", (d) =>
          colorScale(mappings.discoverymethod[d.discoverymethod])
        )
        .style("opacity", 0.7)
        .on("mouseover", (event, d) => {
          tooltip
            .style("display", "block")
            .html(
              `Host: ${mappings.hostname[d.hostname]}<br/>Method: ${mappings.discoverymethod[d.discoverymethod]}`
            )
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", () => tooltip.style("display", "none"));

      // Axes
      svg
        .selectAll("g.axis")
        .data(dimensions)
        .enter()
        .append("g")
        .attr("class", "axis")
        .attr(
          "transform",
          (d) => `translate(${margin.left + x(d)},${margin.top})`
        )
        .each(function (d) {
          d3.select(this).call(d3.axisLeft(y[d]));
        })
        .append("text")
        .attr("y", -9)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "black")
        .text((d) => FEATURE_LABELS[d] || d);

      svg
        .append("text")
        .attr("x", width / 2 + margin.left)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text("Parallel Coordinates of Exoplanet Features");

      svg
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom + 40);
    }
  }, [data, mappings, selectedDiscoveryMethods]);

  return (
    <>
      <svg ref={svgRef}></svg>
      <div
        ref={tooltipRef}
        style={{
          position: "absolute",
          display: "none",
          pointerEvents: "none",
          backgroundColor: "white",
          border: "1px solid black",
          padding: "5px",
        }}
      ></div>
    </>
  );
};

export default PCP;
