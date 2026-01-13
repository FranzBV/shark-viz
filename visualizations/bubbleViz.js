

const data_path = 'data/globalSharkAttackFile.csv';

function parseSpeciesName(rawText) {
    if (!rawText || rawText.trim() === '') {
        return 'Unknown';
    }
    
    const text = rawText.toLowerCase().trim();
    
    // Check for specific "shark involvement" phrases first - these appear as separate entries in the data
    // Catches: "Shark involvement prior to death was not confirmed" and "Shark involvement prior to death unconfirmed"
    if (text.includes('shark involvement') || text.includes('prior to death')) {
        return 'Unknown';
    }
    
    //not confirmed variations -> unknown
    const unknownVariations = [
        'unknown', 'undetermined', 'not stated', 'not staed', 
        'questionable', 'unconfirmed', 'unidentified', 'not identified',
        'no id', 'not confirmed', 'invalid'
    ];
    
    for (const variation of unknownVariations) {
        if (text.includes(variation)) {
            return 'Unknown';
        }
    }
    
    // Species patterns
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
    
    // Try to match species patterns
    for (const pattern of speciesPatterns) {
        for (const keyword of pattern.keywords) {
            if (text.includes(keyword)) {
                return pattern.name;
            }
        }
    }
    
    // "small shark" or just "shark" -> unknown
    if (text.match(/small\s+shark|shark\s*\d/i) || text === 'shark') {
        return 'Unknown';
    }
    
    //no match found, clean text
    const cleaned = text
        .replace(/shark[s]?/gi, '')
        .replace(/\d+(\.\d+)?\s*(m|ft|feet|meter|metre)[s]?/gi, '')
        .replace(/\d+[-'"]?\d*\s*(m|ft|feet)/gi, '')
        .replace(/involved|unconfirmed|questionable|possibly|suspected|est|estimated/gi, '')
        .replace(/\(.*?\)/g, '')
        .replace(/[,;?]/g, ' ')
        .trim();
    
    // If empty -> return 'Unknown'
    if (!cleaned || cleaned.length < 3 || /^[\d\s\-,.;:'"?]+$/.test(cleaned)) {
        return 'Unknown';
    }
    
    // Capitalize first letter of each word
    const capitalized = cleaned
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    return capitalized + ' Shark';
}

function cleanAttackData(data) {
    
    const speciesMap = d3.rollup(
        data,
        v => ({
            incidents: v.length,
            // Default to 'N' if Fatal Y/N is empty 
            fatal: d3.sum(v, d => {
                const fatalValue = (d['Fatal Y/N'] || 'N').trim().toUpperCase();
                return fatalValue === 'Y' ? 1 : 0;
            }),
            nonFatal: d3.sum(v, d => {
                const fatalValue = (d['Fatal Y/N'] || 'N').trim().toUpperCase();
                return fatalValue === 'N' || fatalValue === '' ? 1 : 0;
            })
        }),
        d => d.Species  // Species is already parsed/cleaned
    );
    
    // Convert to array and filter
    return Array.from(speciesMap, ([species, counts]) => ({
        species: species,
        incidents: counts.incidents,
        fatal: counts.fatal,
        nonFatal: counts.nonFatal
    }))
    .filter(d => d.incidents > 5) // Filter for species with more than 5 incidents
    .sort((a, b) => b.incidents - a.incidents)
    .slice(0, 10); // Take top 10 species
}

function buildViz(data) {
        
    const margin = { top: 20, right: 30, bottom: 80, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    let showFatal = true;

    // Clear 
    d3.select("#bubble-chart").selectAll("*").remove();

    
    //SVG
    
    const svg = d3.select("#bubble-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    
    //SCALES
    
    
    // X-axis: species
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.species))
        .range([0, width])
        .padding(0.1);

    // Y-axis: number of incidents
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.incidents)])
        .range([height, 0])
        .nice();

    // Bubble size: fatal count
    const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => Math.max(d.fatal, d.nonFatal))])
        .range([2, 30]);

    // Color
    const colorScale = d3.scaleOrdinal()
        .domain(data.map(d => d.species))
        .range(d3.schemeCategory10);

    
    // AXES
    
    // X-axis
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Y-axis
    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(yScale));

    // Y-axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .style("text-anchor", "middle")
        .text("Number of Incidents");

    // Grid lines
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat("")
        );

    
    // TOOLTIP   
    const tooltip = d3.select("#bubble-tooltip");

    // BUBBLES
    
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
            
            tooltip
                .style("opacity", 1)
                .html(`
                    <div class="species-name">${d.species}</div>
                    <div>Total Incidents: ${d.incidents}</div>
                    <div class="fatal">Fatal: ${d.fatal} (${fatalPercent}%)</div>
                    <div class="non-fatal">Non-Fatal: ${d.nonFatal}</div>
                `);
        })
        .on("mousemove", function(event) {
            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("opacity", 0.7);
            tooltip.style("opacity", 0);
        });

    
    //TOGGLE SWITCH
    
    const toggle = document.getElementById("bubble-toggle");
    
    toggle.classList.remove("non-fatal");
    
    //Get label references
    const fatalLabel = document.querySelector(".fatal-label");
    const nonFatalLabel = document.querySelector(".non-fatal-label");
    
    //initial label state
    fatalLabel.classList.add("active");
    nonFatalLabel.classList.remove("active");

    const newToggle = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(newToggle, toggle);
    
    const newFatalLabel = document.querySelector(".fatal-label");
    const newNonFatalLabel = document.querySelector(".non-fatal-label");

    newToggle.addEventListener("click", function() {
        showFatal = !showFatal;
        
        //toggle appearance
        this.classList.toggle("non-fatal");
        newFatalLabel.classList.toggle("active");
        newNonFatalLabel.classList.toggle("active");
        
        //Animate bubble 
        bubbles.transition()
            .duration(400)
            .attr("r", d => sizeScale(showFatal ? d.fatal : d.nonFatal));
    });
}


//Main Entry

function loadAndPrepareData() {
    d3.csv(data_path).then((dRaw) => {
        // Parse and clean species names BEFORE sending to cleanAttackData
        const parsedData = dRaw.map(row => ({
            ...row,
            Species: parseSpeciesName(row.Species)
        }));
        
        console.log("Species parsed. Sample:", parsedData.slice(0, 5).map(d => d.Species));
        
        const cleanedData = cleanAttackData(parsedData);
        console.log("Bubble chart data loaded and cleaned:", cleanedData);
        buildViz(cleanedData);
    }).catch(err => console.error('Error loading data:', err));
}

loadAndPrepareData();