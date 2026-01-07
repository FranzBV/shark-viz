const mortalityDataPath = 'data/total_mortality_estimate_eez.csv';
const regulationDataPath = 'data/eez_predictors_annual.csv';

let mortalityData, regulationData;

function cleanMortalityData(data) {
    return data.map(d => ({
        ...d,
        year: +d.year,
        total_catch: +d.total_catch,
        total_mortality: +d.total_mortality
    }));
}

function cleanRegulationData(data) {
    return data.map(d => ({
        eez_name: d.eez_name,
        year: +d.year,
        ss: +d.ss, fna: +d.fna, fcr: +d.fcr,
        faa: +d.faa, sfp: +d.sfp, fru: +d.fru, mpa: +d.mpa,
        annual_effort_kwh: +d.annual_effort_kwh,
        annual_catch_mt: +d.annual_catch_mt,
        wb_index: +d.wb_index
    }));
}

function loadMortalityData() {
    Promise.all([
        d3.csv(mortalityDataPath),
        d3.csv(regulationDataPath)
    ]).then(([mRaw, rRaw]) => {
        mortalityData = cleanMortalityData(mRaw);
        regulationData = cleanRegulationData(rRaw);
        buildMortalityViz(mortalityData, regulationData);
    }).catch(err => console.error('Error loading mortality data:', err));
}

