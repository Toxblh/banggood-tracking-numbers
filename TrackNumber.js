const puppeteer = require('puppeteer')
const dayjs = require('dayjs')
const axios = require('axios')
const notifier = require('node-notifier')

const config = require('./config')

function sendMessage(text) {
  axios.post(`https://api.telegram.org/bot${config.telegram.token}/sendMessage`, {
    text: text,
    chat_id: config.telegram.chat_id
  })
}

async function getPage() {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--window-position=0,0',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-spki-list',
    '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'
  ]

  const options = {
    args,
    headless: true,
    ignoreHTTPSErrors: true
  }

  const browser = await puppeteer.launch(options)
  const page = await browser.newPage()
  page.setViewport({
    width: 1920,
    height: 1000
  })

  await page.goto('https://www.banggood.com/login.html', {
    waitUntil: 'networkidle0'
  })

  await page._client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: './'});

  page.on('response', response => {
    if (response.url() === 'https://www.banggood.com/index.php?com=account&t=download') {
      console.log(response)
      // response.json().then(report => (userReport = report))
    }
  })

  await page.focus('#login-email')
  await page.keyboard.type(config.banggood.email)

  await page.focus('#login-pwd')
  await page.keyboard.type(config.banggood.password)

  await page.waitFor(2000)
  const i1 = await page.$('#login-submit')
  await i1.click()

  await page.waitFor(2000)

  await page.goto('https://www.banggood.com/index.php?com=account&t=download')

  await page.waitFor(2000)


}

getPage()
