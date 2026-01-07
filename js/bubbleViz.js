const bubbleDataPath = 'data/globalSharkAttackFile.csv';

function parseSpeciesName(rawText) {
    if (!rawText || rawText.trim() === '') return 'Unknown';
    const text = rawText.toLowerCase().trim();
    if (text.includes('shark involvement') || text.includes('prior to death')) return 'Unknown';
    
    const unknownVariations = ['unknown', 'undetermined', 'not stated', 'not staed', 'questionable', 'unconfirmed', 'unidentified', 'not identified', 'no id', 'not confirmed', 'invalid'];
    for (const variation of unknownVariations) {
        if (text.includes(variation)) return 'Unknown';
    }
    
    const speciesPatterns = [
        { keywords: ['white', 'great white', 'white pointer', 'carcharodon'], name: 'White Shark' },
        { keywords: ['tiger'], name: 'Tiger Shark' },
        { keywords: ['bull', 'zambezi'], name: 'Bull Shark' },
        { keywords: ['blue'], name: 'Blue Shark' },
        { keywords: ['mako', 'shortfin mako', 'longfin mako'], name: 'Mako Shark' },
        { keywords: ['hammerhead', 'hammer head'], name: 'Hammerhead Shark' },
        { keywords: ['blacktip', 'black tip', 'black-tip'], name: 'Blacktip Shark' },
        { keywords: ['nurse'], name: 'Nurse Shark' },
        { keywords: ['lemon'], name: 'Lemon Shark' },
        { keywords: ['reef', 'grey reef', 'gray reef', 'whitetip reef', 'blacktip reef'], name: 'Reef Shark' },
        { keywords: ['bronze', 'bronze whaler', 'copper'], name: 'Bronze Whaler Shark' },
        { keywords: ['spinner'], name: 'Spinner Shark' },
        { keywords: ['sandbar', 'sand bar'], name: 'Sandbar Shark' },
        { keywords: ['sand tiger', 'grey nurse', 'gray nurse', 'ragged tooth'], name: 'Sand Tiger Shark' },
        { keywords: ['oceanic whitetip', 'oceanic white tip'], name: 'Oceanic Whitetip Shark' },
        { keywords: ['sevengill', 'seven gill', '7 gill'], name: 'Sevengill Shark' },
        { keywords: ['sixgill', 'six gill', '6 gill'], name: 'Sixgill Shark' },
        { keywords: ['thresher'], name: 'Thresher Shark' },
        { keywords: ['wobbegong', 'carpet shark'], name: 'Wobbegong Shark' },
        { keywords: ['porbeagle'], name: 'Porbeagle Shark' },
        { keywords: ['dusky'], name: 'Dusky Shark' },
        { keywords: ['silky'], name: 'Silky Shark' },
        { keywords: ['basking'], name: 'Basking Shark' },
        { keywords: ['whale shark'], name: 'Whale Shark' },
        { keywords: ['goblin'], name: 'Goblin Shark' },
        { keywords: ['megamouth', 'mega mouth'], name: 'Megamouth Shark' }
    ];
    
    for (const pattern of speciesPatterns) {
        for (const keyword of pattern.keywords) {
            if (text.includes(keyword)) return pattern.name;
        }
    }
    
    if (text.match(/small\s+shark|shark\s*\d/i) || text === 'shark') return 'Unknown';
    
    const cleaned = text
        .replace(/shark[s]?/gi, '')
        .replace(/\d+(\.\d+)?\s*(m|ft|feet|meter|metre)[s]?/gi, '')
        .replace(/\d+[-'"]?\d*\s*(m|ft|feet)/gi, '')
        .replace(/involved|unconfirmed|questionable|possibly|suspected|est|estimated/gi, '')
        .replace(/\(.*?\)/g, '')
        .replace(/[,;?]/g, ' ')
        .trim();
    
    if (!cleaned || cleaned.length < 3 || /^[\d\s\-,.;:'"?]+$/.test(cleaned)) return 'Unknown';
    
    const capitalized = cleaned.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return capitalized + ' Shark';
}

function cleanBubbleAttackData(data) {
    const speciesMap = d3.rollup(
        data,
        v => ({
            incidents: v.length,
            fatal: d3.sum(v, d => {
                const fatalValue = (d['Fatal Y/N'] || 'N').trim().toUpperCase();
                return fatalValue === 'Y' ? 1 : 0;
            }),
            nonFatal: d3.sum(v, d => {
                const fatalValue = (d['Fatal Y/N'] || 'N').trim().toUpperCase();
                return fatalValue === 'N' || fatalValue === '' ? 1 : 0;
            })
        }),
        d => d.Species
    );
    
    return Array.from(speciesMap, ([species, counts]) => ({
        species: species,
        incidents: counts.incidents,
        fatal: counts.fatal,
        nonFatal: counts.nonFatal
    }))
    .filter(d => d.incidents > 5)
    .sort((a, b) => b.incidents - a.incidents)
    .slice(0, 10);
}

function buildBubbleViz(data) {
    const margin = { top: 20, right: 30, bottom: 100, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 420 - margin.top - margin.bottom;
    let showFatal = true;

    d3.select("#bubble-chart").selectAll("*").remove();

    const svg = d3.select("#bubble-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand().domain(data.map(d => d.species)).range([0, width]).padding(0.1);
    const yScale = d3.scaleLinear().domain([0, d3.max(data, d => d.incidents)]).range([height, 0]).nice();
    const sizeScale = d3.scaleSqrt().domain([0, d3.max(data, d => Math.max(d.fatal, d.nonFatal))]).range([2, 30]);
    const colorScale = d3.scaleOrdinal().domain(data.map(d => d.species)).range(d3.schemeCategory10);

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g").attr("class", "axis").call(d3.axisLeft(yScale));

    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .style("text-anchor", "middle")
        .text("Number of Incidents");

    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(""));

    const tooltip = d3.select("#bubble-tooltip");

    const bubbles = svg.selectAll(".bubble")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "bubble")
        .attr("cx", d => xScale(d.species) + xScale.bandwidth() / 2)
        .attr("cy", d => yScale(d.incidents))
        .attr("r", d => sizeScale(d.fatal))
        .attr("fill", d => colorScale(d.species))
        .attr("opacity", 0.7)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("opacity", 1);
            const fatalPercent = ((d.fatal / d.incidents) * 100).toFixed(1);
            tooltip.style("opacity", 1)
                .html(`<div class="species-name">${d.species}</div><div>Total Incidents: ${d.incidents}</div><div class="fatal">Fatal: ${d.fatal} (${fatalPercent}%)</div><div class="non-fatal">Non-Fatal: ${d.nonFatal}</div>`);
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("opacity", 0.7);
            tooltip.style("opacity", 0);
        });

    const toggle = document.getElementById("bubble-toggle");
    if (toggle) {
        toggle.classList.remove("non-fatal");
        const fatalLabel = document.querySelector(".fatal-label");
        const nonFatalLabel = document.querySelector(".non-fatal-label");
        if (fatalLabel) fatalLabel.classList.add("active");
        if (nonFatalLabel) nonFatalLabel.classList.remove("active");

        const newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);
        const newFatalLabel = document.querySelector(".fatal-label");
        const newNonFatalLabel = document.querySelector(".non-fatal-label");

        newToggle.addEventListener("click", function() {
            showFatal = !showFatal;
            this.classList.toggle("non-fatal");
            if (newFatalLabel) newFatalLabel.classList.toggle("active");
            if (newNonFatalLabel) newNonFatalLabel.classList.toggle("active");
            bubbles.transition().duration(400).attr("r", d => sizeScale(showFatal ? d.fatal : d.nonFatal));
        });
    }
}

function loadBubbleData() {
    d3.csv(bubbleDataPath).then((dRaw) => {
        const parsedData = dRaw.map(row => ({ ...row, Species: parseSpeciesName(row.Species) }));
        const cleanedData = cleanBubbleAttackData(parsedData);
        buildBubbleViz(cleanedData);
    }).catch(err => console.error('Error loading bubble data:', err));
}

window.loadBubbleData = loadBubbleData;
