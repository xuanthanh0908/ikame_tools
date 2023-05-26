const { By, Key, until } = require("selenium-webdriver");
const axios = require("axios");
const firefox = require("selenium-webdriver/firefox");
const webdriver = require("selenium-webdriver");
const ApiError = require("../utils/apiError");
const { readFile } = require("../utils/readfile");
const { emitEvent } = require("../utils/socket");
const crontab = require("node-crontab");
const fs = require("fs");
const Queue = require("../utils/queue");
const backend_campaign_url = "https://api.ikamegroup.com/api/v1";
// const backend_campaign_url = "http://localhost:9000/api/v1";

const url = {
  YOUTUBE: "/youtube",
  HISTORY: "/history",
};
const q = new Queue();
let x = 0,
  y = 0;
// Create an array to store the WebDriver instances for each browser
let drivers = [];

const diff = (a, b) => {
  return Math.abs(a - b);
};
const checkBrowserOpened = async () => {
  return drivers.length > 0;
};
// handle update status
const creativeHistory = async (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      await axios.post(backend_campaign_url + url.HISTORY + "/", data);
      resolve("OK");
    } catch (error) {
      reject(error);
      // if(error.response.status === 404) {
      //   console.log("THERE ARE NO RECODES TO");
      // }else {
      //   console.log("NETWORK ERROR");

      // }
    }
  });
};
// handle update status
const updateCreative = async (
  id,
  data,
  userId,
  message = "Run test failed"
) => {
  try {
    await axios.patch(backend_campaign_url + url.YOUTUBE + "/" + id, data);
  } catch (error) {
    console.log("===========API ERROR=================");
  }
};
// handle update status
const updateCreativeYTB = async (
  id,
  status,
  userId,
  message = "Run test failed"
) => {
  try {
    await axios.patch(backend_campaign_url + url.YOUTUBE + "/" + id, {
      status: status,
    });
    emitEvent("message", {
      message: "run test success",
      type: "success",
      userId,
    });
  } catch (error) {
    // console.log("===========API ERROR=================", error);
    emitEvent("message", {
      message,
      type: "run test failed",
      userId,
    });
  }
};

/// clear input
const clearInput = async (el) => {
  await el.sendKeys(Key.CONTROL, "a");
  await el.sendKeys(Key.DELETE);
};

