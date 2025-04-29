resetDashboard();

document.querySelector('.header button').addEventListener('click', function () {
    resetDashboard();
});



function resetDashboard() {
    renderObservatoryMap();
    renderParallelCoordinatesPlot();
    renderBubbleChart();
    renderClusterChart();
}

function renderObservatoryMap() {

    // Select the div where the map will go
    const observatoryMap = d3.select("#observatory-map-container");
    const svgObservatoryMap = observatoryMap.append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    // svgObservatoryMap.attr('viewBox', '0 0 100 100');
    // svgObservatoryMap.attr('preserveAspectRatio', 'xMidYMid meet');

    const width = svgObservatoryMap.node().getBoundingClientRect().width;
    const height = svgObservatoryMap.node().getBoundingClientRect().height;

    // Create a projection for the map
    const projection = d3.geoMercator()
        .scale(100) // Scale will depend on your specific map
        .translate([width / 2, height / 2]);

    // Create a path generator using the projection
    const path = d3.geoPath().projection(projection);

    // Fetch the GeoJSON data from the Flask endpoint
    d3.json('/data/map').then(geojsonData => {

        svgObservatoryMap.selectAll(".country")
            .data(geojsonData.features)
            .enter().append("path")
            .attr("class", "country")
            .attr("d", path);

        const tooltip = d3.select(".tooltip");

        // Draw points
        const points = svgObservatoryMap.selectAll(".point")
            .data(geojsonData.features.filter(d => d.geometry.type === "Point"))  // Filter only the point features
            .enter()
            .append("circle")  // Add a circle for each point
            .attr("class", "point")
            .attr("cx", d => projection(d.geometry.coordinates)[0])  // Use projection to get screen x-coordinate
            .attr("cy", d => projection(d.geometry.coordinates)[1])  // Use projection to get screen y-coordinate
            .attr("r", 3)  // Radius of the point on the map
            .attr("fill", "red") // Fill color of the point
            .attr("data-name", d => d.properties.name)
            .style("cursor", "pointer");

        svgObservatoryMap.on("mousemove", function (event) {
            const mouse = d3.pointer(event);
            let nearest = null;
            let minDistance = Infinity;

            points.each(function (d) {
                const point = [+d3.select(this).attr("cx"), +d3.select(this).attr("cy")];
                const dist = distance(mouse, point);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearest = this;
                }
            });

            points.classed("highlight", false); // Remove highlight from all points
            points.attr("r", 3); // Reset radius
            d3.select(nearest).raise(); // Move the highlighted point to the top
            if (selectedPoint != null) {
                d3.select(selectedPoint).raise();
            }

            if (minDistance <= 5) {
                d3.select(nearest).classed("highlight", true).attr("r", 5); // Highlight the nearest point

                tooltip.style("opacity", 1)
                    .html(d3.select(nearest).datum().properties.name)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            } else {
                tooltip.style("opacity", 0);
            }
        });

        let selectedPoint = null;
        points.on("click", function (event, d) {
            let element = d3.select(this);
            if (selectedPoint !== this) {
                points.classed("selected", false); // Deselect all points
                element.classed("selected", true); // Select this point
                selectedPoint = this; // Update the selected point
                element.raise(); // Bring to front
                renderParallelCoordinatesPlot(d3.select(selectedPoint).attr("data-name"));
                renderBubbleChart(d3.select(selectedPoint).attr("data-name"));
                renderClusterChart(d3.select(selectedPoint).attr("data-name"));
            } else {
                element.classed("selected", false); // Toggle selection off
                selectedPoint = null; // Clear selection
                renderParallelCoordinatesPlot();
                renderBubbleChart();
                renderClusterChart();
            }
        });
        // Hide tooltip on mouse leave
        svgObservatoryMap.on("mouseleave", function () {
            tooltip.style("opacity", 0);
            points.classed("highlight", false); // Remove highlight
        });

    });

    // Function to calculate distance
    function distance(a, b) {
        return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
    }
}

