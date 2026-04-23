const data = await d3.csv('mothitor.csv')
console.log(data)
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