// handle step 01 - initial browser - change channel - change account
const run_Now = (req, res, next, driver) => {
  const { id, userId } = req.body;
  const DATA = req.data;
  // console.log("=============DATA==============", DATA);
  return new Promise(async (resolve, reject) => {
    try {
      await driver.get("https://studio.youtube.com");
      /// change channel
      const chanel_path = "//button[@id='avatar-btn']";
      /// update status is running
      updateCreativeYTB(id, "running", userId);
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
                                .catch(async (error) => {
                                  // await driver.quit();
                                  reject(error);
                                });
                            });
                          }
                        });
                    }
                  });
              });
            });
        });
    } catch (error) {
      updateCreativeYTB(id, "canceled", userId);
      console.log("RUN TEST FAILED", error);
    }
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
      if (files.length === 0) {
        await driver.quit();
        updateCreativeYTB(id, "canceled", userId, "No video in folder");
        return;
      }
      const title = files.map((file) => file);
      const filePaths = files.map((file) => `${DATA.video_path}\\${file}`);
      for (const [index, filePath] of filePaths.entries()) {
        await handeleStep_03(
          DATA,
          driver,
          filePath,
          title[index],
          videos,
          index,
          filePaths.length,
          req,
          res,
          next
        )
          .then(async () => {
            resolve("success");
            const data = {
              _id: id,
              current_progress: index + 1,
              total_progress: filePaths.length,
              created_by: userId,
            };
            emitEvent("progress-ytb", data);
            await updateCreative(id, data, userId);
          })
          .catch(async (error) => {
            // await driver.quit();
            reject(error);
          });
      }
    } catch (error) {
      updateCreativeYTB(id, "canceled", userId);
      reject(error);
    } finally {
      await driver.quit();
      drivers.splice(drivers.indexOf(driver), 1);
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
  index,
  count,
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
            await driver
              .wait(condition_02, max_time)
              .then(async () => {
                /// handle title input
                const title = await driver.findElement(
                  By.xpath(input_title_path)
                );
                await clearInput(title);
                await title.sendKeys(title_);

                /////////////////////////////
                // handle choose options - for children
                const options_path = "(//div[@id='radioLabel'])[2]";
                await driver.findElement(By.xpath(options_path)).click();
                // handle next button
                const btn_next_path = "(//button[@id='step-badge-3'])[1]";
                await driver.findElement(By.xpath(btn_next_path)).click();

                ///// handle last step upload video
                const save_or_pb_unlisted_path =
                  "//tp-yt-paper-radio-button[@name='UNLISTED']//div[@id='radioLabel']";
                await driver
                  .wait(
                    until.elementsLocated({
                      xpath: save_or_pb_unlisted_path,
                    }),
                    max_time
                  )
                  .then(async () => {
                    const btn_save_css = "#done-button[aria-disabled=false]";
                    const condition_03 = until.elementsLocated({
                      css: btn_save_css,
                    });
                    await driver.wait(condition_03, max_time).then(async () => {
                      await driver
                        .findElement(By.xpath(save_or_pb_unlisted_path))
                        .click();
                      const btn_save = await driver.findElement(
                        By.css(btn_save_css)
                      );
                      await driver
                        .wait(until.elementIsEnabled(btn_save), max_time)
                        .then(async () => {
                          await driver.sleep(1000).then(async () => {
                            // ////////////////////////// HANDLE SAVE URL VIDEO /////////////////////////////
                            const btn_copy_css = `ytcp-icon-button[icon="icons:content-copy"]`;
                            await driver
                              .wait(
                                until.elementLocated(By.css(btn_copy_css)),
                                max_time
                              )
                              .then(async () => {
                                const url_className =
                                  ".style-scope.ytcp-video-info[target='_blank']";
                                await driver
                                  .wait(
                                    until.elementLocated(By.css(url_className)),
                                    max_time
                                  )
                                  .then(async () => {
                                    await driver
                                      .findElement(By.css(url_className))
                                      .getAttribute("href")
                                      .then(async (url) => {
                                        await btn_save
                                          .click()
                                          .then(async () => {
                                            const btn_close_process_path =
                                              "//ytcp-button[@id='close-button']";
                                            const data = {
                                              product_id: DATA.product_id,
                                              channel_id: DATA.channel_id,
                                              created_by: userId,
                                              youtube_url: {
                                                file_name: title_,
                                                url: url,
                                              },
                                            };
                                            creativeHistory(data)
                                              .then(async () => {
                                                fs.unlink(file_path, (err) => {
                                                  if (err) {
                                                    console.error(
                                                      "Error deleting file:",
                                                      err
                                                    );
                                                  } else {
                                                    console.log(
                                                      "File deleted successfully"
                                                    );
                                                  }
                                                });
                                              })
                                              .catch(reject);
                                            await driver
                                              .wait(
                                                until.elementLocated({
                                                  xpath: btn_close_process_path,
                                                }),
                                                max_time
                                              )
                                              .then(async () => {
                                                await driver
                                                  .findElement(
                                                    By.xpath(
                                                      btn_close_process_path
                                                    )
                                                  )
                                                  .click()
                                                  .then(async () => {
                                                    resolve("success");
                                                    if (index === count - 1) {
                                                      /// remove a file after upload
                                                      updateCreativeYTB(
                                                        id,
                                                        "completed",
                                                        userId
                                                      );
                                                      // await driver.quit();
                                                    }
                                                  })
                                                  .catch(reject);
                                              })
                                              .catch(reject);
                                          });
                                      });
                                  })
                                  .catch(reject);
                              })
                              .catch(reject);
                          });
                        })
                        .catch(reject);
                    });
                  })
                  .catch(reject);
              })
              .catch(reject);
          });
      });
    } catch (error) {
      // await driver.quit();
      updateCreativeYTB(id, "canceled", userId);
      console.log(error);
      reject(error);
    }
  });
};
///////////////////////////
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

        // const windowHandles = await driver.getAllWindowHandles();
        // const numberOfOpenBrowsers = windowHandles.length;

        // if (numberOfOpenBrowsers > 0) {
        //   return;
        // }
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

        // Update the position for the next browser window
        x += browserWidth;
        if (diff(x, windowWidth) <= 20) {
          x = 0;
          y += browserHeight;
        }

        resolve("success");
        const req = {};
        req.data = data[index];
        req.body = {
          id: data[index]._id,
          userId: data[index].created_by,
        };
        // console.log("DATA", data[index]);
        const res = null;
        const next = null;
        run_Now(req, res, next, driver);
      } catch (error) {
        reject(error);
      }
    });
  });
};
// Open multiple browser windows
const openMultipleBrowsers = async () => {
  // console.log("drivers", drivers);
  if (q.q.length > 0) {
    const data = q.receive();
    const numBrowsers = data.length;
    for (let i = 0; i < numBrowsers; i++) {
      await openBrowserWindow(data, i);
    }
  }
};
///////////////////////////
// handle run multiple creative youtube
const handMultiFetchYTB = async () => {
  try {
    const response = await axios.get(
      backend_campaign_url + url.YOUTUBE + "?status=actived&limit=2&type=Game"
    );
    if (response.status === 200) {
      const origin_data = response.data.data;
      q.send(origin_data);
      /// reset x, y
      x = 0;
      y = 0;
      openMultipleBrowsers()
        .then(() => {
          // Do something after opening the browsers
          console.log("Browsers opened successfully");
        })
        .catch((error) => {
          console.error("Error:", error);
        });
      // console.log("==========DATA===========", origin_data);
    } else throw new ApiError(400, "BAD REQUEST");
  } catch (error) {
    // console.log("======ERROR======", error);
    throw new ApiError(400, "BAD REQUEST");
  }
};
// run_Now();
const scheduleRun = async () => {
  // console.log("CHECKED  CRON JOB RUN");
  crontab.scheduleJob("*/15 * * * * *", async function () {
    console.log("====== CRON JOB RUN ======");
    const checkOpened = await checkBrowserOpened();
    if (!checkOpened) {
      handMultiFetchYTB();
    } else {
      console.log("BROWSER OPENED");
    }
  });
  // handMultiFetchYTB();
};
module.exports = {
  handMultiFetchYTB,
  scheduleRun,
};
