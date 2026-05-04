const data = await d3.csv('mothitor.csv');
const tooltip = d3.select("#tooltip");
console.log(data);

/// dimensions
let margin = 50;
let width = 500;
let height = 500;

// changing date format from month abbreviation to numerical
const parseTime = d3.timeParse("%b %-d %Y");

for (let i = 0; i < data.length; i++) {
    data[i]['date'] = parseTime(data[i]['date']);
}

// converting to string to delete duplicates
let dateStrings = data.map(d => d.date.toISOString());
dateStrings = Array.from(new Set((dateStrings)));

//grouping
const grouped = d3.group(data, 
    d => d.deployment_name, 
    d => d.date.toISOString()
);

/* get counts for each station 
How this works: if statement checks to make sure that all three groups have data for a given date, to keep our comparisons fair
One array is created for each station. The date is converted from a string to a date object and added to the first column of all three arrays.
(dates are also added to their own array for the domain of our x axis later)
The count is recorded for each group and each date in their respective arrays
The name of each station is recorded in every object of the array
*/
let syd = []
let ama = []
let car = []
let dates = []
for (let i = 0; i < dateStrings.length; i++) {
    if (grouped.get("SYD").get(dateStrings[i]) != undefined && grouped.get("AMA").get(dateStrings[i]) != undefined && grouped.get("CAR").get(dateStrings[i]) != undefined){
        let date = new Date(dateStrings[i])
        dates.push(date)
        syd.push([date, grouped.get("SYD").get(dateStrings[i]).length, "SYD"])
        ama.push([date, grouped.get("AMA").get(dateStrings[i]).length, "AMA"])
        car.push([date, grouped.get("CAR").get(dateStrings[i]).length, "CAR"])
    }
};

// dropdown 
let xVar = "biomass";
d3.select("#xSelect").on("change", function () {
  xVar = this.value;
  update();
});

const stationMap = {
    "SYD": "large",
    "AMA": "medium",
    "CAR": "small"
};

const unitMap = {
  "biomass": "sq. cm",
  "abundance": "moths",
  "speciesRichness": "species"
};

var svg = d3.select("#bar_chart")
  .append("svg")
    .attr("width", (width + margin*2))
                    .attr("height", (height + margin*2))
                    .append("g")
                        .attr("transform", `translate(${margin},${margin})`); 



  // calculate biomass per row usng bbox which is an approximation
  data.forEach(d => {
    d.bbox_parsed = JSON.parse(d.bbox);

    let [x1, y1, x2, y2] = d.bbox_parsed;

    d.biomass = ((x2 - x1) * 0.006904) * ((y2 - y1) * 0.005947);
  });

  // group by deployment_name (mothitor)
  //idk if I should change the names/ add a better label
  const groupedData = d3.group(
    data,
    d => d.deployment_name,
    d => d.date
   );


// calculate species richness per mothitor per day to be able to calculate the mean and median.
const speciesRichness = d3.group(data, (d) => d.species, (d) => d.deployment_name)

function getDailyRichness() {
  const result = [];

  groupedData.forEach((dateMap, station) => {
    const dailyValues = [];

    dateMap.forEach((records, date) => {
      const speciesSet = new Set(records.map(d => d.species));
      dailyValues.push(speciesSet.size);
    });

    result.push({
      deployment_name: station,
      values: dailyValues
    });
  });

  return result;
}

