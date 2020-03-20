const puppeteer = require("puppeteer");
const axios = require("axios");
const csv = require("csv-parser");
const fs = require("fs");
const dayjs = require("dayjs");
const results = [];
const FileOreders = "./orders.xls";

const config = require("./config");

async function getPage() {
  const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-infobars",
    "--window-position=0,0",
    "--ignore-certifcate-errors",
    "--ignore-certifcate-errors-spki-list",
    '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'
  ];

  const options = {
    args,
    headless: true,
    ignoreHTTPSErrors: true
  };

  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  page.setViewport({
    width: 1920,
    height: 1000
  });

  await page.goto("https://www.banggood.com/login.html", {
    waitUntil: "networkidle0"
  });
  console.info("Open Banggood...");

  await page._client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: "./"
  });

  await page.focus("#login-email");
  await page.keyboard.type(config.banggood.email);
  console.info("Typing email...");

  await page.focus("#login-pwd");
  await page.keyboard.type(config.banggood.password);
  console.info("Typing password...");

  await page.waitFor(2000);
  const i1 = await page.$("#login-submit");
  await i1.click();
  console.info("Login inside...");
  try {
    await page.waitFor(2000);
    console.info("Wait 2 seconds...");

    await page.goto(
      "https://www.banggood.com/index.php?com=account&t=download"
    );
    console.info("Download orders...");
  } catch (e) {
    console.info("Downloaded");
  } finally {
    await page.waitFor(2000);
    page.close();
  }
}

const deleteOldFile = () => {
  if (fs.existsSync(FileOreders)) {
    fs.unlinkSync(FileOreders);
  }
};

const readfile = cb => {
  fs.createReadStream(FileOreders)
    .pipe(
      csv({
        separator: "\t"
      })
    )
    .on("data", data => results.push(data))
    .on("end", () => {
      const out = [];
      results.forEach(item => {
        if (
          item.Status !== "Order Completed" &&
          item["Tracking Number "] != " "
        ) {
          out.push({
            OrderID: Number(item.OrderID),
            "Tracking Number": item["Tracking Number "],
            Date: item["Date"],
            Price: Number(item["Grand Total"]).toFixed(2)
          });
        }
      });

      saveResult(out);
    });
};

const saveResult = values => {
  console.table(
    values.sort((a, b) => dayjs(b.Date).unix() - dayjs(a.Date).unix())
  );

  const temp = [];
  temp.push(Object.keys(values[1]));
  values.forEach(item => {
    temp.push([item.OrderID, item["Tracking Number"], item.Date, item.Price]);
  });

  var file = fs.createWriteStream("orders.csv");
  file.on("error", function(err) {
    console.error('smth wrong')
  });
  file.on("close", () => {
    process.exit();
  });
  temp.forEach(v => {
    file.write(v.join(",") + "\n");
  });
  file.end();
};

async function main() {
  deleteOldFile();
  await getPage();
  readfile(saveResult);
}

main();
