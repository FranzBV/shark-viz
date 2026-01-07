const BODYMAP_DATA_BASE = 'data/';
const COASTAL_STATES = ['CA','FL','TX','NC','SC','GA','HI','OR','WA','NJ','NY','MA','ME','NH','RI','CT','DE','MD','VA','AL','MS','LA'];

const BODY_REGIONS = {
    head: { keywords: ['head','face','neck','skull','scalp','ear','nose','jaw','chin','cheek','forehead','temple'], color: '#EF4444', position: { x: 100, y: 35 }, name: 'Head & Neck' },
    torso: { keywords: ['chest','abdomen','stomach','torso','back','ribs','side','hip','pelvis','shoulder','body'], color: '#F97316', position: { x: 100, y: 120 }, name: 'Torso' },
    upperArm: { keywords: ['upper arm','bicep','tricep'], color: '#FBBF24', position: { x: 45, y: 110 }, name: 'Upper Arm' },
    lowerArm: { keywords: ['forearm','wrist','hand','finger','thumb','palm','knuckle','arm'], color: '#A3E635', position: { x: 35, y: 160 }, name: 'Arm & Hand' },
    upperLeg: { keywords: ['thigh','groin','buttock','upper leg','quadricep'], color: '#22D3EE', position: { x: 75, y: 230 }, name: 'Upper Leg' },
    lowerLeg: { keywords: ['knee','calf','shin','lower leg','leg'], color: '#818CF8', position: { x: 75, y: 310 }, name: 'Lower Leg' },
    foot: { keywords: ['foot','feet','ankle','toe','heel','arch'], color: '#E879F9', position: { x: 75, y: 375 }, name: 'Foot & Ankle' }
};

const HUMAN_SILHOUETTE_PATH = `M 100 10 C 85 10, 75 20, 75 35 C 75 50, 85 60, 100 60 C 115 60, 125 50, 125 35 C 125 20, 115 10, 100 10 Z M 100 60 L 100 65 C 60 70, 50 85, 50 110 L 30 170 C 28 180, 32 185, 40 183 L 55 175 L 60 120 C 62 115, 70 110, 75 110 L 75 200 L 55 350 C 53 365, 55 375, 65 378 L 85 378 L 95 220 L 100 220 L 105 220 L 115 378 L 135 378 C 145 375, 147 365, 145 350 L 125 200 L 125 110 C 130 110, 138 115, 140 120 L 145 175 L 160 183 C 168 185, 172 180, 170 170 L 150 110 C 150 85, 140 70, 100 65 Z`;