//calculates the mean and median for each value
function getSummary() {
  const result = [];

  groupedData.forEach((dateMap, station) => {
    let values = [];

    if (xVar === "speciesRichness") {
      dateMap.forEach((records, date) => {
        const speciesSet = new Set(records.map(d => d.species));
        values.push(speciesSet.size);
      });

    } else if (xVar === "abundance") {
      dateMap.forEach((records, date) => {
        values.push(records.length);
      });

    } else if (xVar === "biomass") {
      dateMap.forEach((records, date) => {
        records.forEach(d => values.push(d.biomass));
      });
    }

    result.push({
      deployment_name: station,
      mean: d3.mean(values),
      median: d3.median(values)
    });
  });

  return result;
}

  // subgroups (bars per group)
  const subgroups = ["mean", "median"];

  // group names (mothitors)
  const groups = Array.from(groupedData.keys());

  // barXscale (main groups)
  const barX= d3.scaleBand()
    .domain(groups)
    .range([0, width])
    .padding(0.2);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(barX))
    .selectAll("text")
      .attr("transform", "rotate(-30)")
      .style("text-anchor", "end");

  // Y scale
  const barY = d3.scaleLinear()
    .range([height, 0]);

  svg.append("g")
    .attr("class", "y-axis");

  // subgroup scale (within each deployment)
  const xSubgroup = d3.scaleBand()
    .domain(subgroups)
    .range([0, barX.bandwidth()])
    .padding(0.05);

  // colors
  const color = d3.scaleOrdinal()
    .domain(subgroups)
    .range(["#e41a1c", "#377eb8"]);

  function update() {
    const summary = getSummary();

    xSubgroup.domain(subgroups);

    barY.domain([0, d3.max(summary, d => Math.max(d.mean || 0, d.median|| 0))]).nice();
    barX.domain(summary.map(d => d.deployment_name));

    svg.select(".y-axis")
      .transition()
      .duration(500)
      .call(d3.axisLeft(barY));

    const groups = svg.selectAll(".group")
  .data(summary, d => d.deployment_name);

groups.exit().remove();

const groupsEnter = groups.enter()
  .append("g")
  .attr("class", "group");

const groupsMerge = groupsEnter.merge(groups);

groupsMerge
  .transition()
  .duration(500)
  .attr("transform", d => `translate(${barX(d.deployment_name)}, 0)`);
  
    const rects = groupsMerge.selectAll("rect")
      .data(d => subgroups.map(key => ({key : key, value: d[key], deployment_name: d.deployment_name})));
    
    const rectsEnter = rects.enter()
      .append("rect")
      .attr("x", d => xSubgroup(d.key))
      .attr("width", xSubgroup.bandwidth())
      .attr("fill", d => color(d.key))
      .attr("y", height)
      .attr("height", 0)

      .on("mouseover", function(event, d) {
        const station = d3.select(this.parentNode).datum().deployment_name;

        d3.select(this)
          .attr("stroke", "black")
          .attr("stroke-width", 2);

        tooltip
          .style("opacity", 1)
          .html(`<strong>Station:</strong> ${stationMap[station]}<br>
            <strong>Metric:</strong> ${d.key}<br>
            <strong>Value:</strong> ${Math.round(d.value) + " " + unitMap[xVar]}`);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke", "none");
        tooltip.style("opacity", 0);
      });

    rectsEnter.merge(rects)
      .transition()
      .duration(500)
      .attr("x", d => xSubgroup(d.key))
      .attr("width", xSubgroup.bandwidth())
      .attr("y", d => barY(d.value))
      .attr("height", d => height - barY(d.value));
  }

  update();

  // legend
  const legend = svg.append("g");
  
  legend.append("rect")
    .attr("x", width - 40)
    .attr("y", -40)
    .attr("width", 80)
    .attr("height", 50)
    .attr("fill", "white")
    .attr("stroke", "black")
    .attr("stroke-width", 2);
    

  subgroups.forEach((key, i) => {
    const row = legend.append("g")
      .attr("transform", "translate(" + (width - 30) + "," + (-30 + i * 20) + ")");

    row.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", color(key));

    row.append("text")
      .attr("x", 18)
      .attr("y", 10)
      .text(key)
      .style("font-size", "15px")
      .style("font-family", "sans-serif");
  });


// Builds the scatterplot data array by stacking the three station arrays
const scatterData = syd.concat(ama, car);
console.log(scatterData);

// Scatterplot points colors
const colorMap = {
    "SYD": "black",
    "AMA": "#64B5f6",
    "CAR": "orange"
};

// x axis
const x = d3.scaleTime()
    .domain(d3.extent(dates))
    .range([80, 940]);
const xaxis = d3.axisBottom(x);
d3.select('#xaxis')
    .call(xaxis)
    .attr("transform", "translate(0, 600)")
    .append("text")
    //(940-80)/2 + 4
    .attr("x", (940-80)/2 + 90)
    .attr("y", 45)
    .attr("fill", "black")
    .attr("text-anchor", "middle")
    .style("font-size", "15px")
    .text("Date");


// y axis
const y = d3.scaleLinear()
    .domain([300, 0])
    .range([20, 600]);
