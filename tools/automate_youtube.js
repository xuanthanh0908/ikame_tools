const { Builder, Browser, By, Key, until } = require('selenium-webdriver')
const axios = require('axios')
const firefox = require('selenium-webdriver/firefox')
const webdriver = require('selenium-webdriver')
const ApiError = require('../utils/apiError')
const catchAsync = require('../utils/catchAsync')
const { readFile } = require('../utils/readfile')
const { emitEvent } = require('../utils/socket')
const fs = require('fs')
// const backend_campaign_url = "https://api.ikamegroup.com/api/v1";
const backend_campaign_url = 'http://localhost:9000/api/v1'
const url = {
  ADSGROUP: '/ads-asset',
}
const DATA = {
  video_path: 'C:\\Users\\Admin\\Videos\\Video',
  title: ['Title 01', 'Title 02'],
  desc: ['Description 01', 'Description 02'],
  playlist: 'Test 03',
}
/// clear input
const clearInput = async (el) => {
  await el.sendKeys(Key.CONTROL, 'a')
  await el.sendKeys(Key.DELETE)
}

const run_Now = () => {
  //   const { id, userId } = req.body
  //   const DATA = req.data
  // console.log("=============DATA==============", DATA);
  const max_time = 70000
  let posX = 0
  let posY = 0
  return new Promise(async (resolve, reject) => {
    readFile()
      .then(async (path) => {
        // init maxtime
        let options = new firefox.Options()
        options.setProfile(path)
        options.setPreference('layout.css.devPixelsPerPx', '0.7')
        //To wait for browser to build and launch properly
        let driver = await new webdriver.Builder()
          .forBrowser('firefox')
          .setFirefoxOptions(options)
          .build()
        driver.manage().window().maximize()
        try {
          await driver.get('https://studio.youtube.com')
          //   await driver.manage().window().setRect({
          //     width: 960,
          //     height: 1080,
          //     x: posX,
          //     y: posY,
          //   })

          // wait for button upload video showing
          const btn_upload_path = "//ytcp-icon-button[@id='upload-icon']"
          const condition = until.elementLocated({
            xpath: btn_upload_path,
          })
          await driver.wait(condition, max_time).then(async () => {
            await driver
              .findElement(By.xpath(btn_upload_path))
              .click()
              .then(async () => {
                const files = fs.readdirSync(DATA.video_path)
                const filePaths = files.map(
                  (file) => `${DATA.video_path}\\${file}`,
                )

                // Upload
                const input_upload_path = "//input[@name='Filedata']"
                await driver
                  .findElement(By.xpath(input_upload_path))
                  .sendKeys(filePaths[0])
                const input_title_path = "(//div[@id='textbox'])[1]"
                const condition_02 = until.elementLocated({
                  xpath: input_title_path,
                })
                await driver.wait(condition_02, max_time).then(async () => {
                  /// handle title input
                  const title = await driver.findElement(
                    By.xpath(input_title_path),
                  )
                  await clearInput(title)
                  await title.sendKeys(DATA.title[0])

                  /// handle desc input
                  const desc_input_path = "(//div[@id='textbox'])[2]"
                  const desc = await driver.findElement(
                    By.xpath(desc_input_path),
                  )
                  await clearInput(desc)
                  await desc.sendKeys(DATA.desc[0])
                  // handle choose playlist
                  const playlist_path =
                    "(//div[@class='right-container style-scope ytcp-dropdown-trigger'])[1]"
                  const playlist = await driver.findElement(
                    By.xpath(playlist_path),
                  )
                  await playlist.click().then(async () => {
                    const find_playlist_name =
                      "//span[contains(text(),'" + DATA.playlist + "')]"
                    const condition_03 = until.elementLocated({
                      xpath: find_playlist_name,
                    })
                    await driver.wait(condition_03, max_time).then(async () => {
                      const playlist_checked = await driver.findElement(
                        By.xpath(find_playlist_name),
                      )
                      await driver.executeScript(
                        'arguments[0].click()',
                        playlist_checked,
                      )
                      // close playlist
                      const btn_done_path = "//div[normalize-space()='Xong']"
                      await driver.findElement(By.xpath(btn_done_path)).click()
                    })
                  })
                  // handle choose options - for children
                  const options_path = "(//div[@id='offRadio'])[1]"
                  await driver.findElement(By.xpath(options_path)).click()
                  // handle next button
                  const btn_next_path = "//ytcp-button[@id='next-button']"
                  await driver
                    .findElement(By.xpath(btn_next_path))
                    .click()
                    .then(() => resolve('Run test successfully'))
                    .catch(reject)
                })
              })
          })
        } finally {
          //
          await driver.sleep(2000)
          // driver.quit();
        }
      })
      .catch((err) => {
        console.log('RUN TEST FAILED', err)
        // updateAdsGroupCampaign(id, 'canceled', userId)
      })
  })
}

run_Now()
