const data = await d3.csv('mothitor.csv')

// changing date format from month abbreviation to numerical
const parseTime = d3.timeParse("%b %-d %Y");

for (let i = 0; i < data.length; i++) {
    data[i]['date'] = parseTime(data[i]['date'])
};

// converting to string to delete duplicates
let dateStrings = data.map(d => d.date.toISOString())
dateStrings = Array.from(new Set((dateStrings)))

// storing counts for each date
let counts = []
const grouped = d3.group(data, d => d.date.toISOString())
console.log(grouped)
console.log(dateStrings)

for (let i = 0; i < dateStrings.length; i++) {
    counts.push(grouped.get(dateStrings[i]).length)
}

// turning strings back to date format
let dates = []
for (let i = 0; i < dateStrings.length; i++) {
    dates.push(new Date(dateStrings[i]));
}

// sorting for troubleshooting
const sortedDates = dates.sort((a, b) => a - b);
console.log(sortedDates);

// creating data array for scatterplot
const scatterData = counts.map((val, index) => [val, dates[index]]);

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
        .attr("cx", function (d) { 
            console.log(x(d[1]))
            return x(d[1]); 
        } )
        .attr("cy", function (d) {
            return y(d[0]); 
        } )
        .attr("r", 3)
        .style("fill", "red");

