# 🦈 Beneath the Surface

**Beneath the Surface** is a scroll-based narrative data visualization website designed to challenge common misconceptions about sharks. While sharks are often portrayed as dangerous predators, global data shows that humans pose a far greater threat to sharks than sharks do to us. This project uses storytelling, interactivity, and data visualization to reframe public perception and reveal the hidden patterns behind shark mortality, sightings, and human–shark interactions.

By following a shark’s journey through the ocean across 14 narrative frames, the project illustrates how shark populations are declining globally, how incidents are frequently misunderstood, and how human activity has shaped these interactions over time.

---

## 🎯 Project Goals

- Debunk fear-based myths and media narratives about sharks  
- Highlight the significant role humans play in shark mortality  
- Demonstrate how narrative data visualization can improve public understanding  

---

## 📊 Datasets Used

This project integrates **five complementary datasets**, each representing a different dimension of human–shark interaction:

1. **Global Shark Fishing Mortality Estimates (2012–2019)**  
   Regional estimates of shark deaths caused by fishing activity, including gear type, environment, and regulatory indicators. Enables regional and temporal comparisons and highlights the effectiveness of conservation measures.

2. **Global Shark Attack File – Incident Log**  
   An incident-level dataset classifying events as unprovoked, provoked, watercraft-related, air/sea disaster related, or questionable. Includes severity outcomes and is continuously updated.

3. **Shark Incidents in California (1950–2022)**  
   A historical dataset detailing location, victim activity, injury severity, and shark species involved, allowing analysis of long-term coastal trends.

4. **SharkBase**  
   A global sightings and encounters dataset used to track long-term population changes across species, locations, and time.

5. **Historical Population of U.S. States (1900–2019)**  
   Census-based population data used to contextualize shark incident counts relative to human population growth.

---

## 🛠️ Implementation Overview

### Website Architecture
- Scroll-driven narrative experience with **14 frames**
- Each frame introduces a new part of the story: ecosystem context, human interaction, misconceptions, mortality data, and concluding insights

### Integrated Visualizations
- Regional Shark Mortality Distribution (Choropleth Map)
- Global Shark Mortality Over Time (Stacked Area Chart with regulatory overlay)
- California Coastal Incident Density & Temporal Shift (Circular Bar Chart)
- Species vs. Fatal vs. Total Incidents (Bubble Chart)
- Incidents per Year (Innovative Visualization – Human Body Map)
- Shark Sightings Over Time (Time Series / Line Graph)

### Data Processing
- Data imported, cleaned, normalized, and typed using **D3.js**

### Narrative Design
- Frame-based storyboard guiding users from introduction to call-to-action

---

## ✨ Innovative Visualization

### Incident Trends Over Time – Human Body Map

This visualization maps shark incident data onto a human silhouette scaled to the combined population of U.S. coastal states (1980–2019).

**Key Elements**
- **Scaled Human Figure:**  
  The silhouette grows proportionally with population size. Body regions display bubbles sized by incident frequency, with hover tooltips showing fatal vs. non-fatal breakdowns.
- **Surfboard Rate Indicator:**  
  A surfboard graphic scales based on incidents per million people (square-root scaling), with the rate displayed directly for immediate context.
- **Temporal Slider:**  
  A year slider with animation reveals how both raw incident counts and population-adjusted risk change over time.

**Why It’s Innovative**
This visualization is *combinatorial*, merging a body heat map, proportional scaling, and rate indicators into a single cohesive system. It demonstrates that increasing incident counts are largely driven by population growth—not rising shark aggression—making risk perception more accurate and intuitive.

---

## 🧠 Lessons Learned

- Narrative visualizations require deliberate and precise storyboarding  
- Integrating heterogeneous datasets demands careful cleaning and normalization  
- Scroll-triggered animations must complement both text and visuals  
- Misconceptions often stem from selective or decontextualized data  

---

## 🚀 Future Improvements

- Smoother, more realistic shark animations  
- Sound design for increased immersion  
- Scene-specific text and visualization animations  
- A mobile-friendly version preserving the immersive experience  

---

## 👥 Team Contributors

- **Pari Pandey**  

- **Franz Benedict Villamin**  

- **Craig Seward**  

- **Gabriel Kessler**  

- **Rounak Sharma**  

---

## 🧩 3D Models

The following 3D models were used in this project and are credited under **Creative Commons Attribution 4.0** licenses:

- **Boat**  
  “Boat” (https://skfb.ly/RoQQ) by Mario Libera  
  Licensed under Creative Commons Attribution 4.0  
  http://creativecommons.org/licenses/by/4.0/

- **Nanando Diver – Underwater**  
  “Nanando diver - Underwater” (https://skfb.ly/oH88H) by Marco Lopez  
  Licensed under Creative Commons Attribution 4.0  
  http://creativecommons.org/licenses/by/4.0/

- **Great White Shark**  
  “Great White Shark” (https://skfb.ly/oQXVs) by Sealife Fan 3  
  Licensed under Creative Commons Attribution 4.0  
  http://creativecommons.org/licenses/by/4.0/

---

## 📚 References

- https://datadryad.org/dataset/doi:10.25349/D9JK6N  
- https://www.sharkattackfile.net/incidentlog.htm  
- https://www.kaggle.com/datasets/ryanwong1/shark-incidents-in-california-1950-2022  
- https://www.marine.csiro.au/ipt/resource?r=ala_dr2383  
- https://github.com/JoshData/historical-state-population-csv  
- https://www.worldwildlife.org/resources/facts/shark-facts-vs-shark-myths  
- https://www.science.org/content/article/shark-kills-rise-more-100-million-year-despite-anti-finning-laws