function buildMortalityViz(mData, rData) {
    const regsByYear = d3.rollup(
        rData,
        v => ({
            year: v[0].year,
            shark_sanctuaries: d3.sum(v, d => d.ss),
            fishing_bans: d3.sum(v, d => d.sfp),
            mpas: d3.sum(v, d => d.mpa),
            fins_attached: d3.sum(v, d => d.fna),
            fin_ratio: d3.sum(v, d => d.fcr),
            other_finning: d3.sum(v, d => d.fru)
        }),
        d => d.year
    );

    const mortByYear = d3.rollup(mData, v => d3.sum(v, d => d.total_mortality), d => d.year);
    const regs = Array.from(regsByYear.values()).sort((a,b) => a.year - b.year);
    const mort = Array.from(mortByYear, ([year, mortality]) => ({year, mortality})).sort((a,b) => a.year - b.year);

    const margin = {top: 50, right: 90, bottom: 50, left: 90};
    const w = 850 - margin.left - margin.right;
    const h = 500 - margin.top - margin.bottom;

    const rCol = {
        other_finning: '#6495ED',
        fin_ratio: '#5F9EA0',
        fins_attached: '#20B2AA',
        mpas: '#7B68EE',
        fishing_bans: '#50C878',
        shark_sanctuaries: '#4A90E2'
    };
    const mCol = '#FF4444';

    d3.select('#GlobalMortChart').selectAll('*').remove();

    const svg = d3.select('#GlobalMortChart')
        .append('svg')
        .attr('width', w + margin.left + margin.right)
        .attr('height', h + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([2012, 2019]).range([0, w]);
    const maxR = d3.max(regs, d => d.shark_sanctuaries + d.fishing_bans + d.mpas + d.fins_attached + d.fin_ratio + d.other_finning);
    const yL = d3.scaleLinear().domain([0, maxR * 1.1]).range([h, 0]);
    const maxM = d3.max(mort, d => d.mortality);
    const minM = d3.min(mort, d => d.mortality);
    const yR = d3.scaleLinear().domain([minM * 0.95, maxM * 1.05]).range([h, 0]);

    const xAxis = d3.axisBottom(x).tickFormat(d3.format('d')).ticks(8);
    const yAxisLeft = d3.axisLeft(yL);
    const yAxisRight = d3.axisRight(yR).tickFormat(d => `${(d/1e6).toFixed(0)}M`);

    svg.append('g').attr('class', 'grid').attr('opacity', 0.1).call(d3.axisLeft(yL).tickSize(-w).tickFormat(''));
    svg.append('g').attr('class', 'x-axis').attr('transform', `translate(0,${h})`).call(xAxis).selectAll('text').style('fill', '#a0b9c8').style('font-size', '12px');
    svg.selectAll('.x-axis path, .x-axis line').style('stroke', '#a0b9c8');
    svg.append('g').attr('class', 'y-axis-left').call(yAxisLeft).selectAll('text').style('fill', '#4A90E2').style('font-size', '12px');
    svg.selectAll('.y-axis-left path, .y-axis-left line').style('stroke', '#4A90E2');
    svg.append('g').attr('class', 'y-axis-right').attr('transform', `translate(${w},0)`).call(yAxisRight).selectAll('text').style('fill', mCol).style('font-size', '12px');
    svg.selectAll('.y-axis-right path, .y-axis-right line').style('stroke', mCol);

    svg.append('text').attr('class', 'axis-label').attr('transform', 'rotate(-90)').attr('y', -70).attr('x', -h/2).attr('text-anchor', 'middle').style('fill', '#4A90E2').style('font-size', '14px').style('font-weight', 'bold').text('Number of Countries with Regulations');
    svg.append('text').attr('class', 'axis-label').attr('transform', 'rotate(-90)').attr('y', w + 70).attr('x', -h/2).attr('text-anchor', 'middle').style('fill', mCol).style('font-size', '14px').style('font-weight', 'bold').text('Shark Mortality (Millions)');
    svg.append('text').attr('class', 'axis-label').attr('x', w/2).attr('y', h + 38).attr('text-anchor', 'middle').style('fill', '#333').style('font-size', '14px').style('font-weight', 'bold').text('Year');

    const keys = ['other_finning', 'fin_ratio', 'fins_attached', 'mpas', 'fishing_bans', 'shark_sanctuaries'];
    const stack = d3.stack().keys(keys)(regs);
    const area = d3.area().x(d => x(d.data.year)).y0(d => yL(d[0])).y1(d => yL(d[1])).curve(d3.curveMonotoneX);
    const line = d3.line().x(d => x(d.year)).y(d => yR(d.mortality)).curve(d3.curveMonotoneX);

    svg.append('defs').append('clipPath').attr('id', 'clip').append('rect').attr('width', 0).attr('height', h);

    const layers = svg.selectAll('.reg-layer').data(stack).enter().append('g').attr('class', 'reg-layer');
    layers.append('path').attr('class', 'area').attr('d', area).style('fill', (d,i) => rCol[keys[i]]).style('opacity', 0.7).style('stroke', 'none').attr('clip-path', 'url(#clip)');

    const mLine = svg.append('path').datum(mort).attr('class', 'mortality-line').attr('d', line).style('fill', 'none').style('stroke', mCol).style('stroke-width', 4).style('stroke-linecap', 'round');
    const totalLength = mLine.node().getTotalLength();
    mLine.attr('stroke-dasharray', totalLength).attr('stroke-dashoffset', totalLength);

    const dots = svg.selectAll('.mortality-point').data(mort).enter().append('circle').attr('class', 'mortality-point').attr('cx', d => x(d.year)).attr('cy', d => yR(d.mortality)).attr('r', 0).style('fill', mCol).style('stroke', '#fff').style('stroke-width', 2);

    const tooltip = d3.select('body').select('.tooltip');
    let tooltipExists = !tooltip.empty();
    const tip = tooltipExists ? tooltip : d3.select('body').append('div').attr('class', 'tooltip').style('position', 'absolute').style('background', 'rgba(0, 0, 0, 0.9)').style('color', '#fff').style('padding', '12px').style('border-radius', '8px').style('pointer-events', 'none').style('opacity', 0).style('font-size', '0.9rem').style('z-index', '1000');

    svg.select('#clip rect').transition().duration(2000).ease(d3.easeCubicOut).attr('width', w).on('end', () => {
        mLine.transition().duration(1500).ease(d3.easeLinear).attr('stroke-dashoffset', 0);
        dots.transition().duration(300).delay((d,i) => 1500 * (i / mort.length)).attr('r', 6);
    });

    setTimeout(() => {
        const regLabels = { shark_sanctuaries: 'Shark Sanctuaries', fishing_bans: 'Shark Fishing Prohibitions', mpas: 'Marine Protected Areas', fins_attached: 'Fins Naturally Attached', fin_ratio: 'Fin-to-Carcass Ratio', other_finning: 'Finning Regulation (Unspecified)' };
        dots.on('mouseover', function(event, d) {
            d3.select(this).transition().duration(200).attr('r', 10);
            tip.style('opacity', 1).html(`<strong>Year: ${d.year}</strong><br/>Mortality: ${(d.mortality / 1e6).toFixed(1)}M sharks<br/><span style="color: #ff6b6b">Total deaths: ${d.mortality.toLocaleString()}</span>`).style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 30) + 'px');
        }).on('mouseout', function() {
            d3.select(this).transition().duration(200).attr('r', 6);
            tip.style('opacity', 0);
        });
        layers.selectAll('.area').on('mouseover', function(event, d) {
            const regulationType = keys[stack.indexOf(d)];
            d3.select(this).transition().duration(200).style('opacity', 0.9);
            tip.style('opacity', 1).html(`<strong>${regLabels[regulationType]}</strong>`).style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 30) + 'px');
        }).on('mouseout', function() {
            d3.select(this).transition().duration(200).style('opacity', 0.7);
            tip.style('opacity', 0);
        });
    }, 5000);
}

function createMortalityLegend(containerId) {
    const legendData = [
        { label: "Shark Sanctuaries", color: "#4A90E2" },
        { label: "Fishing Prohibitions", color: "#50C878" },
        { label: "Finning Regulations", color: "#7B68EE" },
        { label: "Marine Protected Areas", color: "#20B2AA" },
        { label: "Total Mortality", color: "#E74C3C", isLine: true }
    ];
    
    const legendContainer = d3.select(`#${containerId}`).append("div").attr("class", "legend").style("display", "flex").style("flex-wrap", "wrap").style("gap", "20px").style("margin-top", "30px").style("justify-content", "center");
    legendContainer.selectAll(".legend-item").data(legendData).enter().append("div").attr("class", "legend-item").style("display", "flex").style("align-items", "center").style("gap", "8px").style("color", "#333")
        .html(d => d.isLine ? `<svg width="30" height="4"><line x1="0" y1="2" x2="30" y2="2" stroke="${d.color}" stroke-width="3"/></svg><span style="color:#333">${d.label}</span>` : `<div style="width: 20px; height: 20px; background-color: ${d.color};"></div><span style="color:#333">${d.label}</span>`);
}

window.loadMortalityData = loadMortalityData;
window.createMortalityLegend = createMortalityLegend;
