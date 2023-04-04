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
  budget: 21,
  bid: 5,
  headline: ['Test Headline 01', 'Test Headline 02', 'Test Headline 03'],
}
const runTest = () => {
  readFile()
    .then(async (path) => {
      // init maxtime
      const maxTime = 30000
      //   const { id, userId } = req.body
      let options = new firefox.Options()
      options.setProfile(path)
      options.setPreference('layout.css.devPixelsPerPx', '0.8')
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
        await driver.sleep(2000)
        driver.quit()
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
        await driver
          .findElement(By.className(choose_path_01))
          .click()
          .then(async () => {
            // choose language
            const all_el_language_path =
              "//span[normalize-space()='All languages']"
            await driver.findElement(By.xpath(all_el_language_path)).click()
            // handle next button
            const next_button_path =
              "//dynamic-component[@class='content-element _ngcontent-awn-CM_EDITING-39']//material-ripple[@class='_ngcontent-awn-CM_EDITING-13']"
            await driver
              .findElement(By.xpath(next_button_path))
              .click()
              .then(async () => {
                await handleStep3(driver)
              })
          })
      })
  })
}
const handleStep3 = async (driver) => {
  const max_time = 30000
  const input_budget_path =
    "//input[@aria-label='Set your average daily budget for this campaign']"
  const conditions_01 = until.elementLocated({
    xpath: input_budget_path,
  })
  await driver.wait(conditions_01, max_time).then(async () => {
    const input_budget = await driver.findElement(By.xpath(input_budget_path))
    await input_budget.sendKeys(DATA.budget)
    const input_bid_path =
      "//input[@aria-label='Target cost per install in US Dollar']"
    await driver.findElement(By.xpath(input_bid_path)).sendKeys(DATA.bid)

    const next_button_path =
      "//dynamic-component[@class='content-element _ngcontent-awn-CM_EDITING-39']//material-ripple[@class='_ngcontent-awn-CM_EDITING-13']"
    await driver
      .findElement(By.xpath(next_button_path))
      .click()
      .then(async () => {
        await handleStep4(driver)
      })
  })
}
const handleStep4 = async (driver) => {
  await driver.sleep(3000)
  const max_time = 30000
  // handle confirm button
  const confirm_button_path =
    "//div[@class='content _ngcontent-awn-AWSM-5'][normalize-space()='Confirm']"
  const is_button_next_visible = await driver
    .findElement(By.xpath(confirm_button_path))
    .isDisplayed()
  const button_confirm = await driver.findElement(By.xpath(confirm_button_path))
  if (is_button_next_visible) {
    await driver.executeScript('arguments[0].click()', button_confirm)
  }
  if (DATA.headline && DATA.headline.length > 1) {
    const start_index = 4
    for (const [i, el] of DATA.headline.entries()) {
      // handle headline
      const input_headline_path =
        "(//div[@class='top-section _ngcontent-awn-CM_EDITING-40'])[" +
        (start_index + i) +
        ']'
      const conditions_01 = until.elementLocated({
        xpath: input_headline_path,
      })
      await driver.wait(conditions_01, max_time).then(async () => {
        await driver.findElement(By.xpath(input_headline_path)).sendKeys(el)
      })
    }
  }
  // await driver.wait(is_button_next_visible, max_time).then(async () => {
  //   if (is_button_next_visible) {
  //     await driver.findElement(By.xpath(confirm_button_path)).click();
  //     const input_headline_path = "(//input[@aria-label='Headline 1 of 5'])[1]";
  //     await driver
  //       .findElement(By.xpath(input_headline_path))
  //       .sendKeys(DATA.headline);
  //   } else {
  //     console.log("button next is not visible");
  //   }
  // });
}
runTest()
module.exports = {
  runTest,
}