function renderParallelCoordinatesPlot(selectedObservatoryName, selectedPlanet) {
    d3.select("#parallel-coordinates-plot-container").selectAll("*").remove();
    const svgParallelCoordinatesPlot = d3.select("#parallel-coordinates-plot-container").append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    const width = svgParallelCoordinatesPlot.node().getBoundingClientRect().width;
    const height = svgParallelCoordinatesPlot.node().getBoundingClientRect().height;
    const margin = { top: 30, right: 10, bottom: 10, left: 10 },
        innerWidth = width - margin.left - margin.right,
        innerHeight = height - margin.top - margin.bottom;

    const x = d3.scalePoint().range([0, innerWidth]).padding(1),
        y = {};

    d3.json('/data/parallelCoordinatesPlot/' + selectedObservatoryName).then(data => {
        let dimensions = Object.keys(data[0]).filter(d => d !== "hostname" && d !== "pl_name")
        .map(d => {
          const extent = d3.extent(data, p => +p[d]);
          const padding = (extent[1] - extent[0]) * 0.05; 
          y[d] = d3.scaleLinear()
            .domain([extent[0] - padding, extent[1] + padding]) 
            .range([innerHeight, 0])
          return d;
      });
      
            
        dimensions = ["st_met","st_logg","pl_orbsmax","pl_orbeccen","pl_insol"];
        x.domain(dimensions);

        const drag = d3.drag()
            .subject(function (d) { return { x: x(d) }; })
            .on("drag", function (event, d) {
                x.range([0, innerWidth]);
                x.domain(dimensions.sort(function (a, b) {
                    return event.x - x(b);
                }));
                dimensions.forEach(function (p) {
                    d3.select(this).attr("transform", "translate(" + x(p) + ")");
                });
                svgParallelCoordinatesPlot.selectAll(".foreground path").attr("d", path);
                svgParallelCoordinatesPlot.selectAll(".background path").attr("d", path);
            });

        // Define a linear gradient for the shiny effect
        const gradient = svgParallelCoordinatesPlot.append("defs")
            .append("linearGradient")
            .attr("id", "shinyGradient")
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "0%");
        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#fff");  // Start with white for the shine
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#1a75ff");  // End with a nice blue

        // Define the filter for the glow effect
        const filter = svgParallelCoordinatesPlot.append("defs")
            .append("filter")
            .attr("id", "glowEffect");
        filter.append("feGaussianBlur")
            .attr("stdDeviation", "2.5")
            .attr("result", "coloredBlur");

        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode")
            .attr("in", "coloredBlur");
        feMerge.append("feMergeNode")
            .attr("in", "SourceGraphic");


        svgParallelCoordinatesPlot.append("g")
            .attr("class", "background")
            .selectAll("path")
            .data(data)
            .enter().append("path")
            .attr("d", path);


        svgParallelCoordinatesPlot.append("g")
            .attr("class", "foreground")
            .selectAll("path")
            .data(data)
            .enter().append("path")
            .attr("d", path)
            .attr("class", d => {
                return d.pl_name === selectedPlanet ? "selected" : "";
            })
            .each(function(d) {  // Check each path after appending it
                if (d.pl_name === selectedPlanet) {
                    this.parentNode.appendChild(this);  // Move the selected path to the end of its parent
                }
            })
            .attr("stroke", d => d.pl_name === selectedPlanet ? "url(#shinyGradient)" : "")  // Apply gradient if selected
            .style("filter", d => d.pl_name === selectedPlanet && data.length > 1 ? "url(#glowEffect)" : "") // Apply glow if selected

            .attr("title", d => d.hostname) // Set the title attribute to display hostname as tooltip
            .on("mouseover", function (event, d) {
                const tooltip = d3.select(".tooltip");
                tooltip.html(
                    `<h3>${d.pl_name}</h3>
                    <b>Stellar Metallicity: </b> ${d.st_met} <i>dex</i><br>
                    <b>Stellar Surface Gravity: </b> ${d.st_logg} <i>log<sub>10</sub> (cm/s<sup>2</sup>)</i><br>
                    <b>Eccentricity: </b> ${d.pl_orbeccen}<br>
                    <b>Orbit Semi-Major Axis</b>: ${d.pl_orbsmax} <i>au</i><br>
                    <b>Insolation Flux</b>: ${d.pl_insol} <i>Earth Flux</i>`
                )
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px")
                    .style("opacity", 1);
            })
            .on("mouseout", function () {
                d3.select(".tooltip").style("opacity", 0);
            });





        const labels = svgParallelCoordinatesPlot.selectAll(".column-label")
            .data(dimensions)
            .enter().append("text")
            .style("font-size", "0.8em")
            .style("fill", "#ffffff")
            .attr("transform", "rotate(-90)")
            .attr("class", "column-label")
            .attr("y", d => 20 + x(d))
            .attr("text-anchor", "top")
            .text(d => {
                switch (d) {
                    case 'st_met':
                        return 'Stellar Metallicity';
                    case 'st_logg':
                        return 'Stellar Surface Gravity';
                    case 'pl_orbeccen':
                        return 'Eccentricity';
                    case 'pl_orbsmax':
                        return 'Orbit Semi-Major Axis';
                    case 'pl_insol':
                        return 'Insolation Flux';
                    default:
                        return d.replace(/_/g, " ")
                }
            });
                        
        labels.each(function(){
            d3.select(this)
                .attr("x", -(this.getComputedTextLength()))
        })
                        
        const g = svgParallelCoordinatesPlot.selectAll(".dimension")
        .data(dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", d => "translate(" + x(d) + ")")
            .call(drag);

        g.append("g")
            .attr("class", "axis")
            .each(function (d) { d3.select(this).call(d3.axisLeft(y[d])); })
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text(d => d);

        g.selectAll(".axis text")
            .style("cursor", "move")
            .on("drag", drag);


        // Draw the lines
        function path(d) {
            return d3.line()(dimensions.map(function (p) { return [x(p), y[p](d[p])]; }));
        }
    });



}

