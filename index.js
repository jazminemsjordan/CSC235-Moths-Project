const data = await d3.csv('mothitor.csv')
console.log(data)

// bar chart
/// dimensions
let margin = 50;
let width = 500;
let height = 500;

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

  // group by deployment_name (mothitor)
  //idk if I should change the names/ add a better label
  const groupedData = d3.group(data, d => d.deployment_name);

  // helper function for mode
  function getMode(arr) {
    const counts = {};
    arr.forEach(v => {
      counts[v] = (counts[v] || 0) + 1;
    });
    return +Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  // summarize data
  const summary = Array.from(groupedData, ([key, values]) => {
    const biomass = values.map(d => d.biomass);

    return {
      deployment_name: key,
      mean: d3.mean(biomass),
      median: d3.median(biomass),
      mode: getMode(biomass)
    };
  });

  // subgroups (bars per group)
  const subgroups = ["mean", "median", "mode"];

  // group names (mothitors)
  const groups = summary.map(d => d.deployment_name);

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
    .domain([0, d3.max(summary, d => Math.max(d.mean, d.median, d.mode))])
    .nice()
    .range([height, 0]);

  svg.append("g")
    .call(d3.axisLeft(barY));

  // subgroup scale (within each deployment)
  const xSubgroup = d3.scaleBand()
    .domain(subgroups)
    .range([0, barX.bandwidth()])
    .padding(0.05);

  // colors
  const color = d3.scaleOrdinal()
    .domain(subgroups)
    .range(["#e41a1c", "#377eb8", "#4daf4a"]);

  // draw bars
  svg.append("g")
    .selectAll("g")
    .data(summary)
    .enter()
    .append("g")
      .attr("transform", d => "translate(" + barX(d.deployment_name) + ",0)")
    .selectAll("rect")
    .data(d => subgroups.map(key => ({ key: key, value: d[key] })))
    .enter()
    .append("rect")
      .attr("x", d => xSubgroup(d.key))
      .attr("y", d => barY(d.value))
      .attr("width", xSubgroup.bandwidth())
      .attr("height", d => height - barY(d.value))
      .attr("fill", d => color(d.key));

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
    "AMA": "blue", 
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
        .attr("cx", d => x(d[0]))
        .attr("cy", d => y(d[1]))
        .attr("r", 3)
        .style("fill", d => colorMap[d[2]]); 

