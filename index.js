/* (LORELEI) WHATS HAPPENING?
    I HAVE ADDED MY IDEAS SO FAR ON HOW TO GO ABOUT ADDING STATIONS.
    THESE IDEAS FOR CODE ARE NOT FINAL AND DO NOT WORK YET, BUT I WANTED TO GET THEM DOWN SOMEWHERE.
    WE SHOULD ADD A LEGEND TO THE SCATTERPLOT TO EXPLAIN WHICH COLOR CORRESPONDS TO WHICH DEPLOYMENT_ID/NAME. 
    ALSO, I REALIZED WE ARE USING DEPLOYMENT_ID INSTEAD OF DEPLOYMENT_NAME, BUT IT IS EASILY CHANGED.
    IF STATIONS DON'T ACTUALLY CORRESPONT TO DEPLOYMENTS NONE OF THIS IS VALID LOL.
*/

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
// (LORELEI) REPLACE BELOW CODE!!
const grouped = d3.group(data, d => d.date.toISOString())
/* (LORELEI) ^^^^REPLACE THIS WITH THE BELOW CODE^^^
    const grouped = d3.group(data,
    d => d.date.toISOString(),
    d => d.deployment_id
);*/
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
// (LORELEI) SCATTERPLOT ARRAY NEEDS TO BE EDITED TO INCLUDE DEPLOYMENT_ID, 
const scatterData = counts.map((val, index) => [val, dates[index]]);
/* I'M NOT SURE ENTIRELY HOW TO GO ABOUT THIS. BELOW IS THE SUGGESTED METHOD BY VS CODE ON MY CODE ATTEMPT AT IT THAT DIDNT WORK. 
I WOULD NOT SUGGEST BLINDLY TRUSTING IT

const scatterData = [];
for (const [dateStr, deployments] of grouped) {
    for (const [deploymentId, observations] of deployments) {
        scatterData.push({
            count: observations.length,
            date: new Date(dateStr),
            deployment_id: deploymentId
        });
    }
} */

/* (LORELEI) COLORS FOR SCATTERPLOT POINTS SHOULD BE COLORBLIND FRIENDLY!!
    ALSO WE SHOULD BE EASILY ABLE TO CHANGE TO DEPLOYMENT_NAME SINCE I REALIZED HERE WE ARE USING THE ID*/
/*const colorMap = {
    "296": "black",
    "297": "blue", 
    "325": "orange"
};*/

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
        .attr("cx", function (d) { 
            console.log(x(d[1]))
            return x(d[1]); 
        } )
        .attr("cy", function (d) {
            return y(d[0]); 
        } )
        .attr("r", 3)
        // (LORELEI) CODE BELOW NEEDS TO BE ADDED TO HAVE COLOR BE BY DEPLOYMENT_ID
        /*.style("fill", d => colorMap[d.deployment_id]); */

