# CSC235 Moths Project
## Contributors
- Jazmine Jordon
- Scarlett Lopez
- Krystal Bautista
- Emma McRedmond
- Lorelei Barnum

## Contact
If there are any questions about our graphs, data, or website, you can reach out to any one of the following:
- Jazmine Jordan at jmjordan@smith.edu
- Krystal Bautista at hbautista@smith.edu
- Lorelei Barnum at loreleibarnum@outlook.com

## Overview of Project
This project was conducted using data provided by Dr. Mariana Abarca at Smith College through her moth monitoring project, referred to as Mothitor, at MacLeish Field Station. The project investigates whether landing surface size affects moth diversity estimates.
To assist with Dr. Abarca's research, we built a website that contains two main plots: a bar graph and a scatter plot. Both of these plots are interactive. The bar chart allows you to change the y-axis variable by biomass, species richness, and abundance. The scatter plot allows the user to click a point that expands it out to a pie chart breakdown of moth species by date.

## How to View Website
To view the website, the user can host an HTTP server on their machine by downloading the GitHub zip file containing all the files. To do this, the user first must go to the drop-down selection titled "Code" on this repository and click the option "download ZIP." Additionally, the user must also have the Node.js package installed. If they do not, they can install it from the Node.js [website](https://nodejs.org/en/download/). The user must open their terminal and run the following command: "npm install -g http-server" to download the http-server package, which will allow them to start a static HTTP server. Next, the user should put the following into the terminal to open the website: "npx http-server /pathtotherproject -o -p 8080". This should open up a local server containing our website. If a user attempts to open the index.html files directly, the website will not display the graphs we have built correctly.

*This website is not phone friendly*

## Guide to mothitor.csv
The mothitor.csv file is the data-wrangled version of the original JSON file given to us by Dr. Abarca. It was a large, complicated file (291 pages and 69.5MB!) with several layers of nested arrays and lots of redundant information. Using the Python Pandas library for data processing, we simplified the JSON into a CSV file with 18 columns. Each row represents one observed moth.

| Variable Name | Stored Value | Notes |
| ------- | --------- | --------- |
| id | 6 digit integer | ID number of the observation. Unique for each row.|
| determination_score | integer between 0 and 1 | Determination score representing the confidence the Mothitor program has in its identification. 1.0 is certain, 0 is not certain at all.|
| determination_id | 1 to 5 digit integer | ID number of the moth identification. All observations of the same species will have the same determination ID. A notable value is 11613, which is the ID for "Not Lepidoptera". All observations that are not moths will have this id, and are thus excluded from the visualizations.|
| event_id | 4 to 5 digit integer | ID number for the Mothitor "event": one day of observations at one station. This is shared between all observations on the same date at the same station. The four digit values are older, from 2024, and are not included in the visualization.| 
| date | Date in the form Mon D YYYY | Date of the observation. Format is the three letter month abbreviation, followed by the unpadded day (1, not 01, for example) and four digit year.|
| deployment_id | 3 digit integer | ID number for the station the observation was made at. Only three possible values: 296 for SYD (large landing surface), 297 for AMA (medium landing surface), and 325 for CAR (small landing surface).|
| deployment_name | String, 3 letters | Station code for the landing surface the observation was made at. SYD represents the large landing surface, AMA represents the medium landing surface, and CAR represents the small landing surface.|
| phylum | string | The phylum the identified moth belongs to (missing value if the phylum can't be identified or the observation is Not Lepidoptera).
| class | string | The class the identified moth belongs to (missing value if the class can't be identified or the observation is Not Lepidoptera).
| order | string | The order the identified moth belongs to. Marked "Not Lepidoptera" if the identification isn't a moth. This can happen if another insect lands on the landing surface, or even a leaf is blown onto it and captured by the camera.
| superfamily | string | The superfamily the identified moth belongs to (missing value if the superfamily can't be identified or the observation is Not Lepidoptera).
| family | string | The family the identified moth belongs to (missing value if the family can't be identified or the observation is Not Lepidoptera).
| subfamily | string | The subfamily the identified moth belongs to (missing value if the subfamily can't be identified or the observation is Not Lepidoptera).
| tribe | string | The tribe the identified moth belongs to (missing value if the tribe can't be identified or the observation is Not Lepidoptera).
| subtribe | string | The subtribe the identified moth belongs to (missing value if the subtribe can't be identified or the observation is Not Lepidoptera).
| genus | string | The genus the identified moth belongs to (missing value if the genus can't be identified or the observation is Not Lepidoptera).
| species | string | The species of the identified moth (missing value if the species can't be identified or the observation is Not Lepidoptera).
| bbox | 4 float array | The coordinates of the bounding box drawn around the moth. Used to estimate size. Format is [x1 y1 x2 y2].
