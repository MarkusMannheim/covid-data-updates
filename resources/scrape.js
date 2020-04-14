puppeteer = require("puppeteer"),
       fs = require("fs"),
       d3 = require("d3");
async function scrape() {
  console.log("establish scraper ...");
  browser = await puppeteer.launch(),
  page = await browser.newPage();
  return new Promise(async function(resolve, reject) {
    try {
      console.log("load ACT Health website ...");
      await page.goto("https://www.covid19.act.gov.au/updates/confirmed-case-information");
      await page.waitForSelector(".col-md-12");
      console.log("load Power BI dashboard ...");
      await page.click(".col-md-12 a");
      dashUrl = await page.evaluate(function() {
        return document.querySelector(".col-md-12 a").href;
      });
      await page.goto(dashUrl);
      await page.waitForSelector(".card")
      latest = await page.evaluate(function() {
        let data = [];
        document.querySelectorAll(".card")
          .forEach(function(d) {
            data.push(d.querySelector("tspan").innerHTML);
          });
        return data;
      });
      latest = {
        recovered: latest[0],
        confirmed: latest[1],
        deaths: latest[2],
        date: latest[3]
      };
      console.log("scraped latest update:");
      console.log(latest);
      browser.close();
      return resolve(latest);
    } catch (error) {
      return reject(error);
    }
  });
}
scrape()
  .then(function(latest) {
    console.log("checking time-series data ...");
    fs.readFile("./actData.csv", "utf8", function(error, oldData) {
      oldData = d3.csvParse(oldData);
      console.log("latest update: " + latest.date);
      console.log("previous update: " + oldData[oldData.length - 1].date);
      if (latest.date !== oldData[oldData.length - 1].date) {
        console.log("updating time-series data ...");
        oldData.push(latest);
        fs.writeFile("./actData.csv", d3.csvFormat(oldData, ["date", "confirmed", "recovered", "deaths"]), function(error) {
            console.log("./actData.csv written");
          });
      }
    });
  })
  .catch(console.error);
