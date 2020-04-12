puppeteer = require("puppeteer"),
fs = require("fs");

async function scrape() {
  console.log("\nestablish scraper ...");
  browser = await puppeteer.launch({headless: false}),
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
      data = {
        latest: {
          recovered: latest[0],
          confirmed: latest[1],
          deaths: latest[2],
          date: latest[3]
        }
      };
      console.log("scraped latest update:");
      console.log(data.latest);
      console.log("load time-series data ...");
      console.log(document.querySelector(".pbi-glyph-chevronrightmedium"));
      await page.waitForSelector("input");
      browser.close();
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}

scrape()
  .then(function(data) {
    fs.writeFile("./scrapeData.json", JSON.stringify(data), function(error) {
      console.log("\nscrapeData.json written");
    });
  })
  .catch(console.error);
