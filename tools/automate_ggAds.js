const { Builder, Browser, By, Key, until } = require("selenium-webdriver");
const axios = require("axios");
const firefox = require("selenium-webdriver/firefox");
const webdriver = require("selenium-webdriver");
const ApiError = require("../utils/apiError");
const catchAsync = require("../utils/catchAsync");
const { emitEvent } = require("../utils/socket");
const { readFile } = require("../utils/readfile");
const backend_campaign_url = "https://api.ikamegroup.com/api/v1";
const url = {
  CAMPAIGN: "/campaign",
};

const DATA = {
  campaign_url:
    "https://ads.google.com/aw/campaigns/new?ocid=1048467088&workspaceId=0&cmpnInfo=%7B%228%22%3A%22a1F49EFB3-26F5-4511-9518-D644D597B9BB--50%22%7D&euid=840505868&__u=5695221932&uscid=1048467088&__c=7066397712&authuser=1",
  type_app: "iOS",
  app_id: "1659186258",
  campaign_name: "Campaign 01",
  location_type: "Enter another location",
  location_target: ["target", "exclude"],
  locations: ["United States", "California, United States"],
  budget: 5,
  bid: 0.01,
  headline: ["Test Headline 01", "Test Headline 02", "Test Headline 03"],
  desc: ["Test Desc 01", "Test Desc 02", "Test Desc 03"],
  videos: [
    "https://www.youtube.com/watch?v=W3ykypuEbnU",
    "https://www.youtube.com/watch?v=IB5rA1QlGnY",
  ],
};
const runTest = () => {
  readFile()
    .then(async (path) => {
      // init maxtime
      const maxTime = 30000;
      //   const { id, userId } = req.body
      let options = new firefox.Options();

      options.setProfile(path);
      options.setPreference("layout.css.devPixelsPerPx", "0.7");
      //To wait for browser to build and launch properly
      let driver = await new webdriver.Builder()
        .forBrowser("firefox")
        .setFirefoxOptions(options)
        .build();
      driver.manage().window().maximize();
      try {
        await driver.get(DATA.campaign_url);
        const app_promote_path =
          "//dynamic-component[@data-value='APP_DOWNLOADS']//div[@class='card card--secondary _ngcontent-awn-CM_EDITING-11']//div[@class='unified-goals-card-format _ngcontent-awn-CM_EDITING-10']";
        await driver.findElement(By.xpath(app_promote_path)).click();

        /// wait for load down components loaded
        const some_path_loading = "//div[normalize-space()='Android']";
        const conditions_01 = until.elementLocated({
          xpath: some_path_loading,
        });
        await driver.wait(conditions_01, maxTime).then(async () => {
          const type_app_path =
            "//div[normalize-space()='" + DATA.type_app + "']";
          await driver.findElement(By.xpath(type_app_path)).click();
          // search your app
          const input_search_app =
            "/html[1]/body[1]/div[1]/root[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div[1]/div[1]/awsm-child-content[1]/div[1]/div[1]/cm-editing-root[1]/deferred-component[1]/construction-root[1]/base-root[1]/div[1]/div[2]/div[1]/view-loader[1]/campaign-construction-selection[1]/guided-selection-engine[1]/div[1]/app-selection[1]/div[1]/div[1]/app-picker[1]/div[1]/app-picker-input[1]/div[1]/div[2]/material-auto-suggest-input[1]/material-input[1]/div[1]/div[1]/label[1]/input[1]";
          const condition_04 = until.elementLocated({
            xpath: input_search_app,
          });
          await driver.wait(condition_04, maxTime).then(async () => {
            await driver
              .findElement({
                xpath: input_search_app,
              })
              .sendKeys(DATA.app_id)
              .then(async () => {
                const select_app_path =
                  ".app-info._ngcontent-awn-CM_EDITING-33";

                const conditions_02 = until.elementLocated({
                  css: select_app_path,
                });
                await driver.wait(conditions_02, maxTime).then(async () => {
                  await driver.findElement(By.css(select_app_path)).click();

                  const campaign_name_css_path =
                    "/html[1]/body[1]/div[1]/root[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div[1]/div[1]/awsm-child-content[1]/div[1]/div[1]/cm-editing-root[1]/deferred-component[1]/construction-root[1]/base-root[1]/div[1]/div[2]/div[1]/view-loader[1]/campaign-construction-selection[1]/guided-selection-engine[1]/div[1]/campaign-name-view[1]/div[1]/div[2]/div[1]/material-input[1]/div[1]/div[1]/label[1]/input[1]";
                  const campaign_input = await driver.findElement(
                    By.xpath(campaign_name_css_path)
                  );
                  campaign_input.clear();
                  driver.sleep(1000);
                  campaign_input.sendKeys(DATA.campaign_name);

                  /// next button
                  const button_next_path =
                    "//material-button[@aria-label='Continue to the next step']//material-ripple[@class='_ngcontent-awn-CM_EDITING-13']";
                  const conditions_03 = until.elementLocated({
                    xpath: button_next_path,
                  });
                  await driver.wait(conditions_03, maxTime).then(async () => {
                    const button = await driver.findElement(
                      By.xpath(button_next_path)
                    );
                    await driver
                      .executeScript("arguments[0].click()", button)
                      .then(async () => {
                        await driver.sleep(3000);
                        const start_new_campaign_path =
                          "//material-button[@class='new-button _nghost-awn-CM_EDITING-13 _ngcontent-awn-CM_EDITING-34']//material-ripple[@class='_ngcontent-awn-CM_EDITING-13']";
                        const findButton = await driver
                          .findElement(By.xpath(start_new_campaign_path))
                          .isDisplayed();
                        if (findButton) {
                          const button = await driver.findElement(
                            By.xpath(start_new_campaign_path)
                          );
                          await driver
                            .executeScript("arguments[0].click()", button)
                            .then(async () => {
                              await handleStep2(driver);
                            });
                        } else {
                          await handleStep2(driver);
                        }
                      });
                  });
                });
              });
          });
        });
      } finally {
        //
        await driver.sleep(2000);
        // driver.quit();
      }
    })
    .catch((err) => console.log(err));
};

