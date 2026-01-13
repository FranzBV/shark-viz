window.addEventListener("DOMContentLoaded", function () {
  const width = 800;
  const height = 520;
  const innerRadius = 120;
  const outerRadius = 220;

  const parseDate = d3.timeParse("%Y-%m-%d");

  const container = d3.select("#vis6-container");
  if (container.empty()) return;

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const chartGroup = svg
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const barGroup = chartGroup.append("g");

  const tooltip = d3.select("#vis6-tooltip");
  tooltip
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("display", "none")
    .style("background", "rgba(3, 8, 20, 0.92)")
    .style("color", "#ffffff")
    .style("padding", "6px 10px")
    .style("border-radius", "6px")
    .style("font-size", "11px");

  function shorten(text, maxLen) {
    if (!text) return "";
    return text.length > maxLen ? text.slice(0, maxLen - 1) + "…" : text;
  }

  d3.csv("data/SharkIncidents Cleaned.csv", d => {
    const date = parseDate(d.Date);
    return {
      year: date ? date.getFullYear() : null,
      mode: d.Mode?.trim() || "Unknown",
      injury: d.Injury?.trim().toLowerCase() || "none",
      fatal: d.Fatal?.trim().toLowerCase() || "no"
    };
  }).then(raw => {
    const data = raw.filter(d => d.mode);

    const validYears = data.map(d => d.year).filter(y => y != null);
    const minYear = d3.min(validYears);
    const maxYear = d3.max(validYears);

    const severityScore = d =>
      d.fatal === "yes"
        ? 3
        : d.injury === "fatal"
        ? 3
        : d.injury === "major"
        ? 2
        : d.injury === "minor"
        ? 1.5
        : 1;

    const grouped = d3.rollup(
      data,
      v => ({
        count: v.length,
        avgSeverity: d3.mean(v, severityScore)
      }),
      d => d.mode
    );

    const aggregated = Array.from(grouped, ([mode, stats]) => ({
      mode,
      count: stats.count,
      avgSeverity: stats.avgSeverity
    })).sort((a, b) => b.count - a.count);

    const maxCount = d3.max(aggregated, d => d.count) || 1;

    const angleScale = d3
      .scaleBand()
      .domain(aggregated.map(d => d.mode))
      .range([0, 2 * Math.PI])
      .align(0);

    const radiusScale = d3
      .scaleLinear()
      .domain([0, maxCount])
      .range([innerRadius, outerRadius]);

    const oceanColors = [
      "#b7f0ff",
      "#6ad5ff",
      "#2ba9ff",
      "#1473d1",
      "#0b447f"
    ];
    const oceanInterp = t => {
      const idx = t * (oceanColors.length - 1);
      const low = Math.floor(idx);
      const high = Math.ceil(idx);
      const frac = idx - low;
      return d3.interpolateRgb(oceanColors[low], oceanColors[high])(frac);
    };

    const colorScale = d3
      .scaleSequential()
      .domain([1, 3])
      .interpolator(oceanInterp);

    const arc = d3
      .arc()
      .innerRadius(innerRadius)
      .cornerRadius(10)
      .padAngle(0.04);

    const barPath = (d, scale = 1) =>
      arc({
        startAngle: angleScale(d.mode),
        endAngle: angleScale(d.mode) + angleScale.bandwidth(),
        outerRadius: radiusScale(d.count) * scale
      });

    chartGroup
      .append("circle")
      .attr("r", innerRadius - 15)
      .attr("fill", "#f5f8ff")
      .attr("opacity", 0.95);

    chartGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.5em")
      .style("fill", "#102a56")
      .style("font-size", "18px")
      .style("font-weight", "700")
      .text("California Shark Incidents");

    chartGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.9em")
      .style("fill", "#4a5b8f")
      .style("font-size", "11px")
      .text(`Incidents by mode · ${minYear}-${maxYear}`);

    const centerLine1 = chartGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "2.4em")
      .style("fill", "#7a86b5")
      .style("font-size", "11px")
      .text("Hover over a segment");

    const centerLine2 = chartGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "3.8em")
      .style("fill", "#7a86b5")
      .style("font-size", "11px")
      .text("to see details");

    const bars = barGroup
      .selectAll("path")
      .data(aggregated)
      .join("path")
      .attr("fill", d => colorScale(d.avgSeverity))
      .attr("stroke", "#0b2145")
      .attr("stroke-width", 0.8)
      .attr("d", d => barPath(d, 1));

    bars
      .on("mousemove", (event, d) => {
        const [x, y] = d3.pointer(event, document.body);

        bars
          .transition()
          .duration(120)
          .style("opacity", b => (b.mode === d.mode ? 1 : 0.3))
          .attr("d", b =>
            b.mode === d.mode ? barPath(b, 1.06) : barPath(b, 1)
          );

        centerLine1.text(shorten(d.mode, 18));
        centerLine2.text(`${d.count} incidents`);

        tooltip
          .style("left", x + 14 + "px")
          .style("top", y + 14 + "px")
          .style("display", "block")
          .html(
            `<strong>${d.mode}</strong><br/>
             Incidents: ${d.count}<br/>
             Avg severity: ${d.avgSeverity.toFixed(2)}`
          );
      })
      .on("mouseout", () => {
        bars
          .transition()
          .duration(140)
          .style("opacity", 1)
          .attr("d", d => barPath(d, 1));

        centerLine1.text("Hover over a segment");
        centerLine2.text("to see details");
        tooltip.style("display", "none");
      });
  });
});
