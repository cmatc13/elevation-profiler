import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const InteractiveTourProfile = ({ elevationData }) => {
    const svgRef = useRef();
    const [zoomedSection, setZoomedSection] = useState(null);
    const [hoveredPoint, setHoveredPoint] = useState(null);

    useEffect(() => {
        if (!elevationData || !elevationData.profile_data || !Array.isArray(elevationData.profile_data) || elevationData.profile_data.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

        // Dimensions and margins
        const margin = { top: 60, right: 120, bottom: 80, left: 80 };
        const width = 1200 - margin.left - margin.right;
        const height = 500 - margin.bottom - margin.top;

        // Create main SVG group
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Parse data
        const data = elevationData.profile_data.map((d, i) => ({
            distance: d.distance,
            elevation: d.elevation,
            gradient: d.gradient || 0,
            index: i
        }));

        // Scales
        const xScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.distance))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.elevation))
            .range([height, 0]);

        // Create gradient definitions for 3D effect
        const defs = svg.append("defs");
        
        // Yellow gradient for main profile
        const yellowGradient = defs.append("linearGradient")
            .attr("id", "yellowGradient")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", 0).attr("y1", height)
            .attr("x2", 0).attr("y2", 0);
        
        yellowGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#FFD700")
            .attr("stop-opacity", 1);
        
        yellowGradient.append("stop")
            .attr("offset", "70%")
            .attr("stop-color", "#FFED4E")
            .attr("stop-opacity", 0.8);
        
        yellowGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#FFFACD")
            .attr("stop-opacity", 0.6);

        // Green gradient for gentle sections
        const greenGradient = defs.append("linearGradient")
            .attr("id", "greenGradient")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", 0).attr("y1", height)
            .attr("x2", 0).attr("y2", 0);
        
        greenGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#32CD32")
            .attr("stop-opacity", 1);
        
        greenGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#90EE90")
            .attr("stop-opacity", 0.6);

        // Line generator
        const line = d3.line()
            .x(d => xScale(d.distance))
            .y(d => yScale(d.elevation))
            .curve(d3.curveCardinal);

        // Area generator for main profile
        const area = d3.area()
            .x(d => xScale(d.distance))
            .y0(height)
            .y1(d => yScale(d.elevation))
            .curve(d3.curveCardinal);

        // Create gradient sections based on elevation profile
        const sections = [];
        for (let i = 0; i < data.length - 1; i++) {
            const gradient = Math.abs(data[i].gradient);
            let color;
            if (gradient > 8) color = '#FF4444';
            else if (gradient > 5) color = '#FF8844';
            else if (gradient > 3) color = '#FFAA44';
            else color = '#44AA44';
            
            sections.push({
                data: [data[i], data[i + 1]],
                color: color,
                gradient: gradient
            });
        }

        // Draw gradient sections
        sections.forEach((section, i) => {
            const sectionArea = d3.area()
                .x(d => xScale(d.distance))
                .y0(height)
                .y1(d => yScale(d.elevation))
                .curve(d3.curveCardinal);

            g.append("path")
                .datum(section.data)
                .attr("fill", section.color)
                .attr("fill-opacity", 0.7)
                .attr("d", sectionArea);
        });

        // Main elevation profile with 3D effect
        g.append("path")
            .datum(data)
            .attr("fill", "url(#yellowGradient)")
            .attr("fill-opacity", 0.8)
            .attr("d", area);

        // Top line with shadow effect
        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#B8860B")
            .attr("stroke-width", 3)
            .attr("d", line);

        // Add shadow line for 3D effect
        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#8B7355")
            .attr("stroke-width", 2)
            .attr("stroke-opacity", 0.5)
            .attr("transform", "translate(2,2)")
            .attr("d", line);

        // X-axis with distance markers
        const xAxis = d3.axisBottom(xScale)
            .tickSize(-height)
            .tickFormat(d => `${d}km`);

        g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis)
            .selectAll("text")
            .style("font-size", "12px")
            .style("font-weight", "bold");

        // Y-axis
        const yAxis = d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat(d => `${d}m`);

        g.append("g")
            .attr("class", "y-axis")
            .call(yAxis)
            .selectAll("text")
            .style("font-size", "12px");

        // Style grid lines
        g.selectAll(".x-axis .tick line, .y-axis .tick line")
            .style("stroke", "#ddd")
            .style("stroke-dasharray", "2,2");

        // Add distance markers at bottom (Tour de France style)
        const maxDistance = d3.max(data, d => d.distance);
        for (let km = 0; km <= maxDistance; km += 5) {
            const x = xScale(km);
            
            // Bottom marker
            g.append("rect")
                .attr("x", x - 15)
                .attr("y", height + 10)
                .attr("width", 30)
                .attr("height", 20)
                .attr("fill", "#333")
                .attr("rx", 3);

            g.append("text")
                .attr("x", x)
                .attr("y", height + 25)
                .attr("text-anchor", "middle")
                .attr("fill", "white")
                .attr("font-size", "12px")
                .attr("font-weight", "bold")
                .text(Math.round(maxDistance - km));
        }

        // Add climb detection and mountain symbols
        const climbs = detectClimbs(data);
        climbs.forEach(climb => {
            const x = xScale(climb.startDistance + (climb.endDistance - climb.startDistance) / 2);
            const y = yScale(climb.maxElevation) - 30;

            // Mountain triangle symbol
            g.append("path")
                .attr("d", `M ${x} ${y} L ${x-8} ${y+15} L ${x+8} ${y+15} Z`)
                .attr("fill", "#8B4513")
                .attr("stroke", "#654321")
                .attr("stroke-width", 1);

            // Climb category
            const category = getClimbCategory(climb.elevationGain, climb.distance);
            g.append("text")
                .attr("x", x)
                .attr("y", y - 5)
                .attr("text-anchor", "middle")
                .attr("font-size", "10px")
                .attr("font-weight", "bold")
                .attr("fill", "#8B4513")
                .text(category);

            // Climb stats
            g.append("text")
                .attr("x", x)
                .attr("y", y + 30)
                .attr("text-anchor", "middle")
                .attr("font-size", "9px")
                .attr("fill", "#333")
                .text(`${climb.distance.toFixed(1)}km at ${climb.avgGradient.toFixed(1)}%`);
        });

        // Add stage information box (top right)
        const infoBox = g.append("g")
            .attr("transform", `translate(${width - 100}, 10)`);

        infoBox.append("rect")
            .attr("width", 90)
            .attr("height", 80)
            .attr("fill", "white")
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1)
            .attr("rx", 5);

        infoBox.append("text")
            .attr("x", 45)
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("font-weight", "bold")
            .text(`${elevationData.statistics.max_elevation}m`);

        infoBox.append("text")
            .attr("x", 45)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .attr("font-size", "8px")
            .text("ELEVATION");

        // Elevation scale
        const scaleHeight = 50;
        const scaleY = 35;
        for (let i = 0; i <= 5; i++) {
            const y = scaleY + (i * scaleHeight / 5);
            const elevation = elevationData.statistics.max_elevation * (1 - i / 5);
            
            infoBox.append("line")
                .attr("x1", 10)
                .attr("x2", 80)
                .attr("y1", y)
                .attr("y2", y)
                .attr("stroke", "#ddd");

            infoBox.append("text")
                .attr("x", 5)
                .attr("y", y + 3)
                .attr("font-size", "7px")
                .attr("text-anchor", "end")
                .text(`${Math.round(elevation)}m`);
        }

        // Disable zoom for now to prevent errors - will add back later
        // const zoom = d3.zoom()
        //     .scaleExtent([1, 10])
        //     .on("zoom", (event) => {
        //         // Zoom functionality disabled temporarily
        //     });
        // svg.call(zoom);

        // Add hover functionality
        const overlay = g.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .on("mousemove", function(event) {
                const [mouseX] = d3.pointer(event);
                const distance = xScale.invert(mouseX);
                
                // Find closest data point
                const bisect = d3.bisector(d => d.distance).left;
                const index = bisect(data, distance);
                const d0 = data[index - 1];
                const d1 = data[index];
                const d = distance - (d0?.distance || 0) > (d1?.distance || Infinity) - distance ? d1 : d0;
                
                if (d) {
                    setHoveredPoint({
                        distance: d.distance,
                        elevation: d.elevation,
                        gradient: d.gradient,
                        x: mouseX,
                        y: yScale(d.elevation)
                    });
                }
            })
            .on("mouseleave", () => {
                setHoveredPoint(null);
            });

    }, [elevationData]);

    // Helper functions
    const detectClimbs = (data) => {
        const climbs = [];
        let currentClimb = null;
        
        for (let i = 1; i < data.length; i++) {
            const gradient = data[i].gradient;
            
            if (gradient > 3 && !currentClimb) {
                // Start of climb
                currentClimb = {
                    startDistance: data[i-1].distance,
                    startElevation: data[i-1].elevation,
                    maxElevation: data[i].elevation,
                    endDistance: data[i].distance,
                    endElevation: data[i].elevation
                };
            } else if (currentClimb && gradient > 1) {
                // Continue climb
                currentClimb.endDistance = data[i].distance;
                currentClimb.endElevation = data[i].elevation;
                currentClimb.maxElevation = Math.max(currentClimb.maxElevation, data[i].elevation);
            } else if (currentClimb && gradient <= 1) {
                // End of climb
                currentClimb.distance = currentClimb.endDistance - currentClimb.startDistance;
                currentClimb.elevationGain = currentClimb.maxElevation - currentClimb.startElevation;
                currentClimb.avgGradient = (currentClimb.elevationGain / (currentClimb.distance * 1000)) * 100;
                
                if (currentClimb.distance > 0.5 && currentClimb.elevationGain > 30) {
                    climbs.push(currentClimb);
                }
                currentClimb = null;
            }
        }
        
        return climbs;
    };

    const getClimbCategory = (elevationGain, distance) => {
        const score = elevationGain * distance;
        if (score > 80000) return "HC";
        if (score > 32000) return "1";
        if (score > 16000) return "2";
        if (score > 8000) return "3";
        return "4";
    };

    return (
        <div className="position-relative">
            <svg
                ref={svgRef}
                width="1200"
                height="580"
                style={{ background: '#f8f9fa', border: '1px solid #ddd' }}
            />
            
            {hoveredPoint && (
                <div
                    className="position-absolute bg-dark text-white p-2 rounded shadow"
                    style={{
                        left: hoveredPoint.x + 80,
                        top: hoveredPoint.y + 60,
                        fontSize: '12px',
                        pointerEvents: 'none',
                        zIndex: 1000
                    }}
                >
                    <div>Distance: {hoveredPoint.distance.toFixed(1)} km</div>
                    <div>Elevation: {hoveredPoint.elevation.toFixed(0)} m</div>
                    <div>Gradient: {hoveredPoint.gradient.toFixed(1)}%</div>
                </div>
            )}
            
            <div className="mt-2 text-center">
                <small className="text-muted">
                    <strong>Interactive Features:</strong> Hover for details • Mountain symbols show climb categories • Zoom coming soon
                </small>
            </div>
        </div>
    );
};

export default InteractiveTourProfile;
