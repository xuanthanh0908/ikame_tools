const { Builder, Browser, By, Key, until } = require("selenium-webdriver");
const axios = require("axios");
const firefox = require("selenium-webdriver/firefox");
const webdriver = require("selenium-webdriver");
const ApiError = require("../utils/apiError");
const catchAsync = require("../utils/catchAsync");
const { readFile } = require("../utils/readfile");
const { updateStatusCampaign } = require("./automate_titktok");
const { emitEvent } = require("../utils/socket");
const fs = require("fs");
const backend_campaign_url = "https://api.ikamegroup.com/api/v1";
// const backend_campaign_url = "http://localhost:9000/api/v1";
const url = {
  CAMPAIGN: "/campaign",
  CAMPAIGN_UPDATE: "/campaign/update-by-one",
  ADS_GROUP_UPDATE: "/ads-asset",
};
/// clear input
const clearInput = async (el) => {
  await el.sendKeys(Key.CONTROL, "a");
  await el.sendKeys(Key.DELETE);
};
/// update url ads group
const updateAdsGroupCampaign = async (
  id,
  status,
  userId,
  message = "Run test failed"
) => {
  try {
    await axios.patch(backend_campaign_url + url.ADS_GROUP_UPDATE + "/" + id, {
      status: status,
    });
    emitEvent("message", {
      message,
      type: "success",
      userId,
    });
  } catch (error) {
    console.log("===========API ERROR=================", error);
  }
};

