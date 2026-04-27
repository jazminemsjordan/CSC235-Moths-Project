const data = await d3.csv('mothitor.csv')
const tooltip = d3.select("#tooltip");
console.log(data)
// bar chart
/// dimensions
let margin = 50;
let width = 500;
let height = 500;

// dropdown 
let xVar = "biomass";
d3.select("#xSelect").on("change", function () {
  xVar = this.value;
  update();
});


var svg = d3.select("#bar_chart")
  .append("svg")
    .attr("width", (width + margin*2))
                    .attr("height", (height + margin*2))
                    .append("g")
                        .attr("transform", `translate(${margin},${margin})`); 



  // calculate biomass per row usng bbox which is an approximation
  //still need to remove outliers if time ex. {[62.0, 5374.0, 1615.0, 6944.0]} which is unrealistic.
  data.forEach(d => {
    d.bbox_parsed = JSON.parse(d.bbox);

    let [x1, y1, x2, y2] = d.bbox_parsed;

    d.biomass = (x2 - x1) * (y2 - y1);
  });

  // calculate species richness per mothitor 
  const speciesRichness = d3.group(data, (d) => d.species, (d) => d.deployment_name)

  // group by deployment_name (mothitor)
  //idk if I should change the names/ add a better label
  const groupedData = d3.group(data, d => d.deployment_name);



  // summarize data
  function getSummary() {
    return Array.from(groupedData, ([key, values]) => {
      let arr;
      if (xVar === "biomass"){
        arr = values.map(d => d.biomass);
      }
      else if (xVar === "abundance"){
        arr = values.map(d => 1);
      }
      else if (xVar === "speciesRichness"){
        const speciesSet = new Set(values.map(d => d.species));
        arr = Array(speciesSet.size).fill(1);
      }

      return {
      deployment_name: key,
      mean: d3.mean(arr),
      median: d3.median(arr)
      };
    });
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

    barY.domain([0, d3.max(summary, d => Math.max(d.mean, d.median))]).nice();

    svg.select(".y-axis")
      .transition()
      .duration(500)
      .call(d3.axisLeft(barY));

    const groups = svg.selectAll(".group")
      .data(summary, d => d.deployment_name);

    const groupsEnter = groups.enter()
      .append("g")
      .attr("class", "group")
      .attr("transform", d => `translate(${barX(d.deployment_name)}, 0)`);

    const groupsMerge = groupsEnter.merge(groups)

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
          .html(`<strong>Station:</strong> ${station}<br>
            <strong>Metric:</strong> ${d.key}<br>
            <strong>Value:</strong> ${Math.round(d.value)}`);
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
  const legend = svg.append("g")
    .attr("transform", "translate(" + (width - 100) + ",20)");

  subgroups.forEach((key, i) => {
    const row = legend.append("g")
      .attr("transform", "translate(0," + i * 20 + ")");

    row.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", color(key));

    row.append("text")
      .attr("x", 18)
      .attr("y", 10)
      .text(key)
      .style("font-size", "12px");
  });
// changing date format from month abbreviation to numerical
const parseTime = d3.timeParse("%b %-d %Y");

for (let i = 0; i < data.length; i++) {
    data[i]['date'] = parseTime(data[i]['date'])
};

// converting to string to delete duplicates
let dateStrings = data.map(d => d.date.toISOString())
dateStrings = Array.from(new Set((dateStrings)))

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

// Builds the scatterplot data array by stacking the three station arrays
const scatterData = syd.concat(ama, car)
console.log(scatterData)

// (LORELEI) COLORS FOR SCATTERPLOT POINTS SHOULD BE COLORBLIND FRIENDLY!! 
const colorMap = {
    "SYD": "black",
    "AMA": "#64B5f6",
    "CAR": "orange"
};

// x axis
const x = d3.scaleTime()
    .domain(d3.extent(dates))
    .range([40, 940]);
const xaxis = d3.axisBottom(x)
d3.select('#xaxis')
    .call(xaxis)
    .attr("transform", "translate(0, 600)")


// y axis
const y = d3.scaleLinear()
    .domain([300, 0])
    .range([20, 600]);
const yaxis = d3.axisLeft(y);
d3.select('#yaxis')
    .call(yaxis)
    .attr("transform", "translate(40, 0)")


// plot scatterplot points
d3.select('#points')
    .selectAll("dot")
    .data(scatterData)
    .enter()
    .append("circle")
        /* (LORELEI) WHY CANT IT JUST BE ".attr("cx", d => x(d.date))" AND ".attr( "cy", d => y(d.count))"
         FOR THE BELOW CODE? */
        /* answer: we can do the pointers like that! I switched it. The function line was a bit unwieldy, you're right.
        we can't use .date and .count because they don't exist in scatterdata. it's a new, basic array. it doesn't have named columns, so we need to index numerically
        the data index read from the csv creates an array of objects, which each have a key (column name) and a value (actual data). scatterData doesn't have that functionality.
        */
        /* (LORELEI) THANK YOU!! I DO NOT HAVE A STRING GRASP ON THE FUNDAMENTALS OF HOW ALL THIS WORKS LOL */
        .attr("cx", d => x(d[0]))
        .attr("cy", d => y(d[1]))
        .attr("r", 3)
        .style("fill", d => colorMap[d[2]]); 

/* (LORELEI) VERY BASIC LEGEND, I DON'T LIKE THE LOCATION BUT HAVING HARD TIME WITH MOVING IT
  DEFINITELY MORE EFFFICIENT METHODS BUT IT DOES WORK, CONSULTED https://d3-graph-gallery.com/graph/custom_legend.html
*/

var legendsvg = d3.select("#legendviz");
legendsvg.append("circle").attr("cx",20).attr("cy",100).attr("r", 6).style("fill", "black");
legendsvg.append("circle").attr("cx",20).attr("cy", 130).attr("r", 6).style("fill", "#64B5f6");
legendsvg.append("circle").attr("cx",20).attr("cy", 160).attr("r", 6).style("fill", "orange");
legendsvg.append("text").attr("x", 35).attr("y", 100).text("SYD").style("font-size", "15px").attr("alignment-baseline","middle");
legendsvg.append("text").attr("x", 35).attr("y", 130).text("AMA").style("font-size", "15px").attr("alignment-baseline","middle");
legendsvg.append("text").attr("x", 35).attr("y", 160).text("CAR").style("font-size", "15px").attr("alignment-baseline","middle");