function renderBubbleChart(selectedObservatoryName, selectedPlanet) {

    d3.select("#bubble-chart-container").selectAll("*").remove();


    const margin = { top: 20, right: 20, bottom: 50, left: 50 };
    // append the svg object to the body of the page
    const svg = d3.select("#bubble-chart-container")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    const height = svg.node().getBoundingClientRect().height - margin.top - margin.bottom;
    const width = svg.node().getBoundingClientRect().width - margin.left - margin.right;

    d3.json('/data/bubbleChart/' + selectedObservatoryName).then(data => {

        // Create scales
        const marginX = (d3.max(data, d => d.sy_dist)) * 100/ width;
        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.sy_dist) + marginX])
            .range([0, width]);

        const marginY = (d3.max(data, d => d.pl_bmasse)) * 100 / height;
        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.pl_bmasse) + marginY])
            .range([height, 0]);

        const radius = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.pl_rade)])
            .range([2, 50]);

        const tooltip = d3.select(".tooltip");
        // -2- Create 3 functions to show / update (when mouse move but stay on same circle) / hide the tooltip
        var showTooltip = function (d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(
                `<h3>${d.srcElement.__data__.pl_name}</h3>
                    <b>Planet Mass</b>: ${d.srcElement.__data__.pl_bmasse} <i>M<sub>earth</sub></i><br>
                    <b>Distance from Earth</b>: ${d.srcElement.__data__.sy_dist} <i>pc</i><br>
                    <b>Planet Radius</b>: ${d.srcElement.__data__.pl_rade} <i>R<sub>earth</sub></i><br>`
            )
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px");
        }
        var moveTooltip = function (d) {
            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px")
        }
        var hideTooltip = function (d) {
            tooltip.transition()
                .style("opacity", 0);
        }

        // Add X axis
        svg.append("g")
            .attr("transform", `translate(${margin.left},${height})`)
            .call(d3.axisBottom(x));

        // Add Y axis
        svg.append("g")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(y));

        const dataSorted = data.sort((a, b) => b.pl_rade - a.pl_rade);
        console.log(dataSorted);
        // Add bubbles
        let selectedPoint = null;
        svg.selectAll("circle")
            .data(dataSorted)
            .enter()
            .append("circle")
            .attr("class", d => {
                return d.pl_name === selectedPlanet ? "selected bubbles" : "bubbles";
            })
            .attr("cx", d => x(d.sy_dist))
            .attr("cy", d => y(d.pl_bmasse))
            .attr("r", d => radius(d.pl_rade))
            .attr("transform", `translate(${margin.left}, 0)`)
            .on("click", function (event, d) {

                d3.selectAll(".bubbles").classed("selected", false);

                let element = d3.select(this);
                if (selectedPoint !== this) {
                    element.classed("selected", true);
                    selectedPoint = this; // Update the selected point
                    renderParallelCoordinatesPlot(selectedObservatoryName, d.pl_name);
                    renderClusterChart(selectedObservatoryName,d.pl_name);
                } else {
                    element.classed("selected", false); // Toggle selection off
                    selectedPoint = null; // Clear selection
                    renderParallelCoordinatesPlot(selectedObservatoryName);
                    renderClusterChart(selectedObservatoryName);
                }
            })
            .on("mouseover", showTooltip)
            .on("mousemove", moveTooltip)
            .on("mouseleave", hideTooltip);



        // Add X axis label
        svg.append("text")
            .style("font-size", "0.8em")
            .style("fill", "#ffffff")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + margin.top + 10)
            .text("Exoplanet's distance from Earth");

        // Add Y axis label
        svg.append("text")
            .style("font-size", "0.8em")
            .style("fill", "#ffffff")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", margin.left - 40)
            .text("Mass of exoplanet's relative to Earth’s Mass");

    });


}