// start run
const runTest = async (req, res, next) => {
  const { id, userId } = req.body;
  const DATA = req.data;

  // console.log("=============DATA==============", DATA);
  return new Promise(async (resolve, reject) => {
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
        // driver.switchTo().window(driver.getWindowHandle());
        try {
          await driver.get(DATA.campaign_url);
          const app_promote_path = "dynamic-component[data-value=APP_DOWNLOADS";
          await driver
            .wait(
              until.elementLocated({
                css: app_promote_path,
              }),
              maxTime
            )
            .then(async () => {
              await driver.findElement(By.css(app_promote_path)).click();

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
                await driver.executeScript(
                  "arguments[0].click();",
                  app_promote_btn
                );
                // search your app
                const input_search_app = ".flex-div .input.input-area";
                const condition_04 = until.elementLocated({
                  css: input_search_app,
                });
                await driver.wait(condition_04, maxTime).then(async () => {
                  await driver
                    .findElement({
                      css: input_search_app,
                    })
                    .sendKeys(DATA.package_name)
                    .then(async () => {
                      const select_app_path =
                        ".app-info._ngcontent-awn-CM_EDITING-33";
                      const conditions_02 = until.elementLocated({
                        css: select_app_path,
                      });
                      await driver
                        .wait(conditions_02, maxTime)
                        .then(async () => {
                          await driver
                            .findElement(By.css(select_app_path))
                            .click();
                          const input_camp_name =
                            ".campaign-name-view .input.input-area";
                          const condition_05 = until.elementLocated({
                            css: input_camp_name,
                          });
                          await driver
                            .wait(condition_05, maxTime)
                            .then(async () => {
                              const input = await driver.findElement(
                                By.css(input_camp_name)
                              );
                              await clearInput(input);
                              await input.sendKeys(DATA.campaign_name);
                            });

                          /// next button
                          const button_next_path =
                            "//material-button[@aria-label='Continue to the next step']//material-ripple[@class='_ngcontent-awn-CM_EDITING-13']";
                          const conditions_03 = until.elementLocated({
                            xpath: button_next_path,
                          });
                          await driver
                            .wait(conditions_03, maxTime)
                            .then(async () => {
                              const button = await driver.findElement(
                                By.xpath(button_next_path)
                              );
                              await driver
                                .executeScript("arguments[0].click()", button)
                                .then(async () => {
                                  handleStep2(DATA, driver, userId, id)
                                    .then(() => resolve("success"))
                                    .catch(reject);
                                });
                            });
                        });
                    });
                });
              });
            });
        } finally {
          //
          // await driver.sleep(2000);
          // driver.quit();
        }
      })
      .catch((err) => {
        reject(err);
        console.log("RUN TEST FAILED", err);
        updateStatusCampaign(id, "canceled", userId);
        updateAdsGroupCampaign(DATA.ads_group_id, "canceled", userId);
      });
  });
};
/// handle campaign setting
const handleStep2 = async (DATA, driver, userId, id) => {
  const max_time = 30000;
  // await driver.sleep(3000);
  const find_are_loading_path =
    "//div[contains(text(),'Enter another location')]";
  const conditions_01 = until.elementLocated({
    xpath: find_are_loading_path,
  });
  return new Promise(async (resolve, reject) => {
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
                      await driver.executeScript(
                        "arguments[0].click()",
                        button
                      );
                    } else {
                      const button = driver.findElement(
                        By.xpath(excluded_path)
                      );
                      await driver.executeScript(
                        "arguments[0].click()",
                        button
                      );
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
                // input[placeholder="Start typing or select a language"]'
                const input_language =
                  ".languages .top-section .leading-text + label>input";
                const findLang = await driver.findElement(
                  By.css(input_language)
                );
                await driver.executeScript("arguments[0].click()", findLang);

                // choose language
                if (DATA.languages.length > 0 && DATA.languages[0] !== "All") {
                  for (const lang of DATA.languages) {
                    const all_language_path =
                      "//span[normalize-space()='" + lang + "']";
                    await driver
                      .findElement(By.xpath(all_language_path))
                      .click();
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
                const next = await driver.findElement(
                  By.xpath(next_button_path)
                );
                await driver
                  .executeScript("arguments[0].click()", next)
                  .then(async () => {
                    handleStep3(DATA, driver, userId, id)
                      .then(() => resolve("success"))
                      .catch(reject);
                  });
              });
          });
      });
    } catch (error) {
      reject(error);
      console.log("RUN TEST FAILED", error);
      updateStatusCampaign(id, "canceled", userId);
      updateAdsGroupCampaign(DATA.ads_group_id, "canceled", userId);
    }
  });
};
// handle bidding && budget
// const handleStep3 = async (DATA, driver, userId, id) => {
//   // console.log("=================STEP 3===================", DATA);
//   return new Promise(async (resolve, reject) => {
//     try {
//       const max_time = 30000;
//       const input_budget_path =
//         "//input[@aria-label='Set your average daily budget for this campaign']";
//       const conditions_01 = until.elementLocated({
//         xpath: input_budget_path,
//       });
//       await driver.wait(conditions_01, max_time).then(async () => {
//         const input_budget = await driver.findElement(
//           By.xpath(input_budget_path)
//         );
//         await input_budget.sendKeys(DATA.budget);
//         /// handle choose bidding focus
//         const install_volume_path =
//           "//material-dropdown-select[@aria-label='How do you want to track install volume?']";
//         const bidding_focus_path_01 = "//div[normalize-space()='Install volume";
//         const bidding_focus_path_02 =
//           "//div[normalize-space()='In-app actions']";
//         const bidding_focus_path_03 =
//           "//div[normalize-space()='In-app action value']";
//         const dropdown_path =
//           "//material-dropdown-select[@aria-label='What do you want to focus on?']";
//         const check_bd_path =
//           DATA.bidding_focus === "In-app action value"
//             ? bidding_focus_path_03
//             : DATA.bidding_focus === "Install volume"
//             ? bidding_focus_path_01
//             : bidding_focus_path_02;
//         const default_recmm_path = "//div[normalize-space()='Firebase']";
//         await driver
//           .findElement(By.xpath(install_volume_path))
//           .click()
//           .then(async () => {
//             await driver
//               .executeScript(
//                 "arguments[0].click()",
//                 await driver.findElement(By.xpath(default_recmm_path))
//               )
//               .then(async () => {
//                 await driver
//                   .findElement(By.xpath(dropdown_path))
//                   .click()
//                   .then(async () => {
//                     /// handle send data to bidding field
//                     const input_bid_path =
//                       "//input[@aria-label='Target cost per install in US Dollar']";
//                     const target_return_path =
//                       "//input[@aria-label='Target return on ad spend']";
//                     const target_on_actions =
//                       "//input[@aria-label='Target cost per action in US Dollar']";
//                     const check_path =
//                       DATA.bidding_focus === "In-app action value"
//                         ? target_return_path
//                         : DATA.bidding_focus === "Install volume"
//                         ? input_bid_path
//                         : target_on_actions;

