const { Builder, Browser, By, Key, until } = require('selenium-webdriver')
const axios = require('axios')
const firefox = require('selenium-webdriver/firefox')
const webdriver = require('selenium-webdriver')
const ApiError = require('../utils/apiError')
const catchAsync = require('../utils/catchAsync')
const { emitEvent } = require('../utils/socket')
const { readFile } = require('../utils/readfile')
const backend_campaign_url = 'https://api.ikamegroup.com/api/v1'
const url = {
  CAMPAIGN: '/campaign',
}

const DATA = {
  campaign_url:
    'https://ads.google.com/aw/campaigns/new?ocid=1048467088&workspaceId=0&cmpnInfo=%7B%228%22%3A%22a1F49EFB3-26F5-4511-9518-D644D597B9BB--50%22%7D&euid=840505868&__u=5695221932&uscid=1048467088&__c=7066397712&authuser=1',
  type_app: 'iOS',
  app_id: '1659186258',
  campaign_name: 'Campaign 01',
}
const runTest = () => {
  readFile()
    .then(async (path) => {
      // init maxtime
      const maxTime = 30000
      //   const { id, userId } = req.body
      let options = new firefox.Options()
      options.setProfile(path)
      let checked = false
      //To wait for browser to build and launch properly
      let driver = await new webdriver.Builder()
        .forBrowser('firefox')
        .setFirefoxOptions(options)
        .build()
      try {
        await driver.get(DATA.campaign_url)
        const app_promote_path =
          "//dynamic-component[@data-value='APP_DOWNLOADS']//div[@class='card card--secondary _ngcontent-awn-CM_EDITING-11']//div[@class='unified-goals-card-format _ngcontent-awn-CM_EDITING-10']"
        await driver.findElement(By.xpath(app_promote_path)).click()

        /// wait for load down components loaded
        const some_path_loading = "//div[normalize-space()='Android']"
        const conditions_01 = until.elementLocated({
          xpath: some_path_loading,
        })
        await driver.wait(conditions_01, maxTime).then(async () => {
          const type_app_path =
            "//div[normalize-space()='" + DATA.type_app + "']"
          await driver
            .findElement(By.xpath(type_app_path))
            .click()
            .then(async () => {
              // search your app
              const input_search_app =
                'input[type="text"]._ngcontent-awn-CM_EDITING-28'
              const input_active_element = driver.findElement(
                By.css(input_search_app),
              )
              await input_active_element
                .sendKeys(DATA.app_id)
                .then(async () => {
                  const select_app_path =
                    '.app-info._ngcontent-awn-CM_EDITING-33'

                  const conditions_02 = until.elementLocated({
                    css: select_app_path,
                  })
                  await driver.wait(conditions_02, maxTime).then(async () => {
                    await driver.findElement(By.css(select_app_path)).click()

                    const campaign_name_css_path =
                      'input[type="text"]._ngcontent-awn-CM_EDITING-28'
                    const campaign_input = await driver.findElement(
                      By.css(campaign_name_css_path),
                    )
                    campaign_input.clear()
                    driver.sleep(1000)
                    campaign_input.sendKeys(DATA.campaign_name)

                    /// next button
                    const button_next_path =
                      "//material-button[@aria-label='Continue to the next step']//material-ripple[@class='_ngcontent-awn-CM_EDITING-13']"
                    const conditions_03 = until.elementLocated({
                      xpath: button_next_path,
                    })
                    await driver.wait(conditions_03, maxTime).then(async () => {
                      const button = await driver.findElement(
                        By.xpath(button_next_path),
                      )
                      await driver
                        .executeScript('arguments[0].click()', button)
                        .then(async () => {
                          await handleStep2(driver)
                        })
                    })
                  })
                })
            })
        })
      } finally {
        //
      }
    })
    .catch((err) => console.log(err))
}

const handleStep2 = async (driver) => {
  const max_time = 30000
  const find_are_loading_path = 'title _ngcontent-awn-CM_EDITING-57'
  const conditions_01 = until.elementLocated({
    className: find_are_loading_path,
  })
  await driver.wait(conditions_01, max_time).then(async () => {
    // dropdown location options
    const click_01 = await driver.findElement(
      By.className(find_are_loading_path),
    )
    await driver
      .executeScript('arguments[0].click()', click_01)
      .then(async () => {
        const choose_path_01 = 'top-section _ngcontent-awn-CM_EDITING-28'
        await driver.findElement(By.className(choose_path_01)).click()

        // choose language
        const all_el_language_path = 'dynamic-item _ngcontent-awn-CM_EDITING-32'
        // scroll to top
        const choseEl = await driver.findElement(
          By.className(all_el_language_path),
        )
        await driver
          .executeScript('arguments[0].scrollTop = 0;', choseEl)
          .then(async () => {
            // // wait for element visible
            // const condition_04 = until.elementLocated({
            //   className: all_el_language_path,
            // })
            // await driver.wait(condition_04, max_time).then(async () => {
            //   // double choose all lang
            //   const choseEl = await driver.findElement(
            //     By.className(all_el_language_path),
            //   )
            // })
            //   await driver.actions({ bridge: true }).doubleClick(choseEl).perform()
          })
      })
  })
}
runTest()
module.exports = {
  runTest,
}
