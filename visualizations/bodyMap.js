const BODYMAP_DATA_PATH = 'data/globalSharkAttackFile.csv';
const BODYMAP_POP_PATH = 'data/historical_state_population_by_year.csv';

const COASTAL_STATES = ['CA', 'FL', 'TX', 'NC', 'SC', 'GA', 'HI', 'OR', 'WA', 'NJ', 'NY', 'MA', 'ME', 'NH', 'RI', 'CT', 'DE', 'MD', 'VA', 'AL', 'MS', 'LA'];

const BODY_REGIONS = {
    head: {
        keywords: ['head', 'face', 'neck', 'skull', 'scalp', 'ear', 'nose', 'jaw', 'chin', 'cheek', 'forehead', 'temple'],
        color: '#EF4444',
        position: { x: 100, y: 35 },
        name: 'Head & Neck'
    },
    torso: {
        keywords: ['chest', 'abdomen', 'stomach', 'torso', 'back', 'ribs', 'side', 'hip', 'pelvis', 'shoulder', 'body'],
        color: '#F97316',
        position: { x: 100, y: 120 },
        name: 'Torso'
    },
    upperArm: {
        keywords: ['upper arm', 'bicep', 'tricep'],
        color: '#FBBF24',
        position: { x: 45, y: 110 },
        name: 'Upper Arm'
    },
    lowerArm: {
        keywords: ['forearm', 'wrist', 'hand', 'finger', 'thumb', 'palm', 'knuckle', 'arm'],
        color: '#A3E635',
        position: { x: 35, y: 160 },
        name: 'Arm & Hand'
    },
    upperLeg: {
        keywords: ['thigh', 'groin', 'buttock', 'upper leg', 'quadricep'],
        color: '#22D3EE',
        position: { x: 75, y: 230 },
        name: 'Upper Leg'
    },
    lowerLeg: {
        keywords: ['knee', 'calf', 'shin', 'lower leg', 'leg'],
        color: '#818CF8',
        position: { x: 75, y: 310 },
        name: 'Lower Leg'
    },
    foot: {
        keywords: ['foot', 'feet', 'ankle', 'toe', 'heel', 'arch'],
        color: '#E879F9',
        position: { x: 75, y: 375 },
        name: 'Foot & Ankle'
    }
};

const HUMAN_SILHOUETTE_PATH = `
    M 100 10
    C 85 10, 75 20, 75 35
    C 75 50, 85 60, 100 60
    C 115 60, 125 50, 125 35
    C 125 20, 115 10, 100 10
    Z
    M 100 60
    L 100 65
    C 60 70, 50 85, 50 110
    L 30 170
    C 28 180, 32 185, 40 183
    L 55 175
    L 60 120
    C 62 115, 70 110, 75 110
    L 75 200
    L 55 350
    C 53 365, 55 375, 65 378
    L 85 378
    L 95 220
    L 100 220
    L 105 220
    L 115 378
    L 135 378
    C 145 375, 147 365, 145 350
    L 125 200
    L 125 110
    C 130 110, 138 115, 140 120
    L 145 175
    L 160 183
    C 168 185, 172 180, 170 170
    L 150 110
    C 150 85, 140 70, 100 65
    Z
`;

let populationData = {};
let incidentData = [];
let currentYear = 1980;
let isPlaying = false;
let playInterval = null;
let basePopulation = 0;
let maxPopulation = 0;

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
}

function parseBodyRegion(injuryText) {
    if (!injuryText || typeof injuryText !== 'string') return [];
    
    const text = injuryText.toLowerCase();
    const matches = [];
    
    for (const [region, data] of Object.entries(BODY_REGIONS)) {
        for (const keyword of data.keywords) {
            if (text.includes(keyword)) {
                matches.push(region);
                break;
            }
        }
    }
    
    return matches.length > 0 ? matches : ['unknown'];
}