//                     if (
//                       DATA.track_install_volume &&
//                       DATA.bidding_focus !== "Install volume" &&
//                       check_bd_path !== bidding_focus_path_01 &&
//                       DATA.track_install_volume.length > 0
//                     ) {
//                       await driver
//                         .findElement(By.xpath(check_bd_path))
//                         .click()
//                         .then(async () => {
//                           for (const track of DATA.track_install_volume) {
//                             await driver
//                               .findElements(By.className("conversion-action"))
//                               .then(async function (elements) {
//                                 for (const el of elements) {
//                                   const text = await el.getText();

//                                   if (text === track) {
//                                     console.log("==========OK==========");
//                                     await el.click();
//                                   }
//                                 }
//                               });
//                           }
//                         });
//                     }
//                     const split_bidding = DATA.bidding.toString();
//                     for (const bd of split_bidding) {
//                       await driver
//                         .findElement(By.xpath(check_path))
//                         .sendKeys(bd);
//                     }

//                     // await driver.sleep(2000);
//                     // handle next button
//                     const next_button_path =
//                       "//dynamic-component[@class='content-element _ngcontent-awn-CM_EDITING-39']//div[@class='_ngcontent-awn-CM_EDITING-42']//material-ripple[@class='_ngcontent-awn-CM_EDITING-13']";
//                     const condition_04 = until.elementLocated({
//                       xpath: next_button_path,
//                     });
//                     await driver.wait(condition_04, max_time).then(async () => {
//                       await driver
//                         .findElement(By.xpath(next_button_path))
//                         .click()
//                         .then(async () => {
//                           await handleStep4(DATA, driver, userId, id).then(
//                             async () => {
//                               // console.log("OK STEP 3");
//                               if (
//                                 DATA.videos &&
//                                 DATA.videos[0].length > 0 &&
//                                 DATA.videos.length > 0
//                               ) {
//                                 await handleStep5(DATA, driver, userId, id);
//                                 console.log("=====OK 01=====");
//                               }
//                               if (
//                                 DATA.images &&
//                                 DATA.images[0].length > 0 &&
//                                 DATA.images.length > 0
//                               ) {
//                                 await handleStep6_1(DATA, driver, userId, id);
//                                 console.log("=====OK 02=====");
//                               }
//                               nextAction(DATA, driver, userId, id)
//                                 .then(() => resolve("success"))
//                                 .catch(reject);
//                             }
//                           );
//                         });
//                     });
//                   });
//               });
//           });
//       });
//     } catch (error) {
//       reject(error);
//       console.log("RUN TEST FAILED", error);
//       updateStatusCampaign(id, "canceled", userId);
//       updateAdsGroupCampaign(DATA.ads_group_id, "canceled", userId);
//     }
//   });
// };
// handle bidding && budget
const handleStep3 = async (DATA, driver, userId, id) => {
  // console.log("=================STEP 3===================", DATA);
  return new Promise(async (resolve, reject) => {
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
        const install_volume_path =
          "//material-dropdown-select[@aria-label='How do you want to track install volume?']";
        const bidding_focus_path_01 = "//div[normalize-space()='Install volume";
        const bidding_focus_path_02 =
          "//div[normalize-space()='In-app actions']";
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
        const default_recmm_path = "//div[normalize-space()='Firebase']";
        await driver
          .findElement(By.xpath(install_volume_path))
          .click()
          .then(async () => {
            await driver
              .executeScript(
                "arguments[0].click()",
                await driver.findElement(By.xpath(default_recmm_path))
              )
              .then(async () => {
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
                                    // console.log("==========OK==========");
                                    await el.click();
                                  }
                                }
                              });
                          }
                        });
                    }
                    const split_bidding = DATA.bidding.toString();
                    for (const bd of split_bidding) {
                      await driver
                        .findElement(By.xpath(check_path))
                        .sendKeys(bd);
                    }
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
                          await handleStep4(DATA, driver, userId, id).then(
                            async () => {
                              // console.log("OK STEP 3");
                              if (
                                DATA.videos &&
                                DATA.videos[0].length > 0 &&
                                DATA.videos.length > 0
                              ) {
                                await handleStep5(DATA, driver, userId, id);
                                console.log("=====OK 01=====");
                              }
                              if (
                                DATA.images &&
                                DATA.images[0].length > 0 &&
                                DATA.images.length > 0
                              ) {
                                await handleStep6_1(DATA, driver, userId, id);
                                console.log("=====OK 02=====");
                              }
                              nextAction(DATA, driver, userId, id)
                                .then(() => resolve("success"))
                                .catch(reject);
                            }
                          );
                        });
                    });
                  });
              });
          });
      });
    } catch (error) {
      reject(error);
      console.log("RUN TEST FAILED", error);
      updateStatusCampaign(id, "canceled", userId);
      updateAdsGroupCampaign(DATA.ads_group_id, "canceled", userId);
    }
  });
};
// handle ads group
const handleStep4 = async (DATA, driver, userId, id) => {
  return new Promise(async (resolve, reject) => {
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
          await driver
            .findElement(By.xpath(input_headline_path))
            .sendKeys(value);
        }
        for (const [index, value] of DATA.desc.entries()) {
          const input_des_path =
            "(//input[@aria-label='Description " + (index + 1) + " of 5'])[1]";
          await driver.findElement(By.xpath(input_des_path)).sendKeys(value);
        }
        resolve("success");
        // handleStep5(DATA, driver, userId, id)
        //   .then(() => resolve('success'))
        //   .catch(reject)
      });
    } catch (error) {
      reject(error);
      console.log("RUN TEST FAILED", error);
      updateStatusCampaign(id, "canceled", userId);
      updateAdsGroupCampaign(DATA.ads_group_id, "canceled", userId);
    }
  });
};
/// handle choose video youtube
const handleStep5 = async (DATA, driver, userId, id) => {
  // console.log('CHECK VIDEO')
  return new Promise(async (resolve, reject) => {
    try {
      const soft_time = 1000;
      const max_time = 30000;
      const choose_video_path =
        "//material-button[@aria-label='Add videos']//material-ripple[@class='_ngcontent-awn-CM_EDITING-13']";
      const choose_video = await driver.findElement(
        By.xpath(choose_video_path)
      );
      await driver
        .executeScript("arguments[0].click()", choose_video)
        .then(async () => {
          const loading_path = "//span[normalize-space()='Search YouTube']";
          const conditions_01 = until.elementLocated({
            xpath: loading_path,
          });
          await driver.wait(conditions_01, max_time).then(async () => {
            const input = await driver.findElement(By.xpath(loading_path));
            await driver
              .executeScript("arguments[0].click()", input)
              .then(async () => {
                await driver.sleep(soft_time).then(async () => {
                  const input_search_path = "input input-area";
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
                      await driver
                        .executeScript("arguments[0].click()", btn_save)
                        .then(() => resolve("success"))
                        .catch(reject);
                    });
                });
              });
          });
        });
    } catch (error) {
      reject(error);
      console.log("RUN TEST FAILED", error);
      updateStatusCampaign(id, "canceled", userId);
      updateAdsGroupCampaign(DATA.ads_group_id, "canceled", userId);
    }
  });
};
/// handle validation errors step
// const handleStep6 = async (DATA, driver, userId, id) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const max_time = 30000;
//       await driver.sleep(15000).then(async () => {
//         const edit_icon = "(//i[@aria-label='Edit ad group name'])[1]";
//         const edit_ads_group_name_path_btn = await driver.findElement(
//           By.xpath(edit_icon)
//         );
//         await driver
//           .executeScript("arguments[0].click()", edit_ads_group_name_path_btn)
//           .then(async () => {
//             const input_ads_group_name_path =
//               "(//input[@type='text'])[" +
//               (DATA.location_to_target === "Enter another location"
//                 ? (DATA.bidding_focus === "Install volume" ? 8 : 9) +
//                   DATA.headline.length +
//                   DATA.desc.length
//                 : (DATA.bidding_focus === "Install volume" ? 7 : 8) +
//                   DATA.headline.length +
//                   DATA.desc.length) +
//               "]";
//             const condition_04 = until.elementLocated({
//               xpath: input_ads_group_name_path,
//             });
//             await driver.wait(condition_04, max_time).then(async () => {
//               await clearInput(driver, input_ads_group_name_path).then(
//                 async () => {
//                   await driver
//                     .findElement(By.xpath(input_ads_group_name_path))
//                     .sendKeys(DATA.ads_group_name);
//                   await driver.sleep(5000).then(async () => {
//                     await driver
//                       .findElements(By.className("button button-next"))
//                       .then(async function (elements) {
//                         console.log("elements", elements.length);
//                         // Print the text of each element
//                         await driver
//                           .executeScript(
//                             "arguments[0].click()",
//                             elements[elements.length - 1]
//                           )
//                           .then(async () => {
//                             handleStep7(DATA, driver, userId, id)
//                               .then(() => resolve("success"))
//                               .catch(reject);
//                           });
//                       });
//                   });
//                 }
//               );
//             });
//           });
//       });
//     } catch (error) {
//       reject(error);
//       console.log("RUN TEST FAILED", error);
//       updateStatusCampaign(id, "canceled", userId);
//       updateAdsGroupCampaign(DATA.ads_group_id, "canceled", userId);
//     }
//   });
// };
const handleStep6 = async (DATA, driver, userId, id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const max_time = 30000;
      await driver.sleep(3000).then(async () => {
        // handle get link create ads group
        const btn_next_path = "button button-next";
        await driver
          .wait(
            until.elementsLocated({
              className: btn_next_path,
            }),
            max_time
          )
          .then(async () => {
            await driver
              .findElements(By.className(btn_next_path))
              .then(async function (elements) {
                // console.log("elements", elements.length);
                // Print the text of each element
                await driver
                  .wait(until.elementIsVisible(elements[3]), max_time)
                  .then(async () => {
                    await driver
                      .executeScript("arguments[0].click()", elements[3])
                      .then(async () => {
                        handleStep7(DATA, driver, userId, id)
                          .then(() => resolve("success"))
                          .catch(reject);
                      });
                  });
              });
          });
      });
    } catch (error) {
      reject(error);
      console.log("RUN TEST FAILED", error);
      updateStatusCampaign(id, "canceled", userId);
      updateAdsGroupCampaign(DATA.ads_group_id, "canceled", userId);
    }
  });
};
/// handle choose image
const handleStep6_1 = async (DATA, driver, userId, id) => {
  console.log("CHECK IMAGE");
  return new Promise(async (resolve, reject) => {
    try {
      const max_time = 30000;
      const btn_img_path = "//material-button[@aria-label='Add images']";
      const findButton = await driver.findElement(By.xpath(btn_img_path));
      await driver
        .executeScript("arguments[0].click()", findButton)
        .then(async () => {
          await driver.sleep(3000).then(async () => {
            const btn_upload_css = "upload-button .upload-menu";
            await driver
              .wait(until.elementLocated(By.css(btn_upload_css)), max_time)
              .then(async () => {
                await driver
                  .findElement(By.css(btn_upload_css))
                  .click()
                  .then(async () => {
                    const from_pc_class = "menu-item-label";
                    await driver
                      .findElements(By.className(from_pc_class))
                      .then(async (pc) => {
                        handleStep6_2(DATA, pc[0], driver, userId, id)
                          .then(() => resolve("success"))
                          .catch(reject);
                      });
                    // });
                  });
              });
          });
        });
    } catch (error) {
      reject(error);
      console.log("RUN TEST FAILED", error);
      updateStatusCampaign(id, "canceled", userId);
      updateAdsGroupCampaign(DATA.ads_group_id, "canceled", userId);
    }
  });
};
/// handle choose image
const handleStep6_2 = async (DATA, element, driver, userId, id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const max_time = 30000;
      const folder_path = DATA.images;
      const files = fs.readdirSync(folder_path);
      const filePaths = files.map((file) => `${folder_path}\\${file}`);
      for (const file of filePaths) {
        await driver.findElement(By.css("input[type='file']")).sendKeys(file);
      } //material-button[@class='confirm-button _nghost-awn-CM_EDITING-6 _ngcontent-awn-CM_EDITING-118']//material-ripple[@class='_ngcontent-awn-CM_EDITING-6']
      const confirm_btn_class = "confirm-button";
      // finally, wait for the button to become enabled
      await driver
        .findElements(By.className(confirm_btn_class))
        .then(async (btn) => {
          // console.log("=====BTN 0=====", btn[0]);
          await driver
            .wait(until.elementIsEnabled(btn[0]), max_time)
            .then(async () => {
              await driver.sleep(20000).then(async () => {
                btn[0]
                  .click()
                  .then(() => {
                    console.log("==========CLICK========");
                    resolve("success");
                  })
                  .catch(reject);
              });
            });
        });
    } catch (error) {
      reject(error);
      console.log("RUN TEST FAILED", error);
      updateStatusCampaign(id, "canceled", userId);
      updateAdsGroupCampaign(DATA.ads_group_id, "canceled", userId);
    }
  });
};
// last step && submit create campaign
// const handleStep7 = async (DATA, driver, userId, id) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const max_time = 30000;
//       /// loading create campaign success
//       const loading_create_campaign_success_path =
//         "(//div[@aria-label='Ad groups'])[1]";
//       const conditions_01 = until.elementLocated({
//         xpath: loading_create_campaign_success_path,
//       });
//       await driver.wait(conditions_01, max_time).then(async () => {
//         const URL = await driver.getCurrentUrl();
//         const update_URL = URL.split("?");
//         const new_ads_group_url =
//           "https://ads.google.com/aw/adgroups/new/universal?" + update_URL[1];
//         console.log("==========NEW ADS GROUP URL=======", new_ads_group_url);
//         await updateAdsGroupCampaign(
//           id,
//           new_ads_group_url,
//           userId,
//           "Run test success"
//         );
//         await updateStatusCampaign(id, "completed", userId, "RUN TEST SUCCESS");
//         await updateAdsGroupCampaign(
//           id,
//           "completed",
//           userId,
//           "RUN TEST SUCCESS"
//         );