const yaxis = d3.axisLeft(y);
d3.select('#yaxis')
    .call(yaxis)
    .attr("transform", "translate(80, 0)")
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -300)
    .attr("y", -50)
    .attr("fill", "black")
    .attr("text-anchor", "middle")
    .style("font-size", "15px")
    .text("Number of Moths Observed");


// preparing pie chart
const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(120);

const pie = d3.pie()
    .value(d => d[1]);

const pieColor = d3.scaleOrdinal(d3.schemePaired);
// original color scheme was d3.schemeTableau10, not sure if this one looks better or not but it technically has more colors

// plot scatterplot points
d3.select('#points')
    .selectAll("dot")
    .data(scatterData)
    .enter()
    .append("circle")
        .attr("cx", d => x(d[0]))
        .attr("cy", d => y(d[1]))
        .attr("r", 5)
        .style("fill", d => colorMap[d[2]]);
        // click event for scatterplot

d3.select('#points')
  .selectAll("circle")
  .on("click", function(event, d) {
          const selectedDate = d[0].toISOString();
          const selectedStation = d[2];

          // clear dot highlights
          d3.select('#points')
              .selectAll("circle")
              .attr("r", 5)
              .attr("stroke", "none");

          // highlight this dot
          d3.select(this)
              .attr("r", 10)
              .attr("stroke", "red")
              .attr("stroke-width", 1.5);

          // filters data to matching station + date
          const dailyData = data.filter(e =>
              e.deployment_name === selectedStation && e.date.toISOString() === selectedDate
          );

          // counts occurences of each species
          const speciesCounts = d3.rollup(dailyData, D => D.length, e => e.species);
          const pieData = Array.from(speciesCounts, ([species, count]) => [species || "Unknown", count]);

          // updates title
          d3.select("#pie_title")
            .text(`${stationMap[selectedStation]} landing: ${d[0].toLocaleDateString()}`);

          // Hide pie chart before click
          d3.select("#piechart_container")
              .style("display", "block");

          // build pie chart
          const arcs = 
          d3.select("#arcs")
            .selectAll("path")
            .data(pie(pieData));

          arcs.enter()
              .append("path")
              .merge(arcs)
              .transition().duration(400)
              .attr("d", arc)
              .attr("fill", (d, i) => pieColor(i))
              .attr("stroke", "black")
              .attr("stroke-width", 1.5);

          arcs.exit().remove();

          // pie tooltip
          d3.select("#arcs")
              .selectAll("path")
              .on("mouseover", function(event, d) {
                  d3.select(this)
                    .attr("stroke", "yellow")
                    .attr("stroke-width", 3);
                  tooltip
                      .style("opacity", 1)
                      .html(`<strong>Species:</strong> ${d.data[0]}<br><strong>Count:</strong> ${d.data[1]}`);
              })
              .on("mousemove", function(event) {
                  tooltip
                      .style("left", (event.pageX + 10) + "px")
                      .style("top", (event.pageY - 20) + "px");
              })
              .on("mouseout", function() {
                  d3.select(this)
                    .attr("stroke", "black")
                    .attr("stroke-width", 1.5);
                  tooltip
                    .style("opacity", 0);
              });
      });

// consulted https://d3-graph-gallery.com/graph/custom_legend.html to make a legend for scatterplot
var legendsvg = d3.select("#legendviz");
legendsvg.append("rect").attr("x", 0).attr("y", 10).attr("width", 150).attr("height", 100).attr("fill", "white").attr("stroke", "black").attr("stroke-width", 2);
legendsvg.append("circle").attr("cx",20).attr("cy",30).attr("r", 6).style("fill", "orange");
legendsvg.append("circle").attr("cx",20).attr("cy", 60).attr("r", 6).style("fill", "#64B5f6");
legendsvg.append("circle").attr("cx",20).attr("cy", 90).attr("r", 6).style("fill", "black");
legendsvg.append("text").attr("x", 35).attr("y", 30).text("Small Landing").attr("alignment-baseline","middle");
legendsvg.append("text").attr("x", 35).attr("y", 60).text("Medium Landing").attr("alignment-baseline","middle");
legendsvg.append("text").attr("x", 35).attr("y", 90).text("Large Landing").attr("alignment-baseline","middle");