async function loadData() {
    try {
        const [popRaw, incidentRaw] = await Promise.all([
            d3.text(BODYMAP_POP_PATH),
            d3.csv(BODYMAP_DATA_PATH)
        ]);
        
        const popLines = popRaw.trim().split('\n');
        popLines.forEach(line => {
            const [state, year, pop] = line.split(',');
            const y = parseInt(year);
            const p = parseInt(pop);
            if (COASTAL_STATES.includes(state) && y >= 1980 && y <= 2019) {
                if (!populationData[y]) populationData[y] = 0;
                populationData[y] += p;
            }
        });
        
        basePopulation = populationData[1980] || 100000000;
        maxPopulation = Math.max(...Object.values(populationData));
        
        incidentData = incidentRaw
            .filter(d => {
                const country = (d.Country || '').toUpperCase();
                const year = parseInt(d.Year);
                return (country === 'USA' || country === 'UNITED STATES') && 
                       year >= 1980 && year <= 2019 &&
                       !isNaN(year);
            })
            .map(d => ({
                year: parseInt(d.Year),
                injury: d.Injury || '',
                fatal: (d['Fatal Y/N'] || '').toUpperCase() === 'Y',
                state: d.State || '',
                bodyRegions: parseBodyRegion(d.Injury)
            }));
        
        initVisualization();
        updateVisualization(currentYear);
        
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function initVisualization() {
    initHumanSVG();
    initLegend();
    initSlider();
}

function initHumanSVG() {
    const svg = d3.select('#human-svg');
    
    svg.append('path')
        .attr('class', 'human-silhouette')
        .attr('d', HUMAN_SILHOUETTE_PATH);
    
    const bubbleGroup = svg.append('g').attr('class', 'bubble-group');
    
    for (const [region, data] of Object.entries(BODY_REGIONS)) {
        bubbleGroup.append('circle')
            .attr('class', 'body-bubble')
            .attr('id', `bubble-${region}`)
            .attr('cx', data.position.x)
            .attr('cy', data.position.y)
            .attr('r', 0)
            .attr('fill', data.color)
            .attr('opacity', 0.8)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .on('mouseover', function(event) {
                showBubbleTooltip(event, region);
            })
            .on('mousemove', function(event) {
                moveTooltip(event);
            })
            .on('mouseout', hideTooltip);
    }
    
    const mirroredRegions = [
        { region: 'upperArm', x: 155, y: 110 },
        { region: 'lowerArm', x: 165, y: 160 },
        { region: 'upperLeg', x: 125, y: 230 },
        { region: 'lowerLeg', x: 125, y: 310 },
        { region: 'foot', x: 125, y: 375 }
    ];
    
    mirroredRegions.forEach(({ region, x, y }) => {
        const data = BODY_REGIONS[region];
        bubbleGroup.append('circle')
            .attr('class', 'body-bubble')
            .attr('id', `bubble-${region}-right`)
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 0)
            .attr('fill', data.color)
            .attr('opacity', 0.8)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .on('mouseover', function(event) {
                showBubbleTooltip(event, region);
            })
            .on('mousemove', function(event) {
                moveTooltip(event);
            })
            .on('mouseout', hideTooltip);
    });
}

function initLegend() {
    const container = d3.select('#legend-items');
    
    for (const [region, data] of Object.entries(BODY_REGIONS)) {
        const item = container.append('div').attr('class', 'legend-item');
        item.append('div')
            .attr('class', 'legend-dot')
            .style('background-color', data.color);
        item.append('span').text(data.name);
    }
}

function initSlider() {
    const slider = document.getElementById('year-slider');
    const playBtn = document.getElementById('play-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    slider.addEventListener('input', function() {
        currentYear = parseInt(this.value);
        updateVisualization(currentYear);
    });
    
    playBtn.addEventListener('click', togglePlay);
    resetBtn.addEventListener('click', resetVisualization);
}

function togglePlay() {
    const playBtn = document.getElementById('play-btn');
    
    if (isPlaying) {
        clearInterval(playInterval);
        playBtn.textContent = '▶ Play';
        isPlaying = false;
    } else {
        if (currentYear >= 2019) {
            currentYear = 1980;
            document.getElementById('year-slider').value = currentYear;
        }
        
        playBtn.textContent = '⏸ Pause';
        isPlaying = true;
        
        playInterval = setInterval(() => {
            currentYear++;
            if (currentYear > 2019) {
                clearInterval(playInterval);
                playBtn.textContent = '▶ Play';
                isPlaying = false;
                currentYear = 2019;
            }
            document.getElementById('year-slider').value = currentYear;
            updateVisualization(currentYear);
        }, 600);
    }
}

function resetVisualization() {
    if (isPlaying) {
        clearInterval(playInterval);
        isPlaying = false;
        document.getElementById('play-btn').textContent = '▶ Play';
    }
    currentYear = 1980;
    document.getElementById('year-slider').value = currentYear;
    updateVisualization(currentYear);
}

