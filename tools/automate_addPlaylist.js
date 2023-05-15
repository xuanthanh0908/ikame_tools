const { Builder, Browser, By, Key, until } = require("selenium-webdriver");
const axios = require("axios");
const firefox = require("selenium-webdriver/firefox");
const webdriver = require("selenium-webdriver");
const ApiError = require("../utils/apiError");
const catchAsync = require("../utils/catchAsync");
const { readFile } = require("../utils/readfile");
const { emitEvent } = require("../utils/socket");
const backend_campaign_url = "https://api.ikamegroup.com/api/v1";
// const backend_campaign_url = "http://localhost:9000/api/v1";
const url = {
  CREATIVE: "/playlist",
};
const updateCreativePlaylistCampaign = async (
  id,
  status,
  userId,
  message = "Run test failed"
) => {
  try {
    await axios.patch(backend_campaign_url + url.CREATIVE + "/" + id, {
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
          await driver.get("https://studio.youtube.com");
          /// change channel
          const chanel_path = "//button[@id='avatar-btn']";
          await driver
            .findElement(By.xpath(chanel_path))
            .click()
            .then(async () => {
              const switch_acc_path =
                "//body//ytcp-app//ytd-compact-link-renderer[3]";
              await driver
                .findElement(By.xpath(switch_acc_path))
                .click()
                .then(async () => {
                  await driver.sleep(500).then(async () => {
                    const all_acc_tagname = "ytd-account-item-renderer";
                    await driver
                      .findElements(By.tagName(all_acc_tagname))
                      .then(async (elements) => {
                        for (let index = 0; index < elements.length; index++) {
                          const element = elements[index];
                          let pathItem =
                            '(//yt-formatted-string[@id="channel-title"])[' +
                            (index + 1) +
                            "]";
                          driver
                            .findElement(By.xpath(pathItem))
                            .getText()
                            .then(async (text) => {
                              if (text === DATA.channel_name) {
                                await element.click().then(async () => {
                                  handleStep2(driver, req, res, next)
                                    .then(() => resolve("success"))
                                    .catch(reject);
                                });
                              }
                            });
                        }
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
        updateCreativePlaylistCampaign(id, "canceled", userId);
      });
  });
};
///
const handleStep2 = async (driver, req, res, next) => {
  const { id, userId } = req.body;
  const DATA = req.data;
  const max_time = 30000;
  return new Promise(async (resolve, reject) => {
    try {
      const btn_create_path = "//div[contains(text(),'Create')]";
      await driver
        .wait(until.elementLocated(By.xpath(btn_create_path)), max_time)
        .then(async () => {
          const find_btn = await driver.findElement(By.xpath(btn_create_path));
          await find_btn.click().then(async () => {
            const btn_create_playlist_path =
              "//yt-formatted-string[normalize-space()='New playlist']";
            await driver
              .wait(
                until.elementLocated(By.xpath(btn_create_playlist_path)),
                max_time
              )
              .then(async () => {
                await driver
                  .findElement(By.xpath(btn_create_playlist_path))
                  .click();
                const wait_dialig_path =
                  "//div[contains(@class,'header-title style-scope ytcp-playlist-creation-dialog')]";
                await driver
                  .wait(
                    until.elementLocated(By.xpath(wait_dialig_path)),
                    max_time
                  )
                  .then(async () => {
                    const input_title_classname =
                      '#container-content ytcp-social-suggestion-input div[aria-label="Add title"]';
                    await driver
                      .findElement(By.css(input_title_classname))
                      .sendKeys(DATA.playlist_name);

                    const drop_down_path =
                      "//div[contains(@class,'has-label container style-scope ytcp-dropdown-trigger style-scope ytcp-dropdown-trigger')]//tp-yt-iron-icon[contains(@class,'style-scope ytcp-dropdown-trigger')]";
                    await driver
                      .findElement(By.xpath(drop_down_path))
                      .click()
                      .then(async () => {
                        await driver
                          .findElement(
                            By.xpath(
                              "//yt-formatted-string[normalize-space()='Unlisted']"
                            )
                          )
                          .click();
                      });

                    const btn_create_path =
                      "//ytcp-button[@id='create-button']//div[contains(@class,'label style-scope ytcp-button')][normalize-space()='Create']";
                    await driver.findElement(By.xpath(btn_create_path)).click();
                    const is_created_path = wait_dialig_path;
                    const find_toast = await driver.findElement(
                      By.xpath(is_created_path)
                    );
                    await driver
                      .wait(until.elementIsNotVisible(find_toast), max_time)
                      .then(async () => {
                        console.log("=====CREATE PLAYLIST SUCCESS=====");
                        updateCreativePlaylistCampaign(id, "completed", userId);
                        resolve("success");
                        await driver.quit();
                      })
                      .catch(reject);
                  });
              });
          });
        });
    } catch (error) {
      reject(error);
      console.log("RUN TEST FAILED", error);
      updateCreativePlaylistCampaign(id, "canceled", userId);
    }
  });
};

// handle run campaign gg ads
const handFetchCreativePlaylist = catchAsync(async (req, res, next) => {
  const { id } = req.body;
  try {
    const response = await axios.get(
      backend_campaign_url + url.CREATIVE + "/" + id
    );
    if (response.status === 200) {
      const origin_data = response.data.data;
      // console.log("==========DATA===========", origin_data);
      req.data = origin_data;
      if (origin_data.status === "pending" || origin_data.status === "canceled")
        await runTest(req, res, next);
    } else throw new ApiError(400, "BAD REQUEST");
  } catch (error) {
    throw new ApiError(400, "BAD REQUEST");
  }
});
// handle run multiple campaign ads group
const handMultiFetchCreativePlaylist = catchAsync(async (req, res, next) => {
  const { all_campaign } = req.body;
  // console.log("======ALL CAMPAIGN======", all_campaign);
  try {
    let index = 0;
    while (index < all_campaign.length) {
      // console.log("======ID======", all_campaign[index]);
      const response = await axios.get(
        backend_campaign_url + url.CREATIVE + "/" + all_campaign[index]
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
  handFetchCreativePlaylist,
  handMultiFetchCreativePlaylist,
};
