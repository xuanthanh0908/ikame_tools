const { Builder, Browser, By, Key, until } = require("selenium-webdriver");
const axios = require("axios");
const firefox = require("selenium-webdriver/firefox");
const webdriver = require("selenium-webdriver");
const ApiError = require("../utils/apiError");
const catchAsync = require("../utils/catchAsync");
const { readFile } = require("../utils/readfile");
const { emitEvent } = require("../utils/socket");
const fs = require("fs");
const backend_campaign_url = "https://api.ikamegroup.com/api/v1";
// const backend_campaign_url = "http://localhost:9000/api/v1";
const url = {
  ADSGROUP: "/ads-asset",
};
// const numBrowsers = 9;
let x = 0,
  y = 0;
// Create an array to store the WebDriver instances for each browser
const drivers = [];

const diff = (a, b) => {
  return Math.abs(a - b);
};

const updateAdsGroupCampaign = async (
  id,
  status,
  userId,
  message = "Run test failed"
) => {
  try {
    await axios.patch(backend_campaign_url + url.ADSGROUP + "/" + id, {
      status: status,
    });
    emitEvent("message", {
      message,
      type: "success",
      userId,
    });
  } catch (error) {
    console.log("===========API ERROR=================", error);
    emitEvent("message", {
      message,
      type: "success",
      userId,
    });
  }
};
/// clear input
const clearInput = async (el) => {
  await el.sendKeys(Key.CONTROL, "a");
  await el.sendKeys(Key.DELETE);
};
const runTest = (req, res, next, driver) => {
  const { id, userId } = req.body;
  const DATA = req.data;
  // console.log("=============DATA==============", DATA);
  const max_time = 30000;
  return new Promise(async (resolve, reject) => {
    try {
      const res = await axios.get(
        backend_campaign_url +
          "/config/ads-groups?created_by=" +
          userId +
          "&is_default=true"
      );
      await driver.get(res.data.data[0].campaign_url);
      await handleStep1(DATA, driver, userId, id, res.data.data[0].id_game_app);

      const loading_page = "//div[contains(text(),'Ad group name')]";
      await driver
        .wait(
          until.elementLocated({
            xpath: loading_page,
          }),
          max_time
        )
        .then(async () => {
          /// wait for load down components loaded
          const ads_group_name_path = "(//input[@type='text'])[2]";
          const condition = until.elementLocated({
            xpath: ads_group_name_path,
          });
          await driver.wait(condition, max_time).then(async () => {
            const ads_group = await driver.findElement(
              By.xpath(ads_group_name_path)
            );
            // console.log("===ads_group=====", ads_group);
            clearInput(ads_group).then(async () => {
              await ads_group.sendKeys(DATA.ads_group_name).then(async () => {
                // handle headline
                const input_headline_path =
                  "(//input[@aria-label='Headline 1 of 5'])[1]";
                const conditions_01 = until.elementLocated({
                  xpath: input_headline_path,
                });
                await driver.wait(conditions_01, max_time).then(async () => {
                  for (const [index, value] of DATA.headline.entries()) {
                    const input_headline_path =
                      "(//input[@aria-label='Headline " +
                      (index + 1) +
                      " of 5'])[1]";
                    await driver
                      .findElement(By.xpath(input_headline_path))
                      .sendKeys(value);
                  }
                  for (const [index, value] of DATA.desc.entries()) {
                    const input_des_path =
                      "(//input[@aria-label='Description " +
                      (index + 1) +
                      " of 5'])[1]";
                    await driver
                      .findElement(By.xpath(input_des_path))
                      .sendKeys(value);
                  }

                  if (
                    DATA.videos &&
                    DATA.videos[0]?.length > 0 &&
                    DATA.videos.length > 0
                  ) {
                    await handleStep2(DATA, driver, userId, id);
                    console.log("=====OK 01=====");
                  }
                  if (
                    DATA.images &&
                    DATA.images[0]?.length > 0 &&
                    DATA.images.length > 0
                  ) {
                    await handleStep3(DATA, driver, userId, id);
                    console.log("=====OK 02=====");
                  }

                  nextAction(DATA, driver, userId, id)
                    .then(() => resolve("success"))
                    .catch(reject);

                  // // console.log("click choose video");
                  // handleStep2(DATA, driver, id, userId)
                  //   .then((e) => {
                  //     resolve(e);
                  //   })
                  //   .catch(reject);
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
  }).catch((err) => {
    console.log("RUN TEST FAILED", err);
    updateAdsGroupCampaign(id, "canceled", userId);
  });
};
/// handle get and choose campaign id
const handleStep1 = async (DATA, driver, id, userId, id_game_app) => {
  const max_time = 30000;
  const soft_time = 500;
  return new Promise(async (resolve, reject) => {
    try {
      /// handle change account
      // const avatar_css = "deferred-component img";
      // const condition_03 = until.elementLocated({
      //   css: avatar_css,
      // });
      // await driver.wait(condition_03, max_time).then(async () => {
      //   await driver.findElement(By.css(avatar_css)).click();
      //   const id_class = "pretty-customer-id";
      //   const condition_04 = until.elementLocated({
      //     className: id_class,
      //   });
      //   await driver.wait(condition_04, max_time).then(async () => {
      //     await driver
      //       .findElements(By.className(id_class))
      //       .then(async (els) => {
      //         for (const el of els) {
      //           const text = await el.getText();
      //           if (text === id_game_app) {
      //             await el.click();
      //           }
      //         }
      //       });
      //   });
      // });
      const drop_down_path = ".button-content material-icon";
      const loading_path = "mat-checkbox";
      const condition = until.elementLocated({
        tagName: loading_path,
      });
      // handle choose default status ALL
      const cp_status_drowdown_path = "(//material-chip[@role='row'])[1]";
      const condition_01 = until.elementLocated({
        xpath: cp_status_drowdown_path,
      });
      await driver.wait(condition_01, max_time).then(async () => {
        const dropdown_status = await driver.findElement(
          By.xpath(cp_status_drowdown_path)
        );
        await driver.sleep(soft_time).then(async () => {
          await driver
            .executeScript("arguments[0].click();", dropdown_status)
            .then(async () => {
              const all_items_path =
                "//material-select-item[normalize-space()='All']";
              const condition_02 = until.elementLocated({
                xpath: all_items_path,
              });
              await driver.wait(condition_02, max_time).then(async () => {
                await driver.findElement(By.xpath(all_items_path)).click();
                await driver.wait(condition, max_time).then(async () => {
                  const dropdown = await driver.findElement(
                    By.css(drop_down_path)
                  );
                  await driver.sleep(soft_time).then(async () => {
                    driver
                      .executeScript("arguments[0].click();", dropdown)
                      .then(async () => {
                        const input_search_campaign_path =
                          ".search-input .input-container .input.input-area";
                        const condition = until.elementLocated({
                          css: drop_down_path,
                        });
                        await driver
                          .wait(condition, max_time)
                          .then(async () => {
                            await driver
                              .findElement({
                                css: input_search_campaign_path,
                              })
                              .sendKeys(DATA.campaign_name)
                              .then(async () => {
                                await driver.sleep(soft_time).then(async () => {
                                  const campaign_css =
                                    "material-list span + material-select-dropdown-item";
                                  const condition = until.elementLocated({
                                    css: campaign_css,
                                  });
                                  await driver
                                    .wait(condition, max_time)
                                    .then(async () => {
                                      await driver
                                        .findElement(By.css(campaign_css))
                                        .click()
                                        .then(async () => {
                                          const button_add_path =
                                            "//i[normalize-space()='add']";
                                          const condition =
                                            until.elementLocated({
                                              xpath: button_add_path,
                                            });
                                          await driver
                                            .wait(condition, max_time)
                                            .then(async () => {
                                              const btn_ads =
                                                await driver.findElement(
                                                  By.xpath(button_add_path)
                                                );
                                              await driver
                                                .executeScript(
                                                  "arguments[0].click()",
                                                  btn_ads
                                                )
                                                .then(() => resolve("success"));
                                            });
                                        });
                                    });
                                });
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
      updateAdsGroupCampaign(id, "canceled", userId);
    }
  });
};
/// handle choose video youtube
const handleStep2 = async (DATA, driver, id, userId) => {
  const soft_time = 1000;
  const max_time = 30000;
  return new Promise(async (resolve, reject) => {
    try {
      // handle choose video
      const choose_video_path = "//material-button[@aria-label='Add videos']";
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
                      const save_video_class = "confirm-button";
                      await driver
                        .findElements(By.className(save_video_class))
                        .then(async (elements) => {
                          elements[elements.length - 2]
                            .click()
                            .then(() => resolve("success"))
                            .catch(reject);
                        });
                    });

                  // });
                });
              });
          });
        });
    } catch (error) {
      reject(error);
      console.log("RUN TEST FAILED", error);
      updateAdsGroupCampaign(id, "canceled", userId);
    }
  });
};
/// handle choose image
const handleStep3 = async (DATA, driver, userId, id) => {
  // console.log('CHECK IMAGE')
  return new Promise(async (resolve, reject) => {
    try {
      const max_time = 30000;
      const btn_img_path = "//material-button[@aria-label='Add images']";
      const findButton = await driver.findElement(By.xpath(btn_img_path));
      await driver
        .executeScript("arguments[0].click()", findButton)
        .then(async () => {
          await driver.sleep(3000).then(async () => {
            const btn_upload_className = "upload-menu";
            await driver
              .wait(
                until.elementLocated(By.className(btn_upload_className)),
                max_time
              )
              .then(async () => {
                await driver
                  .findElements(By.className(btn_upload_className))
                  .then(async (elements) => {
                    // console.log("====CHECK EL====", elements[0]);
                    elements[0].click().then(async () => {
                      const from_pc_class = "menu-item-label";
                      await driver
                        .findElements(By.className(from_pc_class))
                        .then(async (pc) => {
                          handleStep4(DATA, pc[0], driver, userId, id)
                            .then(() => resolve("success"))
                            .catch(reject);
                        });
                      // });
                    });
                  });
              });
          });
        });
    } catch (error) {
      reject(error);
      console.log("RUN TEST FAILED", error);
      updateAdsGroupCampaign(DATA.ads_group_id, "canceled", userId);
    }
  });
};
/// handle choose image
const handleStep4 = async (DATA, element, driver, userId, id) => {
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
      updateAdsGroupCampaign(DATA.ads_group_id, "canceled", userId);
    }
  });
};
// handle next action
const nextAction = async (DATA, driver, userId, id) => {
  // handle next button
  return new Promise(async (resolve, reject) => {
    try {
      const soft_time = 1000;
      const next_button_class = "btn btn-yes";
      await driver
        .findElements(By.className(next_button_class))
        .then(async (elements) => {
          await driver
            .executeScript("arguments[0].click()", elements[0])
            .then(async () => {
              // finish
              await driver.sleep(soft_time).then(async () => {
                updateAdsGroupCampaign(
                  id,
                  "completed",
                  userId,
                  "RUN TEST SUCCESS"
                );
              });
              await driver.sleep(soft_time).then(async () => {
                resolve({
                  status: 200,
                  message: "RUN TEST SUCCESS",
                });
                await driver.quit();
              });
            });
        });
    } catch (error) {
      console.log("RUN TEST FAILED", error);
      reject({
        status: 400,
        message: "RUN TEST FAILED",
      });
      updateAdsGroupCampaign(id, "canceled", userId);
    }
  });
};

// Create a function to open a new browser window and set its size
const openBrowserWindow = async (data, index) => {
  const numBrowsers = data.length;
  return new Promise(async (resolve, reject) => {
    readFile().then(async (path) => {
      try {
        // init maxtime
        let options = new firefox.Options();

        options.setProfile(path);
        options.setPreference("layout.css.devPixelsPerPx", "0.7");
        //To wait for browser to build and launch properly
        let driver = await new webdriver.Builder()
          .forBrowser("firefox")
          .setFirefoxOptions(options)
          .build();
        // Add the driver instance to the array
        drivers.push(driver);

        // Get the window size
        const windowSize = await driver.manage().window().getSize();
        const windowWidth = windowSize.width;
        const windowHeight = windowSize.height;
        let divide = 1;
        if (numBrowsers % 2 == 0) {
          divide = 2;
        } else {
          divide = 3;
        }
        // Calculate the desired size for the browser window
        const browserWidth = Math.floor(
          (windowWidth * 1) / (numBrowsers === 1 ? 1 : divide)
        );
        const browserHeight = Math.floor(
          (windowHeight * 1) / (numBrowsers === 1 ? 1 : divide)
        );
        await driver.manage().window().setRect({
          width: browserWidth,
          height: browserHeight,
          x: x,
          y: y,
        });

        resolve("success");
        // Update the position for the next browser window
        x += browserWidth;
        if (diff(x, windowWidth) <= 20) {
          x = 0;
          y += browserHeight;
        }

        const req = data[index];
        // console.log("DATA", req);
        const res = null;
        const next = null;
        runTest(req, res, next, driver);
      } catch (error) {
        reject(error);
      }
    });
  });
};

// Open multiple browser windows
const openMultipleBrowsers = async (data) => {
  const numBrowsers = data.length;
  for (let i = 0; i < numBrowsers; i++) {
    await openBrowserWindow(data, i);
  }
};
// handle run campaign gg ads
const handFetchAdsGroup = catchAsync(async (req, res, next) => {
  const { id } = req.body;
  let campaign_can_run = [];
  try {
    const response = await axios.get(
      backend_campaign_url + url.ADSGROUP + "/" + id
    );
    if (response.status === 200) {
      const origin_data = response.data.data;
      // console.log('==========DATA===========', origin_data)
      req.data = origin_data;
      if (
        origin_data.status === "pending" ||
        origin_data.status === "canceled"
      ) {
        campaign_can_run.push({
          data: origin_data,
          body: req.body,
        });
      }
      /// reset x, y
      x = 0;
      y = 0;
      if (campaign_can_run.length > 0) {
        // Example usage
        openMultipleBrowsers(campaign_can_run)
          .then(() => {
            // Do something after opening the browsers
            console.log("Browsers opened successfully");
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      }
    } else throw new ApiError(400, "BAD REQUEST");
  } catch (error) {
    throw new ApiError(400, "BAD REQUEST");
  }
});
// handle run multiple campaign ads group
const handMultiFetchAdsGroup = catchAsync(async (req, res, next) => {
  const { all_campaign } = req.body;
  let campaign_can_run = [];
  // console.log("======ALL CAMPAIGN======", all_campaign);
  try {
    let index = 0;
    while (index < all_campaign.length) {
      // console.log("======ID======", all_campaign[index]);
      const response = await axios.get(
        backend_campaign_url + url.ADSGROUP + "/" + all_campaign[index]
      );
      req.body = {
        ...req.body,
        id: all_campaign[index],
      };
      if (response.status === 200) {
        const origin_data = response.data.data;
        // console.log("==========DATA===========", origin_data);
        req.data = origin_data;
        if (
          origin_data.status === "pending" ||
          origin_data.status === "canceled"
        ) {
          campaign_can_run.push({
            data: origin_data,
            body: req.body,
          });
        }
      } else throw new ApiError(400, "BAD REQUEST");
      index++;
    }
    /// reset x, y
    x = 0;
    y = 0;
    console.log("======= ADS GROUP RUN =======", campaign_can_run.length);
    if (campaign_can_run.length > 0) {
      // Example usage
      openMultipleBrowsers(campaign_can_run)
        .then(() => {
          // Do something after opening the browsers
          console.log("====== ADS GROUP RUN SUCCESS ======");
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  } catch (error) {
    console.log("======ERROR======", error);
    throw new ApiError(400, "BAD REQUEST");
  }
});
// runTest();
module.exports = {
  runTest,
  handFetchAdsGroup,
  handMultiFetchAdsGroup,
  updateAdsGroupCampaign,
};
