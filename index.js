const { Builder, Browser, By, Key, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");
const webdriver = require("selenium-webdriver");

const profile =
  "C:\\Users\\hd131\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles\\9azfairu.default-release";
const data = {
  url_campaign:
    "https://ads.tiktok.com/i18n/creation/campaign?aadvid=7197011714712305665",
  campaign_name: "test",
  app_name: "Cast for Chromecast & TV Cast",
  locations: ["Malaysia"],
};
// wait for targeting to be active
const handleWaitToTargeting = async (driver) => {
  const xpathCheck = "//label[normalize-space()='Location']";
  const maxTime = 30000;
  const condition = driver.findElement(By.className("vi-byted-button"));
  await driver.wait(condition, maxTime).then(async function () {
    // await driver.findElement(By.className("vi-byted-button")).click();
    // Find the element that causes the hidden element to appear
    const triggerElement = await driver.findElement(By.xpath(xpathCheck));

    // Move the mouse over the trigger element to make the hidden element visible
    driver.actions().move({ origin: triggerElement }).perform();

    // Find the hidden element now that it is visible
    const hiddenElement = await driver.findElement(By.css(".vi-byted-button"));
    hiddenElement.click();
    // await driver
    //   .findElement(By.xpath("//i[@class='right-icon vi-icon-circle-close']"))
    //   .click();

    // await driver
    //   .findElement(
    //     By.xpath(
    //       "//div[@class='vi-select-tree index_locationFormItem_dP0yb']//div//div[@class='vi-select-tree-inside-container']"
    //     )
    //   )
    //   .click();
    // data.locations.forEach(async (location) => {
    //   await driver
    //     .findElement(By.xpath("(//input[@placeholder='Search'])[1]"))
    //     .sendKeys(location);
    //   //div[@class='vi-select-tree index_locationFormItem_dP0yb']
    //   await driver
    //     .findElement(
    //       By.xpath(
    //         "//div[@class='vi-select-tree index_locationFormItem_dP0yb']"
    //       )
    //     )
    //     .click();
    // });
    // await driver
    // .findElement(By.xpath("//button[@data-testid='common_next_button']"))
    // .click();
    // await handleWaitToBudget(driver);
  });
};

// wait for switch status to be active
const waitSwitchStatus = async (driver) => {
  // await driver until.elementLocated find element success
  const xpath =
    "//div[@data-tea='create_campaign_spc_status']//div[@role='switch']";
  const condition = until.elementLocated({
    xpath: xpath,
  });
  const maxTime = 30000;
  await driver.wait(condition, maxTime).then(async function () {
    await driver
      .findElement(
        By.xpath(
          "//div[@data-tea='create_campaign_spc_status']//div[@role='switch']"
        )
      )
      .click();

    clearInput(driver, "//input[@type='text']");
    await driver
      .findElement(By.xpath("//input[@type='text']"))
      .sendKeys(data.campaign_name);

    // handle click button continue
    await driver
      .findElement(By.xpath("//button[@data-testid='common_next_button']"))
      .click();
    await driver.sleep(10000).then(async function () {
      await handleWaitToTargeting(driver);
    });
  });
};
// clear input
const clearInput = async (driver, xpath) => {
  await driver.findElement(By.xpath(xpath)).sendKeys(Key.CONTROL, "a");
  await driver.findElement(By.xpath(xpath)).sendKeys(Key.DELETE);
};
const runTest = async () => {
  let options = new firefox.Options();
  options.setProfile(profile);

  //To wait for browser to build and launch properly
  let driver = await new webdriver.Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options)
    .build();
  //let driver = await new Builder().forBrowser("firefox").build();
  try {
    await driver.get(data.url_campaign);
    await driver.sleep(1000);
    let maxTime = 30000;
    var xpath = "//div[normalize-space()='App promotion']";
    var condition = until.elementLocated({
      xpath: xpath,
    });
    await driver.wait(condition, maxTime).then(async function () {
      await driver
        .findElement(By.xpath("//div[normalize-space()='App promotion']"))
        .click();

      await waitSwitchStatus(driver);
    });
  } finally {
    // await driver.quit();
  }
};

runTest();