function initBodyMap() {
    const container = document.getElementById('bodymap-root');
    if (!container || typeof d3 === 'undefined') return;

    const el = {
        svg: d3.select('#bm-human-svg'),
        pop: document.getElementById('bm-population'),
        year: document.getElementById('bm-year'),
        total: document.getElementById('bm-total'),
        fatal: document.getElementById('bm-fatal'),
        nonfatal: document.getElementById('bm-nonfatal'),
        rate: document.getElementById('bm-rate-number'),
        surfboard: document.getElementById('bm-surfboard-img'),
        slider: document.getElementById('bm-year-slider'),
        play: document.getElementById('bm-play'),
        reset: document.getElementById('bm-reset'),
        legend: d3.select('#bm-legend'),
        tooltip: document.getElementById('bm-tooltip')
    };

    let populationData = {};
    let incidents = [];
    let basePopulation = 0;
    let maxPopulation = 0;
    let currentYear = 1980;
    let isPlaying = false;
    let playInterval = null;
    let regionCounts = {};
    let regionFatal = {};

    function formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
        return num.toString();
    }

    function parseBodyRegion(text) {
        if (!text) return [];
        const lower = text.toLowerCase();
        const matches = [];
        for (const [region, data] of Object.entries(BODY_REGIONS)) {
            if (data.keywords.some(k => lower.includes(k))) matches.push(region);
        }
        return matches.length ? matches : ['unknown'];
    }

    function buildLegend() {
        el.legend.selectAll('*').remove();
        Object.entries(BODY_REGIONS).forEach(([region, data]) => {
            const item = el.legend.append('div').attr('class', 'legend-item');
            item.append('div').attr('class', 'legend-dot').style('background-color', data.color);
            item.append('span').text(data.name);
        });
    }

    function initSvg() {
        const svg = el.svg;
        svg.selectAll('*').remove();
        svg.append('path').attr('class', 'human-silhouette').attr('d', HUMAN_SILHOUETTE_PATH);
        const bubbleGroup = svg.append('g').attr('class', 'bubble-group');
        
        for (const [region, data] of Object.entries(BODY_REGIONS)) {
            bubbleGroup.append('circle')
                .attr('class', 'body-bubble')
                .attr('id', `bm-bubble-${region}`)
                .attr('cx', data.position.x)
                .attr('cy', data.position.y)
                .attr('r', 0)
                .attr('fill', data.color)
                .attr('opacity', 0.8)
                .attr('stroke', '#fff')
                .attr('stroke-width', 2)
                .on('mouseover', (event) => showTooltip(event, region))
                .on('mousemove', moveTooltip)
                .on('mouseout', hideTooltip);
        }
        
        [
            { region: 'upperArm', x: 155, y: 110 },
            { region: 'lowerArm', x: 165, y: 160 },
            { region: 'upperLeg', x: 125, y: 230 },
            { region: 'lowerLeg', x: 125, y: 310 },
            { region: 'foot', x: 125, y: 375 }
        ].forEach(({ region, x, y }) => {
            const data = BODY_REGIONS[region];
            bubbleGroup.append('circle')
                .attr('class', 'body-bubble')
                .attr('id', `bm-bubble-${region}-right`)
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', 0)
                .attr('fill', data.color)
                .attr('opacity', 0.8)
                .attr('stroke', '#fff')
                .attr('stroke-width', 2)
                .on('mouseover', (event) => showTooltip(event, region))
                .on('mousemove', moveTooltip)
                .on('mouseout', hideTooltip);
        });
    }

    function updateBubbles() {
        const maxCount = Math.max(...Object.values(regionCounts), 1);
        const radiusScale = d3.scaleSqrt().domain([0, maxCount]).range([0, 22]);
        for (const [region, count] of Object.entries(regionCounts)) {
            const r = radiusScale(count);
            d3.select(`#bm-bubble-${region}`).transition().duration(400).attr('r', r);
            const right = d3.select(`#bm-bubble-${region}-right`);
            if (!right.empty()) right.transition().duration(400).attr('r', r);
        }
    }

    function showTooltip(event, region) {
        const t = el.tooltip;
        const fatal = regionFatal[region] || 0;
        const total = regionCounts[region] || 0;
        const nonFatal = total - fatal;
        const data = BODY_REGIONS[region];
        t.innerHTML = `<div class="tooltip-title">${data.name}</div><div class="tooltip-row"><span class="tooltip-label">Incidents</span><span class="tooltip-value">${total}</span></div><div class="tooltip-row"><span class="tooltip-label">Fatal</span><span class="tooltip-value fatal">${fatal}</span></div><div class="tooltip-row"><span class="tooltip-label">Non-Fatal</span><span class="tooltip-value non-fatal">${nonFatal}</span></div>`;
        t.style.left = (event.pageX + 15) + 'px';
        t.style.top = (event.pageY - 10) + 'px';
        t.classList.add('visible');
    }

    function moveTooltip(event) {
        el.tooltip.style.left = (event.pageX + 15) + 'px';
        el.tooltip.style.top = (event.pageY - 10) + 'px';
    }

    function hideTooltip() {
        el.tooltip.classList.remove('visible');
    }

    function updateVisualization(year) {
        const yearIncidents = incidents.filter(d => d.year === year);
        const population = populationData[year] || basePopulation;
        const total = yearIncidents.length;
        const fatalCount = yearIncidents.filter(d => d.fatal).length;
        const nonFatal = total - fatalCount;
        const rate = population > 0 ? (total / population) * 1000000 : 0;

        regionCounts = {}; regionFatal = {};
        Object.keys(BODY_REGIONS).forEach(r => { regionCounts[r] = 0; regionFatal[r] = 0; });
        yearIncidents.forEach(inc => {
            inc.bodyRegions.forEach(r => {
                if (regionCounts[r] !== undefined) {
                    regionCounts[r] += 1;
                    if (inc.fatal) regionFatal[r] += 1;
                }
            });
        });

        el.year.textContent = year;
        el.pop.textContent = formatNumber(population);
        el.total.textContent = total;
        el.fatal.textContent = fatalCount;
        el.nonfatal.textContent = nonFatal;
        el.rate.textContent = rate.toFixed(2);

        const minScale = 0.55, maxScale = 1.0;
        const popScale = minScale + ((population - basePopulation) / (maxPopulation - basePopulation)) * (maxScale - minScale);
        el.svg.node().style.transform = `scale(${Math.max(minScale, Math.min(maxScale, popScale))})`;

        const baseRate = 0.15, maxRate = 0.5;
        const clampedRate = Math.max(baseRate, Math.min(maxRate, rate));
        const surfScale = 0.6 + (Math.sqrt((clampedRate - baseRate) / (maxRate - baseRate)) * 0.4);
        el.surfboard.style.transform = `scale(${surfScale})`;

        updateBubbles();
    }

    function attachControls() {
        el.slider.addEventListener('input', (e) => {
            currentYear = parseInt(e.target.value, 10);
            updateVisualization(currentYear);
        });
        el.reset.addEventListener('click', () => {
            if (isPlaying) togglePlay(true);
            currentYear = 1980;
            el.slider.value = currentYear;
            updateVisualization(currentYear);
        });
        el.play.addEventListener('click', () => togglePlay());
    }

    function togglePlay(forceStop = false) {
        if (isPlaying || forceStop) {
            clearInterval(playInterval);
            el.play.textContent = '▶ Play';
            isPlaying = false;
            return;
        }
        if (currentYear >= 2019) {
            currentYear = 1980;
            el.slider.value = currentYear;
        }
        el.play.textContent = '⏸ Pause';
        isPlaying = true;
        playInterval = setInterval(() => {
            currentYear += 1;
            if (currentYear > 2019) {
                togglePlay(true);
                currentYear = 2019;
            }
            el.slider.value = currentYear;
            updateVisualization(currentYear);
        }, 600);
    }

    async function loadData() {
        const [popRaw, incidentRaw] = await Promise.all([
            d3.text(`${BODYMAP_DATA_BASE}historical_state_population_by_year.csv`),
            d3.csv(`${BODYMAP_DATA_BASE}globalSharkAttackFile.csv`)
        ]);

        popRaw.trim().split('\n').forEach(line => {
            const [state, yearStr, popStr] = line.split(',');
            const year = parseInt(yearStr, 10);
            const pop = parseInt(popStr, 10);
            if (COASTAL_STATES.includes(state) && year >= 1980 && year <= 2019) {
                populationData[year] = (populationData[year] || 0) + pop;
            }
        });

        basePopulation = populationData[1980] || 100000000;
        maxPopulation = Math.max(...Object.values(populationData));

        incidents = incidentRaw
            .filter(d => {
                const country = (d.Country || '').toUpperCase();
                const year = parseInt(d.Year, 10);
                return (country === 'USA' || country === 'UNITED STATES') && year >= 1980 && year <= 2019 && !isNaN(year);
            })
            .map(d => ({
                year: parseInt(d.Year, 10),
                injury: d.Injury || '',
                fatal: ((d['Fatal Y/N'] || '').toUpperCase() === 'Y'),
                bodyRegions: parseBodyRegion(d.Injury)
            }));

        updateVisualization(currentYear);
    }

    buildLegend();
    initSvg();
    attachControls();
    loadData().catch(err => console.error('Body map load error', err));
}

window.initBodyMap = initBodyMap;
