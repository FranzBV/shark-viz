function renderSightingsOverTimeSharkbase({
  containerId = "#sightings-chart",
  dataPath = "sharkbase.csv",
  width = 650,
  height = 400
} = {}) {

  const margin = { top: 50, right: 150, bottom: 50, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const container = d3.select(containerId);
  container.selectAll("*").remove();

  container.style("background", "#ffffff")
           .style("padding", "20px")
           .style("border-radius", "10px")
           .style("box-shadow", "0 0 10px rgba(0,0,0,0.1)")
           .style("width", `${width}px`);

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltip = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("padding", "6px 10px")
    .style("border-radius", "6px")
    .style("background", "#333")
    .style("color", "#fff")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  d3.dsv("\t", dataPath).then(data => {
    const parsed = data.map(d => {
      let year = null;
      if (d.eventDate && /^\d{4}/.test(d.eventDate)) {
        year = +d.eventDate.slice(0, 4);
      }
      if (!year) return null;

      const country =
        (d.country && d.country.trim()) ||
        (d.stateProvince && d.stateProvince.trim()) ||
        "Other regions";

      return { year, country };
    }).filter(d => d !== null);

    const totals = d3.rollup(parsed, v => v.length, d => d.country);
    const sorted = Array.from(totals, ([c, t]) => ({ country: c, total: t }))
      .sort((a, b) => b.total - a.total);

    const TOP_N = 5;
    const keep = new Set(sorted.slice(0, TOP_N).map(d => d.country));

    const grouped = d3.group(parsed, d => keep.has(d.country) ? d.country : "Other regions");

    const countrySeries = Array.from(grouped, ([country, records]) => {
      const byYear = d3.rollup(records, v => v.length, d => d.year);
      const series = Array.from(byYear, ([year, count]) => ({ year, count }))
        .sort((a, b) => a.year - b.year);
      return { country, series };
    });

    const years = d3.extent(parsed, d => d.year);
    const maxCount = d3.max(countrySeries, d => d3.max(d.series, s => s.count));

    // Scales
    const x = d3.scaleLinear().domain(years).range([0, innerWidth]);
    const y = d3.scaleLinear().domain([0, maxCount]).nice().range([innerHeight, 0]);

    chart.append("g")
      .attr("class", "grid")
      .call(
        d3.axisLeft(y)
          .tickSize(-innerWidth)
          .tickFormat("")
      )
      .selectAll("line")
      .attr("stroke", "#e6e6e6");

    // Axes
    chart.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")))
      .selectAll("text")
      .style("fill", "#333");

    chart.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("fill", "#333");

    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    const color = d3.scaleOrdinal(d3.schemeTableau10)
      .domain(countrySeries.map(d => d.country));

    chart.selectAll(".line")
      .data(countrySeries)
      .enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke-width", 2.5)
      .attr("stroke", d => color(d.country))
      .attr("d", d => line(d.series));

    countrySeries.forEach(seriesObj => {
      chart.selectAll(".dot")
        .data(seriesObj.series)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.count))
        .attr("r", 3)
        .attr("fill", color(seriesObj.country))
        .on("mouseover", function (event, d) {
          tooltip.style("opacity", 1)
            .html(`<strong>${seriesObj.country}</strong><br>Year: ${d.year}<br>Sightings: ${d.count}`);
        })
        .on("mousemove", e => {
          tooltip.style("left", e.pageX + 12 + "px").style("top", e.pageY - 20 + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));
    });

    svg.append("text")
      .attr("x", margin.left)
      .attr("y", 25)
      .style("font-size", "18px")
      .style("fill", "#222")
      .style("font-weight", "600")
      .text("Shark Sightings Over Time");

    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

    countrySeries.forEach((d, i) => {
      const row = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      row.append("circle")
        .attr("r", 5)
        .attr("fill", color(d.country));

      row.append("text")
        .attr("x", 12)
        .attr("y", 4)
        .style("fill", "#333")
        .style("font-size", "12px")
        .text(d.country);
    });
  });
}
