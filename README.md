# CSC235 Moths Project
## Contributors
- Jazmine Jordon
- Scarlett Lopez
- Krystal Bautista
- Emma McRedmond
- Lorelei Barnum
## Contact
If there are any questions about our graphs, data, or website, please reach out to []

## Overview of Project
This project was conducted using data provided by Dr. Mariana Abarca at Smith College through her moth monitoring project
at Macleish referred to as Mothitor. The project investigates the question, does landing surface size affect moth diversity estimates?
To assist with Dr. Abarca's research question, we built a website that contains two plots, a bar graph and scatterplot,
with the data provided. Both of these plots are interactable. The bar chart allows you to change the x-axis variable
by biomass, species richness, and abundance. The scatter plot allows the user to click a point to expand it out to a pie chart
breakdown of the moth species by date.

## How to View Website
To view the website, the user can host their own local service on their machine by downloading this. To do this the user first must ensure they have
the node.js package installed. If they do not, they can install it from the node.js [website](https://nodejs.org/en/download/).
The user must open their terminal and can put in the following command: "npm install -g http-server" to download the http-server
package that will allow the user to open a static HTTP server. Next, the user should put the following into the terminal
to open website: "npx http-server /path -o -p 8080". This should open up a local server with the website!

## Guide to mothitor.csv
The mothitor.csv file is the data wrangled version
