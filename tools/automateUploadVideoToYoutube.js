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
/**
 * set timeout for axios to 10s
 */
axios.default.timeout = 10000;
/**
 *
 */
const backend_campaign_url = "https://bs.ikamegroup.com/api/v1";
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

// handle check internet connection status
const networkOrFail = (callFunc, callTime) => {
  let callableTimes = callTime < 2000 ? 2000 : callTime;
  let toursBegin = 3;
  let tours = toursBegin;
  let intervalId;
  let request = function () {
    intervalId = setInterval(
      function () {
        if (tours > 0) {
          if (checkInternetConnection()) {
            callFunc();
            tours = 0;
            return false;
          }
          tours--;
          console.log(
            "i tryied againt to resend for another time and it remain just " +
              tours +
              " to retry"
          );
        } else {
          clearRequest();
          tours = toursBegin;
        }
      },
      callableTimes > 5000 ? 5000 : callableTimes
    );
  };
  let clearRequest = function () {
    clearInterval(intervalId);
    intervalId = null;
  };
  if (checkInternetConnection()) callFunc();
  else request();
};

const checkBrowserIsOpened = async () => {
  return drivers.length > 0;
};
const checkInternetConnection = async () => {
  try {
    // Create a new instance of the WebDriver
    // Set a timeout for the fetch operation
    const timeout = 5000;
    // Define a URL to check internet connection
    const url = "https://www.google.com";

    // Fetch the URL and check the response status
    const response = await axios.get(url, { timeout });
    const status = response.status;

    if (status === 200) {
      console.log("Internet connection is available");
    } else {
      console.log("Internet connection is not available");
      return false;
    }

    // Quit the WebDriver session
  } catch (error) {
    console.log("Internet connection is not available:", error.message);
  }
  return true;
};
// handle update status
const creativeHistory = async (data, driver, file_path) => {
  const makeRequest = async () => {
    try {
      const res = await axios.post(
        backend_campaign_url + url.HISTORY + "/",
        data
      );
      if (res.status === 201) {
        fs.unlink(file_path, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          } else {
            console.log("File deleted successfully");
          }
        });
      }
    } catch (error) {
      drivers.splice(drivers.indexOf(driver), 1);
      const twoMinus = 2 * 1000 * 60;
      await driver.sleep(twoMinus).then(async () => {
        await driver.quit();
      });
    }
  };
  networkOrFail(makeRequest, 5000);
};
// handle update status
const updateCreative = async (id, data) => {
  const makeRequest = async () => {
    try {
      await axios.patch(backend_campaign_url + url.YOUTUBE + "/" + id, data);
    } catch (error) {
      console.log("===========API ERROR=================");
    }
  };
  networkOrFail(makeRequest, 5000);
};
// handle update status
const updateCreativeYTB = async (
  id,
  status,
  userId,
  message = "Run test failed"
) => {
  return new Promise(async (resolve, reject) => {
    axios
      .patch(backend_campaign_url + url.YOUTUBE + "/" + id, {
        status: status,
      })
      .then(() => resolve("OK"))
      .catch(reject);
  });
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
      updateCreativeYTB(id, "running", userId)
        .then(async () => {
          await driver
            .findElement(By.xpath(chanel_path))
            .click()
            .then(async () => {
              const switch_acc_path = "(//tp-yt-paper-item[@role='link'])[3]";
              const findEl = await driver.findElement(
                By.xpath(switch_acc_path)
              );
              await driver
                .executeScript("arguments[0].click();", findEl)
                .then(async () => {
                  await driver.sleep(500).then(async () => {
                    // get all channel titl
                    const all_acc_id = "channel-title";
                    await driver
                      .findElements(By.id(all_acc_id))
                      .then(async (items) => {
                        for (const item of items) {
                          const text = await item.getText();
                          if (text === DATA.channel_name) {
                            await driver.executeScript(
                              "arguments[0].scrollIntoView(true)",
                              item
                            );

                            await item.click().then(async () => {
                              handeleStep_02(DATA, driver, req, res, next)
                                .then(() => resolve("success"))
                                .catch(async (error) => {
                                  // await driver.quit();
                                  reject(error);
                                });
                            });
                          }
                        }
                      });
                  });
                });
            });
        })
        .catch(reject);
    } catch (error) {
      await updateCreativeYTB(id, "actived", userId);
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
            drivers.splice(drivers.indexOf(driver), 1);
            reject(error);
          });
      }
    } catch (error) {
      drivers.splice(drivers.indexOf(driver), 1);
      await updateCreativeYTB(id, "actived", userId);
      reject(error);
    } finally {
      const twoMinus = 2.5 * 60 * 1000;
      await driver.sleep(twoMinus).then(async () => {
        await driver.quit();
        drivers.splice(drivers.indexOf(driver), 1);
      });
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
      const btn_upload_id = "upload-icon";
      const condition = until.elementLocated({
        id: btn_upload_id,
      });
      await driver.wait(condition, max_time).then(async () => {
        const findElBtnUpLoad = await driver.findElement(By.id(btn_upload_id));
        await driver
          .executeScript("arguments[0].click();", findElBtnUpLoad)
          .then(async () => {
            const input_upload_css = "input[name=Filedata]";
            await driver
              .wait(until.elementLocated({ css: input_upload_css }), max_time)
              .then(async () => {
                await driver
                  .findElement(By.css(input_upload_css))
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
                    /**
                     *
                     *
                     *
                     *
                     *
                     */
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
                        const btn_save_css =
                          "#done-button[aria-disabled=false]";
                        const condition_03 = until.elementsLocated({
                          css: btn_save_css,
                        });
                        await driver
                          .wait(condition_03, max_time)
                          .then(async () => {
                            await driver
                              .findElement(By.xpath(save_or_pb_unlisted_path))
                              .click();
                            const btn_save = await driver.findElement(
                              By.css(btn_save_css)
                            );
                            await driver
                              .wait(until.elementIsEnabled(btn_save), max_time)
                              .then(async () => {
                                await driver.sleep(2500).then(async () => {
                                  // ////////////////////////// HANDLE SAVE URL VIDEO /////////////////////////////
                                  const btn_copy_css = `ytcp-icon-button[icon="icons:content-copy"]`;
                                  await driver
                                    .wait(
                                      until.elementLocated(
                                        By.css(btn_copy_css)
                                      ),
                                      max_time
                                    )
                                    .then(async () => {
                                      const url_className =
                                        ".style-scope.ytcp-video-info[target='_blank']";
                                      await driver
                                        .wait(
                                          until.elementLocated(
                                            By.css(url_className)
                                          ),
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
                                                  await creativeHistory(
                                                    data,
                                                    driver,
                                                    file_path
                                                  );

                                                  await driver
                                                    .wait(
                                                      until.elementLocated({
                                                        xpath:
                                                          btn_close_process_path,
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
                                                          if (
                                                            index ===
                                                            count - 1
                                                          ) {
                                                            const checked =
                                                              await updateCreativeYTB(
                                                                id,
                                                                "completed",
                                                                userId
                                                              );
                                                            checked
                                                              ? resolve(
                                                                  "success"
                                                                )
                                                              : reject(
                                                                  "Run error"
                                                                );
                                                          } else
                                                            resolve("success");
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
              })
              .catch(reject);
          });
      });
    } catch (error) {
      // await driver.quit();
      await updateCreativeYTB(id, "actived", userId);
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
      backend_campaign_url + url.YOUTUBE + "?status=actived&limit=1&type=Check"
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
const scheduleRun = async () => {
  // console.log("CHECKED  CRON JOB RUN");
  crontab.scheduleJob("*/40 * * * * *", async function () {
    console.log("====== CRON JOB RUN ======");
    const checkOpened = await checkBrowserIsOpened();
    if (!checkOpened) {
      handMultiFetchYTB();
    } else {
      console.log("BROWSER OPENED");
    }
  });
};
module.exports = {
  handMultiFetchYTB,
  scheduleRun,
};
