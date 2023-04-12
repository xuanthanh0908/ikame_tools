const { Builder, Browser, By, Key, until } = require("selenium-webdriver");
const axios = require("axios");
const firefox = require("selenium-webdriver/firefox");
const webdriver = require("selenium-webdriver");
const ApiError = require("../utils/apiError");
const catchAsync = require("../utils/catchAsync");
const { readFile } = require("../utils/readfile");
const { updateStatusCampaign, clearInput } = require("./automate_titktok");
const backend_campaign_url = "https://api.ikamegroup.com/api/v1";
// const backend_campaign_url = "http://localhost:9000/api/v1";
const url = {
  CAMPAIGN: "/campaign",
};

// const DATA = {
//   campaign_url:
//     "https://ads.google.com/aw/campaigns/new?ocid=1048467088&workspaceId=0&cmpnInfo=%7B%228%22%3A%22a1F49EFB3-26F5-4511-9518-D644D597B9BB--50%22%7D&euid=840505868&__u=5695221932&uscid=1048467088&__c=7066397712&authuser=1",
//   type_app: "iOS",
//   app_id: "1659186258",
//   campaign_name: "Campaign 119",
//   ads_group_name: "Ads Group Test",
//   location_type: "Enter another location",
//   location_target: ["target", "exclude"],
//   locations: ["United States", "California, United States"],
//   budget: 5,
//   bid: 1,
//   headline: ["Test Headline 01", "Test Headline 02", "Test Headline 03"],
//   desc: ["Test Desc 01", "Test Desc 02", "Test Desc 03"],
//   videos: [
//     "https://www.youtube.com/watch?v=W3ykypuEbnU",
//     "https://www.youtube.com/watch?v=IB5rA1QlGnY",
//   ],
// };
const runTest = catchAsync(async (req, res, next) => {
  const { id, userId } = req.body;
  const DATA = req.data;
  // console.log("=============DATA==============", DATA);
  readFile()
    .then(async (path) => {
      // init maxtime
      const maxTime = 30000;
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
          const app_promote_btn = await driver.findElement(
            By.xpath(type_app_path)
          );
          await driver.executeScript("arguments[0].click();", app_promote_btn);
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
              .sendKeys(DATA.package_name)
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
                        await handleStep2(DATA, driver, userId, id);
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
    .catch((err) => {
      console.log("RUN TEST FAILED", err);
      updateStatusCampaign(id, "canceled", userId);
    });
});

const handleStep2 = async (DATA, driver, userId, id) => {
  const max_time = 30000;
  // await driver.sleep(3000);
  const find_are_loading_path =
    "//div[contains(text(),'Enter another location')]";
  const conditions_01 = until.elementLocated({
    xpath: find_are_loading_path,
  });
  try {
    if (DATA.location_to_target === "Enter another location") {
      await driver.wait(conditions_01, max_time).then(async () => {
        // dropdown location options
        const location_input_path =
          "//div[contains(text(),'Enter another location')]";
        const input_el = await driver.findElement(
          By.xpath(location_input_path)
        );
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
      });
    }
    // click on dropdown
    await driver.wait(conditions_01, max_time).then(async () => {
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
              if (DATA.languages.length > 0 && DATA.languages[0] !== "All") {
                for (const lang of DATA.languages) {
                  const all_language_path =
                    "//span[normalize-space()='" + lang + "']";
                  await driver.findElement(By.xpath(all_language_path)).click();
                  await driver.sleep(2000);
                }
              } else {
                const all_language_path =
                  "//span[normalize-space()='All languages']";
                await driver.findElement(By.xpath(all_language_path)).click();
                await driver.sleep(2000);
              }
              // handle next button
              const next_button_path =
                "//dynamic-component[@class='content-element _ngcontent-awn-CM_EDITING-39']//div[@class='_ngcontent-awn-CM_EDITING-42']//material-ripple[@class='_ngcontent-awn-CM_EDITING-13']";
              const next = await driver.findElement(By.xpath(next_button_path));
              await driver
                .executeScript("arguments[0].click()", next)
                .then(async () => {
                  await handleStep3(DATA, driver, userId, id);
                });
            });
        });
    });
  } catch (error) {
    console.log("RUN TEST FAILED", error);
    updateStatusCampaign(id, "canceled", userId);
  }
};
const handleStep3 = async (DATA, driver, userId, id) => {
  // console.log("=================STEP 3===================", DATA);
  try {
    const max_time = 30000;
    const input_budget_path =
      "//input[@aria-label='Set your average daily budget for this campaign']";
    const conditions_01 = until.elementLocated({
      xpath: input_budget_path,
    });
    await driver.wait(conditions_01, max_time).then(async () => {
      const input_budget = await driver.findElement(
        By.xpath(input_budget_path)
      );
      await input_budget.sendKeys(DATA.budget);
      /// handle choose bidding focus
      const bidding_focus_path_01 = "//div[normalize-space()='Install volume";
      const bidding_focus_path_02 = "//div[normalize-space()='In-app actions']";
      const bidding_focus_path_03 =
        "//div[normalize-space()='In-app action value']";
      const dropdown_path =
        "//material-dropdown-select[@aria-label='What do you want to focus on?']";
      const check_bd_path =
        DATA.bidding_focus === "In-app action value"
          ? bidding_focus_path_03
          : DATA.bidding_focus === "Install volume"
          ? bidding_focus_path_01
          : bidding_focus_path_02;
      await driver
        .findElement(By.xpath(dropdown_path))
        .click()
        .then(async () => {
          /// handle send data to bidding field
          const input_bid_path =
            "//input[@aria-label='Target cost per install in US Dollar']";
          const target_return_path =
            "//input[@aria-label='Target return on ad spend']";
          const target_on_actions =
            "//input[@aria-label='Target cost per action in US Dollar']";
          const check_path =
            DATA.bidding_focus === "In-app action value"
              ? target_return_path
              : DATA.bidding_focus === "Install volume"
              ? input_bid_path
              : target_on_actions;

          if (
            DATA.track_install_volume &&
            DATA.bidding_focus !== "Install volume" &&
            check_bd_path !== bidding_focus_path_01 &&
            DATA.track_install_volume.length > 0
          ) {
            await driver
              .findElement(By.xpath(check_bd_path))
              .click()
              .then(async () => {
                for (const track of DATA.track_install_volume) {
                  await driver
                    .findElements(By.className("conversion-action"))
                    .then(async function (elements) {
                      for (const el of elements) {
                        const text = await el.getText();

                        if (text === track) {
                          console.log("==========OK==========");
                          await el.click();
                        }
                      }
                    });
                }
              });
          }
          await driver
            .findElement(By.xpath(check_path))
            .sendKeys(DATA.bidding)
            .then(async () => {
              // await driver.sleep(2000);
              // handle next button
              const next_button_path =
                "//dynamic-component[@class='content-element _ngcontent-awn-CM_EDITING-39']//div[@class='_ngcontent-awn-CM_EDITING-42']//material-ripple[@class='_ngcontent-awn-CM_EDITING-13']";
              const condition_04 = until.elementLocated({
                xpath: next_button_path,
              });
              await driver.wait(condition_04, max_time).then(async () => {
                await driver
                  .findElement(By.xpath(next_button_path))
                  .click()
                  .then(async () => {
                    // console.log("OK STEP 3");
                    await handleStep4(DATA, driver, userId, id);
                  });
              });
            });
        });
    });
  } catch (error) {
    console.log("RUN TEST FAILED", error);
    updateStatusCampaign(id, "canceled", userId);
  }
};
const handleStep4 = async (DATA, driver, userId, id) => {
  try {
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
      const choose_video = await driver.findElement(
        By.xpath(choose_video_path)
      );
      await driver
        .executeScript("arguments[0].click()", choose_video)
        .then(async () => {
          await handleStep5(DATA, driver, userId, id);
        });
    });
  } catch (error) {
    console.log("RUN TEST FAILED", error);
    updateStatusCampaign(id, "canceled", userId);
  }
};
const handleStep5 = async (DATA, driver, userId, id) => {
  try {
    const max_time = 30000;
    const loading_path = "//span[normalize-space()='Search YouTube']";
    const conditions_01 = until.elementLocated({
      xpath: loading_path,
    });
    await driver.wait(conditions_01, max_time).then(async () => {
      const input = await driver.findElement(By.xpath(loading_path));
      await driver
        .executeScript("arguments[0].click()", input)
        .then(async () => {
          await driver.sleep(5000).then(async () => {
            // const input_search_path =
            //   "(//input[@type='text'])[" +
            //   (DATA.location_to_target === "Enter another location"
            //     ? 11 + DATA.headline.length + DATA.desc.length
            //     : 10 + DATA.headline.length + DATA.desc.length) +
            //   "]";
            const input_search_path = "input input-area";
            // const conditions_02 = until.elementLocated({
            //   xpath: input_search_path,
            // });
            // await driver.wait(conditions_02, max_time).then(async () => {
            await driver
              .findElements(By.className(input_search_path))
              .then(async (elements) => {
                for (const [index, value] of DATA.videos.entries()) {
                  await elements[elements.length - 1]
                    .sendKeys(value)
                    .then(async () => {
                      // console.log("============click search===========");
                      const exist_video_path =
                        "(//material-list-item[@role='listitem'])[1]";
                      const conditions_03 = until.elementLocated({
                        xpath: exist_video_path,
                      });
                      await driver
                        .wait(conditions_03, max_time)
                        .then(async () => {
                          await driver
                            .findElement(By.xpath(exist_video_path))
                            .click();
                          await elements[elements.length - 1].clear();
                        });
                    });
                }
                // handle save choose video
                const save_video_path =
                  "(//div[@class='content _ngcontent-awn-CM_EDITING-13'][normalize-space()='Save'])[3]";
                const btn_save = await driver.findElement(
                  By.xpath(save_video_path)
                );
                await driver.executeScript("arguments[0].click()", btn_save);

                // handle next button
                const next_button_path =
                  "//dynamic-component[@class='content-element _ngcontent-awn-CM_EDITING-39']//div[@class='_ngcontent-awn-CM_EDITING-42']//material-button[@role='button']";
                const next = await driver.findElement(
                  By.xpath(next_button_path)
                );
                await driver
                  .executeScript("arguments[0].click()", next)
                  .then(async () => {
                    await handleStep6(DATA, driver, userId, id);
                  });
              });
            // });
          });
        });
    });
  } catch (error) {
    console.log("RUN TEST FAILED", error);
    updateStatusCampaign(id, "canceled", userId);
  }
};
const handleStep6 = async (DATA, driver, userId, id) => {
  try {
    const max_time = 30000;
    await driver.sleep(15000).then(async () => {
      const edit_icon = "(//i[@aria-label='Edit ad group name'])[1]";
      const edit_ads_group_name_path_btn = await driver.findElement(
        By.xpath(edit_icon)
      );
      await driver
        .executeScript("arguments[0].click()", edit_ads_group_name_path_btn)
        .then(async () => {
          const input_ads_group_name_path =
            "(//input[@type='text'])[" +
            (DATA.location_to_target === "Enter another location"
              ? (DATA.bidding_focus === "Install volume" ? 8 : 9) +
                DATA.headline.length +
                DATA.desc.length
              : (DATA.bidding_focus === "Install volume" ? 7 : 8) +
                DATA.headline.length +
                DATA.desc.length) +
            "]";
          const condition_04 = until.elementLocated({
            xpath: input_ads_group_name_path,
          });
          await driver.wait(condition_04, max_time).then(async () => {
            await clearInput(driver, input_ads_group_name_path).then(
              async () => {
                await driver
                  .findElement(By.xpath(input_ads_group_name_path))
                  .sendKeys(DATA.ads_group_name);
                await driver.sleep(5000).then(async () => {
                  await driver
                    .findElements(By.className("button button-next"))
                    .then(async function (elements) {
                      console.log("elements", elements.length);
                      // Print the text of each element
                      await driver
                        .executeScript(
                          "arguments[0].click()",
                          elements[elements.length - 1]
                        )

                        .then(async () => {
                          console.log("RUN TEST SUCCESS");
                          await updateStatusCampaign(
                            id,
                            "completed",
                            userId,
                            "Run test success"
                          );
                          await driver.sleep(30000);
                          // await driver.quit();
                        });
                    });
                });
              }
            );
          });
        });
    });
  } catch (error) {
    console.log("RUN TEST FAILED", error);
    updateStatusCampaign(id, "canceled", userId);
  }
};

