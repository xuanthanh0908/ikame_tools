const { Builder, Browser, By, Key, until } = require("selenium-webdriver");
const axios = require("axios");
const firefox = require("selenium-webdriver/firefox");
const webdriver = require("selenium-webdriver");
const ApiError = require("../utils/apiError");
const catchAsync = require("../utils/catchAsync");
const { readFile } = require("../utils/readfile");
const { clearInput } = require("./automate_ggAds");
const { emitEvent } = require("../utils/socket");
// const backend_campaign_url = "https://api.ikamegroup.com/api/v1";
const backend_campaign_url = "http://localhost:9000/api/v1";
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
              const input_class = "input input-area";
              await driver
                .findElements(By.className(input_class))
                .then(async (elements) => {
                  // get length of elements
                  const length_el = elements.length;
                  const ads_group_name = elements[1];
                  // const ads_headline = elements[length_el - 3];
                  // const ads_desc = elements[length_el - 4];
                  // const ads_video = elements[length_el - 1];
                  clearInput(ads_group_name).then(async () => {
                    await ads_group_name
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

                            // handle choose video
                            const choose_video_path =
                              "//material-button[@aria-label='Add videos']";
                            const choose_video = await driver.findElement(
                              By.xpath(choose_video_path)
                            );
                            await driver
                              .executeScript(
                                "arguments[0].click()",
                                choose_video
                              )
                              .then(async () => {
                                // console.log("click choose video");
                                handleStep2(DATA, driver, id, userId)
                                  .then((e) => {
                                    resolve(e);
                                  })
                                  .catch(reject);
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
        updateAdsGroupCampaign(id, "canceled", userId);
      });
  });
};

const handleStep2 = async (DATA, driver, id, userId) => {
  const max_time = 30000;
  return new Promise(async (resolve, reject) => {
    try {
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
                      elements[elements.length - 2].click();
                      // // handle next button
                      const next_button_class = "btn btn-yes";
                      await driver
                        .findElements(By.className(next_button_class))
                        .then(async (elements) => {
                          elements[0].click().then(async () => {
                            // finish
                            await driver.sleep(10000).then(async () => {
                              updateAdsGroupCampaign(
                                id,
                                "completed",
                                userId,
                                "RUN TEST SUCCESS"
                              );
                            });
                            await driver.sleep(2000).then(async () => {
                              resolve({
                                status: 200,
                                message: "RUN TEST SUCCESS",
                              });
                              await driver.quit();
                            });
                          });
                        });
                    });
                });

              // });
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
  const { id } = req.body;
  try {
    const response = await axios.get(
      backend_campaign_url + url.ADSGROUP + "/" + id
    );
    if (response.status === 200) {
      const origin_data = response.data.data;
      // console.log("==========DATA===========", origin_data);

      req.data = origin_data;
      if (origin_data.status === "pending" || origin_data.status === "canceled")
        runTest(req, res, next);
    } else throw new ApiError(400, "BAD REQUEST");
  } catch (error) {
    throw new ApiError(400, "BAD REQUEST");
  }
});
// handle run multiple campaign ads group
const handMultiFetchAdsGroup = catchAsync(async (req, res, next) => {
  const { all_campaign } = req.body;
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
          await runTest(req, res, next);
        }
      } else throw new ApiError(400, "BAD REQUEST");
      index++;
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
};