function renderClusterChart(selectedObservatoryName, selectedPlanet) {

    d3.select("#dbscan-chart-container").selectAll("*").remove();


    const dbscanChart = d3.select("#dbscan-chart-container");
    const svgDbscanChart = dbscanChart.append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    const margin = { top: 20, right: 20, bottom: 50, left: 50 };
    const svgWidth = svgDbscanChart.node().getBoundingClientRect().width;
    const svgHeight = svgDbscanChart.node().getBoundingClientRect().height;

    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    d3.json(`/data/dbscanChart/${selectedObservatoryName}`).then(data => {


        const clusters = data.map(d => {
            if (d.distance_from_earth < 1000) return { ...d, cluster: 'Very Close' };
            else if (d.distance_from_earth < 2000) return { ...d, cluster: 'Close' };
            else if (d.distance_from_earth < 3000) return { ...d, cluster: 'Moderate' };
            else return { ...d, cluster: 'Far' };
        });

        const color = d3.scaleOrdinal()
            .domain(["Very Close", "Close", "Moderate", "Far"])
            .range(["green", "blue", "orange", "red"]);


        // Create scales
        const marginX = d3.max(clusters, d => d.pl_bmasse) * 100 / width;
        const x = d3.scaleLinear()
            .domain([0, d3.max(clusters, d => d.pl_bmasse) + marginX])
            .range([0, width]);        
    

        svgDbscanChart.append("g")
            .attr("transform", `translate(${margin.left},${height})`)
            .call(d3.axisBottom(x))
            .append("text")
            .attr("x", width / 2)
            .attr("y", margin.bottom - 20)
            .style("text-anchor", "middle")
            .text("Planet Mass (Earth Masses)");


        const marginY = d3.max(clusters, d => d.distance_from_earth) * 100 / height;
        const y = d3.scaleLinear()
        .domain([0, d3.max(clusters, d => d.distance_from_earth) + marginY])
        .range([height, 0]);

        svgDbscanChart.append("g")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(y))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 10)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .text("Vector Distance from Earth");

        let selectedPoint = null;

        svgDbscanChart.append('g')
            .attr("transform", `translate(${margin.left},${0})`)
            .selectAll("dot")
            .data(clusters)
            .join("circle")
            .attr("class", d => {
                return d.pl_name === selectedPlanet ? "selected dot" : "dot";
            })
            .attr("cx", d => x(d.pl_bmasse))
            .attr("cy", d => y(d.distance_from_earth))
            .attr("r", d => {
                return d.pl_name === selectedPlanet ? "10" : "5";
            })
            .style("fill", d => color(d.cluster))
            .on("mouseover", (event, d) => {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);
                tooltip.html(
                    `<h3>${d.pl_name}</h3>
                    <b>Mass:</b> ${d.pl_bmasse}<br>
                    <b>Cluster:</b> ${d.cluster} `)

                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mouseout", d => {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("click", function (event, d) {

                d3.selectAll(".dot").classed("selected", false);

                let element = d3.select(this);
                if (selectedPoint !== this) {
                    element.classed("selected", true);
                    selectedPoint = this; // Update the selected point
                    renderParallelCoordinatesPlot(selectedObservatoryName, d.pl_name);
                    renderBubbleChart(selectedObservatoryName, d.pl_name);
                } else {
                    element.classed("selected", false); // Toggle selection off
                    selectedPoint = null; // Clear selection
                    renderParallelCoordinatesPlot(selectedObservatoryName);
                    renderBubbleChart(selectedObservatoryName);
                }
            })
        
        const legend = svgDbscanChart.selectAll(".legend")
            .data(color.domain())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => "translate(0," + i * 20 + ")");
    
        legend.append("rect")
            .attr("x", width - margin.left)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", color);
    
        legend.append("text")
            .attr("x", width - - margin.left)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(d => d);

        const tooltip = d3.select(".tooltip");
        

        

        // const xScale = d3.scaleLinear()
        //     .domain(d3.extent(data, d => d.pl_orbeccen))
        //     .range([0, width]);

        // const yScale = d3.scaleLinear()
        //     .domain(d3.extent(data, d => d.pl_insol))
        //     .range([height, 0]);

        // //'st_met', 'pl_orbper', 'pl_orbeccen', 'pl_bmasse', 'pl_insol'

        // const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        // const xAxis = d3.axisBottom(xScale).ticks(5);
        // const yAxis = d3.axisLeft(yScale).ticks(5);


        // g.selectAll("circle")
        //     .data(data)
        //     .enter().append("circle")
        //     .attr("cx", d => xScale(d.pl_orbeccen))
        //     .attr("cy", d => yScale(d.pl_insol))
        //     .attr("r", 5)
        //     .attr("fill", d => (d.cluster === -1 ? "gray" : colorScale(d.cluster)))
        //     .on("mouseover", function (event, d) {
        //         tooltip.transition()
        //             .duration(200)
        //             .style("opacity", .9);
        //         tooltip.html(`Cluster: ${d.cluster}<br>St Met: ${d.pl_orbeccen}<br>Pl Orbper: ${d.pl_insol}`)
        //             .style("left", (event.pageX + 10) + "px")
        //             .style("top", (event.pageY + 10) + "px");
        //     })
        //     .on("mouseout", function (d) {
        //         tooltip.transition()
        //             .style("opacity", 0);
        //     });



        // g.append("g")
        //     .attr("transform", `translate(0, ${height})`)
        //     .call(xAxis);
        // svgDbscanChart.append("text")
        //     .style("font-size", "0.8em")
        //     .style("fill", "#ffffff")
        //     .attr("text-anchor", "middle")
        //     .attr("x", width / 2)
        //     .attr("y", height + margin.top + 40)
        //     .text("Eccentricity");



        // g.append("g")
        //     .call(yAxis)

        // svgDbscanChart.append("text")
        //     .style("font-size", "0.8em")
        //     .style("fill", "#ffffff")
        //     .attr("text-anchor", "middle")
        //     .attr("transform", "rotate(-90)")
        //     .attr("x", -height / 2)
        //     .attr("y", margin.left - 40)
        //     .text("Insolation Flux");


        // g.append("g")
        //     .call(yAxis)


        // const tooltip = d3.select(".tooltip");
    });
}