// handle run campaign gg ads
const handleFetchApiGgAds = catchAsync(async (req, res, next) => {
  const { id } = req.body;
  try {
    const response = await axios.get(
      backend_campaign_url + url.CAMPAIGN + "/" + id
    );
    if (response.status === 200) {
      const origin_data = response.data.data;
      // console.log("origin_data", origin_data);
      let formattedDate = new Date(origin_data.start_date)
        .toISOString()
        .slice(0, 10);
      let location_target = [];
      let locations = [];
      if (origin_data.location_to_target === "Enter another location") {
        const ex_locations = origin_data.ex_locations;
        const target_location = origin_data.locations;
        const location_types_01 =
          target_location &&
          target_location
            .map((i) => "target")
            .filter((m) => m !== undefined && m !== null);
        const location_types_02 =
          target_location &&
          ex_locations
            .map((i) => "exclude")
            .filter((m) => m !== undefined && m !== null);
        if (location_types_01.length > 0 || location_types_02.length > 0) {
          location_target = [...location_types_01, ...location_types_02];
          locations = [...target_location, ...ex_locations];
        }
      }
      const campaign_data = {
        campaign_url: origin_data.campaign_url,
        campaign_name: origin_data.campaign_name,
        app_id: origin_data.product,
        package_name: origin_data.package_name,
        bidding_focus: origin_data.bidding_focus,
        track_install_volume: origin_data.track_install_volume,
        location_to_target: origin_data.location_to_target,
        location_target: location_target,
        locations: locations,
        languages: origin_data.languages,
        budget: origin_data.budget,
        type_app: origin_data.type_app,
        desc: origin_data.desc[0],
        startDate: {
          date: formattedDate,
          time: "00:00",
        },
        videos: origin_data.videos,
        headline: origin_data.texts.flat(1),
        bidding: origin_data.bidding,
        ads_group_name: origin_data.ads_group_name[0],
      };
      console.log("==========DATA===========", campaign_data);
      req.data = campaign_data;
      if (origin_data.status === "pending" || origin_data.status === "canceled")
        runTest(req, res, next);
    } else throw new ApiError(400, "BAD REQUEST");
  } catch (error) {
    throw new ApiError(400, "BAD REQUEST");
  }
});
// runTest();
module.exports = {
  runTest,
  handleFetchApiGgAds,
};