//         await driver.sleep(5000).then(async () => {
//           resolve("success");
//           await driver.quit();
//         });
//       });
//     } catch (error) {
//       reject(error);
//       console.log("RUN TEST FAILED", error);
//       updateStatusCampaign(id, "canceled", userId);
//       updateAdsGroupCampaign(DATA.ads_group_id, "canceled", userId);
//     }
//   });
// };
const handleStep7 = async (DATA, driver, userId, id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const max_time = 30000;
      /// loading create campaign success
      const loading_create_campaign_success_path =
        "//span[normalize-space()='Total: Campaign']";
      const conditions_01 = until.elementLocated({
        xpath: loading_create_campaign_success_path,
      });
      await driver.wait(conditions_01, max_time).then(async () => {
        const ads_group_edit_path = "edit-panel-icon material-button";
        const conditions_02 = until.elementLocated({
          css: ads_group_edit_path,
        });
        await driver.wait(conditions_02, max_time).then(async () => {
          const icon = await driver.findElement(By.css(ads_group_edit_path));
          await driver
            .executeScript("arguments[0].click();", icon)
            .then(async () => {
              const input_ads_group_css =
                "string-lens-edit label > .input.input-area";
              const condition_03 = until.elementLocated({
                css: input_ads_group_css,
              });
              await driver.wait(condition_03, max_time).then(async () => {
                const input_ads_name = await driver.findElement(
                  By.css(input_ads_group_css)
                );
                await clearInput(input_ads_name).then(async () => {
                  input_ads_name
                    .sendKeys(DATA.ads_group_name)
                    .then(async () => {
                      const btn_save_class = "btn btn-yes";
                      await driver
                        .findElements(By.className(btn_save_class))
                        .then(async (elements) => {
                          elements[elements.length - 1]
                            .click()
                            .then(async () => {
                              console.log("RUN TEST SUCCESS");
                              await updateStatusCampaign(
                                id,
                                "completed",
                                userId,
                                "Run test success"
                              );
                              await updateAdsGroupCampaign(
                                DATA.ads_group_id,
                                "completed",
                                userId,
                                "RUN TEST SUCCESS"
                              );
                              await driver.sleep(2000).then(async () => {
                                await driver.quit();
                                resolve("success");
                              });
                            });
                        });
                    });
                });
              });
            });
        });
      });
    } catch (error) {
      reject(error);
      console.log("RUN TEST FAILED", error);
      updateStatusCampaign(id, "canceled", userId);
      updateAdsGroupCampaign(
        DATA.ads_group_id,
        "canceled",
        userId,
        "RUN TEST SUCCESS"
      );
    }
  });
};
// handle next action
const nextAction = async (DATA, driver, userId, id) => {
  // handle next button
  return new Promise(async (resolve, reject) => {
    try {
      const next_button_path =
        "//dynamic-component[@class='content-element _ngcontent-awn-CM_EDITING-39']//div[@class='_ngcontent-awn-CM_EDITING-42']//material-button[@role='button']";
      const next = await driver.findElement(By.xpath(next_button_path));
      await driver
        .executeScript("arguments[0].click()", next)
        .then(async () => {
          handleStep6(DATA, driver, userId, id)
            .then(() => resolve("success"))
            .catch(reject);
        });
    } catch (error) {
      reject(error);
      console.log("RUN TEST FAILED", error);
      updateStatusCampaign(id, "canceled", userId);
      updateAdsGroupCampaign(DATA.ads_group_id, "canceled", userId);
    }
  });
};
// handle run campaign gg ads
const handleFetchApiGgAds = catchAsync(async (req, res, next) => {
  const { data } = req.body;
  try {
    const origin_data = data;
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
      startDate: {
        date: formattedDate,
        time: "00:00",
      },
      desc: origin_data.ads_groups[0].desc,
      ads_group_id: origin_data.ads_groups[0]._id,
      videos: origin_data.ads_groups[0].videos,
      headline: origin_data.ads_groups[0].headline,
      ads_group_name: origin_data.ads_groups[0].ads_group_name,
      bidding: origin_data.bidding,
      images: origin_data.ads_groups[0].images,
    };
    // console.log('==========DATA===========', campaign_data)
    req.data = campaign_data;
    req.body = {
      ...req.body,
      id: origin_data._id,
    };
    await runTest(req, res, next);
  } catch (error) {
    throw new ApiError(400, "BAD REQUEST");
  }
});
const handleFetchMultiApiGgAds = catchAsync(async (req, res, next) => {
  const { all_campaign } = req.body;
  // console.log("first", all_campaign);
  try {
    let index = 0;
    while (index < all_campaign.length) {
      const origin_data = all_campaign[index];
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
        startDate: {
          date: formattedDate,
          time: "00:00",
        },
        ads_group_id: origin_data.ads_groups[0]._id,
        desc: origin_data.ads_groups[0].desc,
        videos: origin_data.ads_groups[0].videos,
        headline: origin_data.ads_groups[0].headline,
        ads_group_name: origin_data.ads_groups[0].ads_group_name,
        bidding: origin_data.bidding,
      };
      console.log("==========DATA===========", campaign_data);
      req.data = campaign_data;

      req.body = {
        ...req.body,
        id: all_campaign[index]._id,
      };

      await runTest(req, res, next);
      index++;
    }
  } catch (error) {
    throw new ApiError(400, "BAD REQUEST");
  }
});
// runTest();
module.exports = {
  runTest,
  handleFetchApiGgAds,
  handleFetchMultiApiGgAds,
};