function updateVisualization(year) {
    const yearIncidents = incidentData.filter(d => d.year === year);
    const population = populationData[year] || basePopulation;
    const totalIncidents = yearIncidents.length;
    const fatalCount = yearIncidents.filter(d => d.fatal).length;
    const nonFatalCount = totalIncidents - fatalCount;
    const rate = population > 0 ? (totalIncidents / population) * 1000000 : 0;
    
    const regionCounts = {};
    const regionFatal = {};
    for (const region of Object.keys(BODY_REGIONS)) {
        regionCounts[region] = 0;
        regionFatal[region] = 0;
    }
    
    yearIncidents.forEach(incident => {
        incident.bodyRegions.forEach(region => {
            if (region !== 'unknown' && regionCounts[region] !== undefined) {
                regionCounts[region]++;
                if (incident.fatal) regionFatal[region]++;
            }
        });
    });
    
    window.currentRegionCounts = regionCounts;
    window.currentRegionFatal = regionFatal;
    
    document.getElementById('current-year-large').textContent = year;
    document.getElementById('population-display').textContent = formatNumber(population);
    document.getElementById('stat-incidents').textContent = totalIncidents;
    document.getElementById('stat-fatal').textContent = fatalCount;
    document.getElementById('stat-nonfatal').textContent = nonFatalCount;
    document.getElementById('rate-number').textContent = rate.toFixed(2);
    
    const minScale = 0.55;
    const maxScale = 1.0;
    const popScale = minScale + ((population - basePopulation) / (maxPopulation - basePopulation)) * (maxScale - minScale);
    
    const humanSvg = document.getElementById('human-svg');
    humanSvg.style.transform = `scale(${popScale})`;
    
    const baseRate = 0.15;
    const maxRate = 0.5;
    const clampedRate = Math.max(baseRate, Math.min(maxRate, rate));
    const surfboardScale = 0.6 + (Math.sqrt((clampedRate - baseRate) / (maxRate - baseRate)) * 0.4);
    
    const surfboardImg = document.getElementById('surfboard-img');
    surfboardImg.style.transform = `scale(${surfboardScale})`;
    
    const maxCount = Math.max(...Object.values(regionCounts), 1);
    const radiusScale = d3.scaleSqrt().domain([0, maxCount]).range([0, 22]);
    
    for (const [region, count] of Object.entries(regionCounts)) {
        const radius = radiusScale(count);
        
        d3.select(`#bubble-${region}`)
            .transition()
            .duration(400)
            .attr('r', radius);
        
        const rightBubble = d3.select(`#bubble-${region}-right`);
        if (!rightBubble.empty()) {
            rightBubble.transition()
                .duration(400)
                .attr('r', radius);
        }
    }
}

function showBubbleTooltip(event, region) {
    const tooltip = document.getElementById('bodymap-tooltip');
    const counts = window.currentRegionCounts || {};
    const fatal = window.currentRegionFatal || {};
    const data = BODY_REGIONS[region];
    
    const count = counts[region] || 0;
    const fatalCount = fatal[region] || 0;
    const nonFatalCount = count - fatalCount;
    
    tooltip.innerHTML = `
        <div class="tooltip-title">${data.name}</div>
        <div class="tooltip-row">
            <span class="tooltip-label">Incidents</span>
            <span class="tooltip-value">${count}</span>
        </div>
        <div class="tooltip-row">
            <span class="tooltip-label">Fatal</span>
            <span class="tooltip-value fatal">${fatalCount}</span>
        </div>
        <div class="tooltip-row">
            <span class="tooltip-label">Non-Fatal</span>
            <span class="tooltip-value non-fatal">${nonFatalCount}</span>
        </div>
    `;
    
    tooltip.style.left = (event.pageX + 15) + 'px';
    tooltip.style.top = (event.pageY - 10) + 'px';
    tooltip.classList.add('visible');
}

function moveTooltip(event) {
    const tooltip = document.getElementById('bodymap-tooltip');
    tooltip.style.left = (event.pageX + 15) + 'px';
    tooltip.style.top = (event.pageY - 10) + 'px';
}

function hideTooltip() {
    const tooltip = document.getElementById('bodymap-tooltip');
    tooltip.classList.remove('visible');
}

window.initBodyMap = loadData;