const handleStep2 = async (driver) => {
  const max_time = 30000;
  // await driver.sleep(3000);
  const find_are_loading_path =
    "//div[contains(text(),'Enter another location')]";
  const conditions_01 = until.elementLocated({
    xpath: find_are_loading_path,
  });
  await driver.wait(conditions_01, max_time).then(async () => {
    // dropdown location options
    const location_input_path =
      "//div[contains(text(),'Enter another location')]";
    const input_el = await driver.findElement(By.xpath(location_input_path));
    await driver.executeScript("arguments[0].click()", input_el);
    // await driver.sleep(2000);
    // console.log("====================================", DATA.locations);
    for (const [index, loca] of DATA.locations.entries()) {
      console.log("============AO===========", loca);
      //div[@class='entry _ngcontent-awn-CM_EDITING-171 active']
      const input_path_01 =
        "//material-input[@role='combobox']//input[@type='text']";
      const conditions_02 = until.elementLocated({
        xpath: input_path_01,
      });
      await driver.wait(conditions_02, max_time).then(async () => {
        await driver
          .findElement(By.xpath(input_path_01))
          .sendKeys(loca)
          .then(async () => {
            const location_path = "//span[@title='" + loca + "']";
            const conditions_02 = until.elementLocated({
              xpath: location_path,
            });
            await driver.wait(conditions_02, max_time).then(async () => {
              const target_path =
                "(//div[@class='content _ngcontent-awn-CM_EDITING-13'][normalize-space()='Target'])[1]";
              const excluded_path =
                "(//div[@class='content _ngcontent-awn-CM_EDITING-13'][normalize-space()='Exclude'])[1]";
              if (DATA.location_target[index] === "target") {
                const button = driver.findElement(By.xpath(target_path));
                await driver.executeScript("arguments[0].click()", button);
              } else {
                const button = driver.findElement(By.xpath(excluded_path));
                await driver.executeScript("arguments[0].click()", button);
              }
              // const target = await driver.findElement(By.xpath(target_path));
              // await driver.findElement(By.xpath(location_path)).click();
            });
          });
      });
    }
    // click on dropdown
    const location_option = "//div[normalize-space()='Location options']";
    const click_01 = await driver.findElement(By.xpath(location_option));
    await driver
      .executeScript("arguments[0].click()", click_01)
      .then(async () => {
        const choose_path_01 =
          "//div[normalize-space()='Presence: People in or regularly in your targeted locations']";
        await driver
          .findElement(By.xpath(choose_path_01))
          .click()
          .then(async () => {
            // enable language
            const input_language =
              "/html[1]/body[1]/div[1]/root[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div[1]/div[1]/awsm-child-content[1]/div[1]/div[1]/cm-editing-root[1]/deferred-component[1]/construction-root[1]/reconstruction-base-root[1]/view-loader[1]/universal-campaign-flow-root[1]/base-campaign-flow-root[1]/left-stepper[1]/div[1]/div[1]/div[1]/dynamic-component[1]/layout-driven-view[1]/construction-layout[1]/div[1]/construction-layout-engine[1]/div[1]/div[1]/div[3]/div[3]/lazy-plugin[1]/div[1]/dynamic-component[1]/languages[1]/material-expansionpanel[1]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[1]/language-picker[1]/section[1]/div[1]/language-selector[1]/div[1]/material-auto-suggest-input[1]/material-input[1]/div[1]/div[1]/label[1]/input[1]";
            await driver.findElement(By.xpath(input_language)).click();

            // choose language
            const all_language_path =
              "//span[normalize-space()='All languages']";
            await driver.findElement(By.xpath(all_language_path)).click();
            // handle next button
            const next_button_path =
              "//dynamic-component[@class='content-element _ngcontent-awn-CM_EDITING-46']//div[@class='_ngcontent-awn-CM_EDITING-49']//div[@class='content _ngcontent-awn-CM_EDITING-13']";
            const next = await driver.findElement(By.xpath(next_button_path));
            await driver
              .executeScript("arguments[0].click()", next)
              .then(async () => {
                await handleStep3(driver);
              });
          });
      });
  });
};
const handleStep3 = async (driver) => {
  const max_time = 30000;
  const input_budget_path =
    "//input[@aria-label='Set your average daily budget for this campaign']";
  const conditions_01 = until.elementLocated({
    xpath: input_budget_path,
  });
  await driver.wait(conditions_01, max_time).then(async () => {
    const input_budget = await driver.findElement(By.xpath(input_budget_path));
    await input_budget.sendKeys(DATA.budget);
    const input_bid_path =
      "//input[@aria-label='Target cost per install in US Dollar']";
    await driver.findElement(By.xpath(input_bid_path)).sendKeys(DATA.bid);

    // handle next button
    const next_button_path =
      "//dynamic-component[@class='content-element _ngcontent-awn-CM_EDITING-46']//div[@class='_ngcontent-awn-CM_EDITING-49']//div[@class='content _ngcontent-awn-CM_EDITING-13']";
    const next = await driver.findElement(By.xpath(next_button_path));
    await driver.executeScript("arguments[0].click()", next).then(async () => {
      await handleStep4(driver);
    });
  });
};
const handleStep4 = async (driver) => {
  await driver.sleep(3000);
  const max_time = 30000;
  // handle headline
  const input_headline_path = "(//input[@aria-label='Headline 1 of 5'])[1]";
  const conditions_01 = until.elementLocated({
    xpath: input_headline_path,
  });
  await driver.wait(conditions_01, max_time).then(async () => {
    for (const [index, value] of DATA.headline.entries()) {
      const input_headline_path =
        "(//input[@aria-label='Headline " + (index + 1) + " of 5'])[1]";
      await driver.findElement(By.xpath(input_headline_path)).sendKeys(value);
    }
    for (const [index, value] of DATA.desc.entries()) {
      const input_des_path =
        "(//input[@aria-label='Description " + (index + 1) + " of 5'])[1]";
      await driver.findElement(By.xpath(input_des_path)).sendKeys(value);
    }

    // handle choose video
    const choose_video_path =
      "//material-button[@aria-label='Add videos']//material-ripple[@class='_ngcontent-awn-CM_EDITING-13']";
    const choose_video = await driver.findElement(By.xpath(choose_video_path));
    await driver
      .executeScript("arguments[0].click()", choose_video)
      .then(async () => {
        await handleStep5(driver);
      });
  });
  // (//input[@aria-label='Description 1 of 5'])[1]
};
const handleStep5 = async (driver) => {
  const max_time = 30000;
  const loading_path = "//span[normalize-space()='Search YouTube']";
  const conditions_01 = until.elementLocated({
    xpath: loading_path,
  });
  await driver.wait(conditions_01, max_time).then(async () => {
    const input = await driver.findElement(By.xpath(loading_path));
    await driver.executeScript("arguments[0].click()", input).then(async () => {
      const input_search_path =
        "//label[@class='input-container _ngcontent-awn-CM_EDITING-27 floated-label']//input[@type='text']";
      const conditions_02 = until.elementLocated({
        xpath: input_search_path,
      });
      await driver.wait(conditions_02, max_time).then(async () => {
        for (const [index, value] of DATA.videos.entries()) {
          await driver
            .findElement(By.xpath(input_search_path))
            .sendKeys(value)
            .then(async () => {
              await driver
                .findElement(By.xpath(input_search_path))
                .click()
                .then(async () => {
                  const exist_video_path =
                    "//div[@class='video-item _ngcontent-awn-CM_EDITING-166']";
                  const conditions_03 = until.elementLocated({
                    xpath: exist_video_path,
                  });
                  await driver.wait(conditions_03, max_time).then(async () => {
                    await driver
                      .findElement(By.xpath(exist_video_path))
                      .click();
                    await driver.sleep(1000);
                    await driver
                      .findElement(By.xpath(input_search_path))
                      .clear();
                  });
                });
            });
        }
      });
    });
  });
};
runTest();
module.exports = {
  runTest,
};
