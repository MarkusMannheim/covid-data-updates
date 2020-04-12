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
      cards = await page.evaluate(function() {
        let cards = [];
        document.querySelectorAll(".card")
          .forEach(function(d) {
            cards.push(d.querySelector("tspan").innerHTML);
          });
        return cards;
      });
      console.log(cards);
      await page.waitFor(5000);
      browser.close();
      return resolve(data);
    } catch (error) {
      return reject(error);
    }
  });
}

scrape()
  .then(function(data) {
    fs.writeFile("./latestCount.json", JSON.stringify(data), function(error) {
      console.log("\nlatestCount.json written");
    });
  })
  .catch(console.error);
