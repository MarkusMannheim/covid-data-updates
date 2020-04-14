const puppeteer = require("puppeteer"),
      d3 = require("d3");
      fs = require("fs");

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
      dashUrl = await page.evaluate(function() {
        return document.querySelector(".col-md-12 a").href;
      });
      await page.goto(dashUrl);
      await page.waitForSelector(".card");
      console.log("scrape latest counts ...");
      latest = await page.evaluate(function() {
        let cards = [];
        document.querySelectorAll(".card")
          .forEach(function(d) {
            cards.push(d.querySelector("tspan").innerHTML);
          });
        return cards;
      });
      latest = {
        confirmed: latest[1],
        recovered: latest[0],
        deaths: latest[2],
        date: latest[3]
      };
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
    console.log("loading historical data ...");
    fs.readFile("./actData.csv", "utf8", function(error, data) {
      if (error) throw error;
      oldData = d3.csvParse(data);
      console.log("latest update: " + latest.date);
      console.log("previous update: " + oldData[oldData.length - 1].date);
      if (latest.date !== oldData[oldData.length - 1].date) {
        console.log("adding latest update to archive ...");
        oldData.push(latest);
        fs.writeFile("./actData.csv", d3.csvFormat(oldData, oldData.columns), function(error) {
          console.log("./actData.csv written");
        });
      }
    });
  })
  .catch(console.error);
