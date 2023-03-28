const { Builder, Browser, By, Key, until } = require('selenium-webdriver')
const firefox = require('selenium-webdriver/firefox')
const webdriver = require('selenium-webdriver')

const profile =
  'C:\\Users\\Admin\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles\\rumfsn1i.default-release'
const data = {
  url_campaign:
    'https://ads.tiktok.com/i18n/creation/campaign?aadvid=7197011714712305665',
  campaign_name: 'test',
  app_name: 'Cast for Chromecast & TV Cast',
  locations: ['Malaysia'],
}

//

// wait for driver hover hidden parent element
const mouseHoverElement = (el, driver) => {
  driver.executeScript(
    "arguments[0].dispatchEvent(new MouseEvent('mouseover', {bubbles: true}));",
    el,
  )
}
// wait for targeting to be active
const handleWaitToTargeting = async (driver) => {
  const xpathCheck = "//label[normalize-space()='Location']"
  const maxTime = 30000
  const condition = until.elementsLocated({
    xpath: xpathCheck,
  })
  await driver.wait(condition, maxTime).then(async function () {
    // await driver.findElement(By.className("vi-icon2-edit")).click();
    // Find the element that causes the hidden element to appear
    const triggerElement = await driver.findElement(By.xpath(xpathCheck))

    // Move the mouse over the trigger element to make the hidden element visible
    driver.actions().move({ origin: triggerElement }).perform()

    // Find the hidden element now that it is visible
    const scrollElement = await driver.findElement(By.id('target-title'))
    driver.executeScript('arguments[0].scrollIntoView(true);', scrollElement)
    mouseHoverElement(triggerElement, driver)
    const hiddenElementXpath =
      "//button[@class='vi-button vi-byted-button vi-button--text index_spcLocationEditBtn_Y2bQH']//span[contains(text(),'Edit')]"
    await driver
      .wait(
        until.elementsLocated({
          xpath: hiddenElementXpath,
        }),
        maxTime,
      )
      .then(async function () {
        await driver.findElement(By.xpath(hiddenElementXpath)).click()
        const inputPath =
          "//div[@class='vi-select-tree index_locationFormItem_dP0yb']//div//div[@class='vi-select-tree-inside-container']"
        const findInputEl = await driver.findElement(By.xpath(inputPath))
        driver.executeScript(
          "arguments[0].dispatchEvent(new MouseEvent('mouseover', {bubbles: true}));",
          findInputEl,
        )
        const x_close_path = "//i[@class='right-icon vi-icon-circle-close']"
        const condition_close = until.elementLocated({
          xpath: x_close_path,
        })
        await driver.wait(condition_close, maxTime).then(async (e) => {
          await driver.findElement(By.xpath(x_close_path)).click()
          driver.executeScript('arguments[0].click();', xpathCheck)
          findInputEl.click()
        })
      })
  })
}

// wait for switch status to be active
const waitSwitchStatus = async (driver) => {
  // await driver until.elementLocated find element success
  const xpath =
    "//div[@data-tea='create_campaign_spc_status']//div[@role='switch']"
  const condition = until.elementLocated({
    xpath: xpath,
  })
  const maxTime = 30000
  await driver.wait(condition, maxTime).then(async function () {
    await driver
      .findElement(
        By.xpath(
          "//div[@data-tea='create_campaign_spc_status']//div[@role='switch']",
        ),
      )
      .click()

    clearInput(driver, "//input[@type='text']")
    await driver
      .findElement(By.xpath("//input[@type='text']"))
      .sendKeys(data.campaign_name)

    // handle click button continue
    await driver
      .findElement(By.xpath("//button[@data-testid='common_next_button']"))
      .click()
    await driver.sleep(5000).then(async function () {
      await handleWaitToTargeting(driver)
    })
  })
}
// clear input
const clearInput = async (driver, xpath) => {
  await driver.findElement(By.xpath(xpath)).sendKeys(Key.CONTROL, 'a')
  await driver.findElement(By.xpath(xpath)).sendKeys(Key.DELETE)
}
const runTest = async () => {
  let options = new firefox.Options()
  options.setProfile(profile)

  //To wait for browser to build and launch properly
  let driver = await new webdriver.Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .build()
  //let driver = await new Builder().forBrowser("firefox").build();
  try {
    await driver.get(data.url_campaign)
    await driver.sleep(1000)
    let maxTime = 30000
    var xpath = "//div[normalize-space()='App promotion']"
    var condition = until.elementLocated({
      xpath: xpath,
    })
    await driver.wait(condition, maxTime).then(async function () {
      await driver
        .findElement(By.xpath("//div[normalize-space()='App promotion']"))
        .click()

      await waitSwitchStatus(driver)
    })
  } finally {
    // await driver.quit();
  }
}

runTest()
