const { By, Key, until } = require("selenium-webdriver");
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
/// handle choose video youtube
const handleStep1 = async (DATA, driver, id, userId) => {
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
const handleStep2 = async (DATA, driver, userId, id) => {
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
                          handleStep3(DATA, pc[0], driver, userId, id)
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
const handleStep3 = async (DATA, element, driver, userId, id) => {
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
// handle run campaign gg ads
const handFetchAdsGroup = catchAsync(async (req, res, next) => {
  const { data } = req.body;
  try {
    req.data = data;
    console.log("Data", data);
    req.body = {
      ...req.body,
      id: data._id,
    };
    if (data) {
      await runTest(req, res, next);
    }
  } catch (error) {
    console.log(error);
    // throw new ApiError(400, "BAD REQUEST");
  }
});
// handle run multiple campaign ads group
const handMultiFetchAdsGroup = catchAsync(async (req, res, next) => {
  const { all_campaign } = req.body;
  try {
    let index = 0;
    while (index < all_campaign.length) {
      req.body = {
        ...req.body,
        id: all_campaign[index]._id,
      };
      req.data = all_campaign[index];
      await runTest(req, res, next);

      index++;
    }
  } catch (error) {
    console.log("======ERROR======", error);
    throw new ApiError(400, "BAD REQUEST");
  }
});
/**
 *
 *
 * MAIN FUNCTION
 *
 */
const runTest = (req, res, next) => {
  const { id, userId } = req.body;
  const DATA = req.data;
  // console.log("=============DATA==============", DATA);
  const max_time = 30000;
  return new Promise(async (resolve, reject) => {
    readFile()
      .then(async (path) => {
        // init maxtime
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
          await driver.get(DATA.ads_group_url);
          // await handleStep1(DATA, driver, userId, id);
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

                clearInput(ads_group).then(async () => {
                  await ads_group
                    .sendKeys(DATA.ads_group_name)
                    .then(async () => {
                      // handle headline
                      const input_headline_path =
                        "(//input[@aria-label='Headline 1 of 5'])[1]";
                      const conditions_01 = until.elementLocated({
                        xpath: input_headline_path,
                      });
                      await driver
                        .wait(conditions_01, max_time)
                        .then(async () => {
                          // console.log("DATA.headline", DATA.headline);
                          for (const [
                            index,
                            value,
                          ] of DATA.headline.entries()) {
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
                            await handleStep1(DATA, driver, userId, id);
                            console.log("=====VIDEO RUNNING=====");
                          }
                          if (
                            DATA.images &&
                            DATA.images[0]?.length > 0 &&
                            DATA.images.length > 0
                          ) {
                            await handleStep2(DATA, driver, userId, id);
                            console.log("=====IMAGE RUNNING=====");
                          }

                          nextAction(DATA, driver, userId, id)
                            .then(() => resolve("success"))
                            .catch(reject);
                        });
                    });
                });
              });
            });
        } catch (error) {
          await driver.quit();
          updateAdsGroupCampaign(id, "canceled", userId);
          reject(error);
        }
      })
      .catch(async (err) => {
        console.log("RUN TEST FAILED", err);
        updateAdsGroupCampaign(id, "canceled", userId);
      });
  });
};
// runTest();
module.exports = {
  runTest,
  handFetchAdsGroup,
  handMultiFetchAdsGroup,
  updateAdsGroupCampaign,
};
