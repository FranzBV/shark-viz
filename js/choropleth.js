const choroplethConfig = {
    colors: {
        deepOcean: '#0A2463',
        oceanBlue: '#1E3A8A',
        mediumBlue: '#3B82F6',
        lightBlue: '#60A5FA',
        coralRed: '#FB6F92',
        sunsetOrange: '#FF6B35',
        lightGray: '#E5E7EB',
        darkGray: '#374151'
    },
    mortalityColorScale: ['#DBEAFE', '#60A5FA', '#3B82F6', '#1E3A8A', '#FB6F92', '#FF6B35', '#DC2626', '#991B1B']
};

function createChoroplethTooltip() {
    return d3.select('body').append('div').attr('class', 'tooltip').style('opacity', 0);
}

function formatChoroplethNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function showChoroplethTooltip(tooltip, content, event) {
    tooltip.transition().duration(200).style('opacity', 1);
    tooltip.html(content).style('left', (event.pageX + 10) + 'px').style('top', (event.pageY - 28) + 'px');
}

function hideChoroplethTooltip(tooltip) {
    tooltip.transition().duration(500).style('opacity', 0);
}

async function ensureTopojson() {
    if (typeof topojson !== 'undefined' && topojson.feature) return topojson;
    try {
        const mod = await import('https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js');
        if (mod && mod.feature) { window.topojson = mod; return mod; }
    } catch (e) { console.error('Failed to load topojson-client from CDN', e); }
    throw new Error('topojson-client is required to render the map');
}

class ChoroplethMap {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = d3.select(`#${containerId}`);
        this.margin = { top: 20, right: 20, bottom: 40, left: 20 };
        this.tooltip = createChoroplethTooltip();
        const node = this.container.node();
        const containerWidth = node?.clientWidth || 960;
        const containerHeight = node?.clientHeight || 520;
        this.width = containerWidth - this.margin.left - this.margin.right;
        this.height = containerHeight - this.margin.top - this.margin.bottom;
        this.init();
    }

    init() {
        this.container.html('');
        this.svg = this.container.append('svg')
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom)
            .style('display', 'block')
            .append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        this.colorScale = d3.scaleThreshold().domain([1000, 5000, 10000, 50000, 100000, 1000000, 5000000]).range(choroplethConfig.mortalityColorScale);
        this.projection = d3.geoMercator().scale(130).translate([this.width / 2, this.height / 1.5]);
        this.pathGenerator = d3.geoPath().projection(this.projection);

        this.svg.append('text').attr('x', this.width / 2).attr('y', this.height / 2).attr('text-anchor', 'middle').attr('class', 'loading-text').style('font-size', '1.2rem').style('fill', choroplethConfig.colors.darkGray).text('Map will appear here once data is loaded');
    }

    async loadData(geoJsonUrl, mortalityCsvUrl) {
        try {
            const topojsonClient = await ensureTopojson();
            const [worldData, mortalityRows] = await Promise.all([
                d3.json(geoJsonUrl),
                d3.csv(mortalityCsvUrl, d => ({ eez_name: (d.eez_name || '').trim(), year: +d.year, total_mortality: +d.total_mortality }))
            ]);

            this.mortalityByEEZ = d3.rollup(mortalityRows, v => d3.sum(v, d => d.total_mortality), d => d.eez_name);

            let geoFeatures;
            if (worldData.type === 'Topology') {
                const objectKey = Object.keys(worldData.objects)[0];
                geoFeatures = topojsonClient.feature(worldData, worldData.objects[objectKey]).features;
            } else {
                geoFeatures = worldData.features;
            }
            this.render(geoFeatures);
        } catch (error) {
            console.error('Error loading map or mortality data:', error);
            this.svg.select('.loading-text').text('Error loading data. Please try again.');
        }
    }

    render(geoData) {
        this.svg.select('.loading-text').remove();
        const self = this;

        this.svg.selectAll('.country').data(geoData).enter().append('path')
            .attr('class', 'country')
            .attr('d', d => self.pathGenerator(d))
            .attr('fill', d => {
                const name = d.properties?.name;
                const mortality = self.mortalityByEEZ ? self.mortalityByEEZ.get(name) : null;
                if (mortality && mortality > 0) return self.colorScale(mortality);
                return choroplethConfig.colors.lightGray;
            })
            .on('mouseover', function(event, d) { self.handleMouseOver(event, d); })
            .on('mousemove', function(event) { self.tooltip.style('left', (event.pageX + 10) + 'px').style('top', (event.pageY - 28) + 'px'); })
            .on('mouseout', function(event, d) { self.handleMouseOut(event, d); });

        this.addLegend();
    }

    addLegend() {
        const legendData = [
            { label: '< 1K', color: choroplethConfig.mortalityColorScale[0] },
            { label: '1K - 5K', color: choroplethConfig.mortalityColorScale[1] },
            { label: '5K - 10K', color: choroplethConfig.mortalityColorScale[2] },
            { label: '10K - 50K', color: choroplethConfig.mortalityColorScale[3] },
            { label: '50K - 100K', color: choroplethConfig.mortalityColorScale[4] },
            { label: '100K - 1M', color: choroplethConfig.mortalityColorScale[5] },
            { label: '1M - 10M', color: choroplethConfig.mortalityColorScale[6] },
            { label: '> 10M', color: '#7f1d1d' }
        ];

        const legend = this.svg.append('g').attr('class', 'legend').attr('transform', `translate(20, ${this.height - 150})`);
        legend.append('text').attr('x', 0).attr('y', -10).style('font-weight', 'bold').style('font-size', '0.9rem').text('Estimated Mortality');

        const legendItems = legend.selectAll('.legend-item').data(legendData).enter().append('g').attr('class', 'legend-item').attr('transform', (d, i) => `translate(0, ${i * 25})`);
        legendItems.append('rect').attr('width', 20).attr('height', 20).attr('fill', d => d.color).attr('stroke', '#fff').attr('stroke-width', 1);
        legendItems.append('text').attr('x', 28).attr('y', 15).style('font-size', '0.85rem').text(d => d.label);
    }

    handleMouseOver(event, d) {
        const name = d.properties?.name || 'Unknown';
        const mortality = this.mortalityByEEZ ? this.mortalityByEEZ.get(name) : null;
        const mortalityText = (mortality && mortality > 0) ? formatChoroplethNumber(mortality.toFixed(0)) : 'No data';
        const content = `<strong>${name}</strong><br/>Estimated mortality (2012–2019): ${mortalityText}`;
        showChoroplethTooltip(this.tooltip, content, event);
    }

    handleMouseOut(event, d) {
        hideChoroplethTooltip(this.tooltip);
    }
}

window.ChoroplethMap = ChoroplethMap;
