const { Builder, Browser, By, Key, until } = require("selenium-webdriver");
const axios = require("axios");
const firefox = require("selenium-webdriver/firefox");
const webdriver = require("selenium-webdriver");
const ApiError = require("../utils/apiError");
const { readFile } = require("../utils/readfile");
const { emitEvent } = require("../utils/socket");
const fs = require("fs");
// const backend_campaign_url = "https://api.ikamegroup.com/api/v1";
const backend_campaign_url = "http://localhost:9000/api/v1";
const url = {
  YOUTUBE: "/youtube",
};
const updateCreativeYTB = async (
  id,
  status,
  youtube_url = null,
  userId,
  message = "Run test failed"
) => {
  try {
    await axios.patch(backend_campaign_url + url.YOUTUBE + "/" + id, {
      status: status,
      ...(youtube_url && { youtube_url: youtube_url }),
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

const run_Now = (req, res, next) => {
  const { id, userId } = req.body;
  const DATA = req.data;
  // console.log("=============DATA==============", DATA);
  const max_time = 70000;
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
                                  handeleStep_02(DATA, driver, req, res, next)
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
        } catch (error) {
          reject(error);
        }
      })
      .catch((err) => {
        reject(err);
        updateCreativeYTB(id, "canceled", userId);
        console.log("RUN TEST FAILED", err);
        // updateAdsGroupCampaign(id, 'canceled', userId)
      });
  });
};
// handle read video path && run consequent
const handeleStep_02 = async (DATA, driver, req, res, next) => {
  const { id, userId } = req.body;
  // Upload
  return new Promise(async (resolve, reject) => {
    try {
      let videos = [];
      const files = fs.readdirSync(DATA.video_path);
      const title = files.map((file) => file);
      const filePaths = files.map((file) => `${DATA.video_path}\\${file}`);
      for (const [index, filePath] of filePaths.entries()) {
        await handeleStep_03(
          DATA,
          driver,
          filePath,
          title[index],
          videos,
          req,
          res,
          next
        );
      }

      await driver.sleep(2000).then(async () => {
        updateCreativeYTB(id, "completed", videos, userId);
        resolve("success");
        await driver.quit();
      });
    } catch (error) {
      updateCreativeYTB(id, "canceled", userId);
      reject(error);
    }
  });
};
// handle upload video
const handeleStep_03 = async (
  DATA,
  driver,
  file_path,
  title_,
  videos,
  req,
  res,
  next
) => {
  const { id, userId } = req.body;
  const max_time = 40000;
  return new Promise(async (resolve, reject) => {
    try {
      // wait for button upload video showing
      const btn_upload_path = "//ytcp-icon-button[@id='upload-icon']";
      const condition = until.elementLocated({
        xpath: btn_upload_path,
      });
      await driver.wait(condition, max_time).then(async () => {
        await driver
          .findElement(By.xpath(btn_upload_path))
          .click()
          .then(async () => {
            const input_upload_path = "//input[@name='Filedata']";
            await driver
              .findElement(By.xpath(input_upload_path))
              .sendKeys(file_path);
            const input_title_path = "(//div[@id='textbox'])[1]";
            const condition_02 = until.elementLocated({
              xpath: input_title_path,
            });
            await driver.wait(condition_02, max_time).then(async () => {
              /// handle title input
              const title = await driver.findElement(
                By.xpath(input_title_path)
              );
              await clearInput(title);
              await title.sendKeys(title_);

              /// handle desc input
              // const desc_input_path = "(//div[@id='textbox'])[2]";
              // const desc = await driver.findElement(By.xpath(desc_input_path));
              // await clearInput(desc);
              // await desc.sendKeys(DATA.desc[index]);
              // handle choose playlist
              const playlist_path =
                "(//div[@class='right-container style-scope ytcp-dropdown-trigger'])[1]";
              const playlist = await driver.findElement(
                By.xpath(playlist_path)
              );
              await playlist.click().then(async () => {
                const find_playlist_name =
                  "//span[contains(text(),'" + DATA.playlist_name + "')]";
                const condition_03 = until.elementLocated({
                  xpath: find_playlist_name,
                });
                await driver.wait(condition_03, max_time).then(async () => {
                  const playlist_checked = await driver.findElement(
                    By.xpath(find_playlist_name)
                  );
                  await driver.executeScript(
                    "arguments[0].click()",
                    playlist_checked
                  );
                  // close playlist
                  const btn_done_path = "//div[normalize-space()='Done']";
                  await driver.findElement(By.xpath(btn_done_path)).click();
                });
              });

              /////////////////////////////
              // handle choose options - for children
              const options_path = "(//div[@id='radioLabel'])[2]";
              await driver.findElement(By.xpath(options_path)).click();
              // handle next button
              const btn_next_path = "//ytcp-button[@id='next-button']";

              for (let i = 0; i < 3; i++) {
                await driver.sleep(2000).then(async () => {
                  await driver.findElement(By.xpath(btn_next_path)).click();
                });
              }

              ////////////////////////// HANDLE SAVE URL VIDEO /////////////////////////////
              const url_className =
                ".style-scope.ytcp-video-info[target='_blank']";
              await driver
                .wait(until.elementLocated(By.css(url_className)), max_time)
                .then(async () => {
                  const url = await driver
                    .findElement(By.css(url_className))
                    .getAttribute("href");
                  videos.push({
                    file_name: title_,
                    url: url,
                  });
                });

              const save_or_pb_unlisted_path =
                "//tp-yt-paper-radio-button[@name='UNLISTED']//div[@id='radioLabel']";
              const condition_04 = until.elementLocated({
                xpath: save_or_pb_unlisted_path,
              });
              await driver.wait(condition_04, max_time).then(async () => {
                await driver
                  .findElement(By.xpath(save_or_pb_unlisted_path))
                  .click();

                const btn_save_path =
                  "//div[@class='label style-scope ytcp-button'][normalize-space()='Save']";
                await driver.findElement(By.xpath(btn_save_path)).click();
                const btn_close_process_path =
                  "//ytcp-button[@id='close-button']//div[@class='label style-scope ytcp-button'][normalize-space()='Close']";
                const condition_05 = until.elementLocated({
                  xpath: btn_close_process_path,
                });
                await driver.wait(condition_05, max_time).then(async () => {
                  await driver
                    .findElement(By.xpath(btn_close_process_path))
                    .click()
                    .then(async () => resolve("success"))
                    // .then(async () => {
                    //   updateCreativeYTB(id, "completed", userId);
                    //   resolve("success");
                    //   await driver.quit();
                    // })
                    .catch(reject);
                });
              });
            });
          });
      });
    } catch (error) {
      updateCreativeYTB(id, "canceled", userId);
      console.log(error);
      reject(error);
    }
  });
};

const handleFetchData = async (req, res, next) => {
  const { id } = req.body;
  try {
    const response = await axios.get(
      backend_campaign_url + url.YOUTUBE + "/" + id
    );
    if (response.status === 200) {
      const origin_data = response.data.data;
      // console.log("==========DATA===========", origin_data);
      req.data = origin_data;
      if (origin_data.status === "pending" || origin_data.status === "canceled")
        await run_Now(req, res, next);
    } else throw new ApiError(400, "BAD REQUEST");
  } catch (error) {
    throw new ApiError(400, "BAD REQUEST");
  }
};
// run_Now();

module.exports = {
  handleFetchData,
};
