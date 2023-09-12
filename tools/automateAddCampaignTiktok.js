const { Builder, Browser, By, Key, until } = require("selenium-webdriver");
const axios = require("axios");
const events = require("events");
const firefox = require("selenium-webdriver/firefox");
const webdriver = require("selenium-webdriver");
const ApiError = require("../utils/apiError");
const catchAsync = require("../utils/catchAsync");
const { emitEvent } = require("../utils/socket");
const readline = require("readline");
const fs = require("fs");
const { Actions } = require("selenium-webdriver/lib/input");
const { readFile } = require("../utils/readfile");
const backend_campaign_url = "https://bs.ikamegroup.com/api/v1";
// const backend_campaign_url = "http://localhost:9001/api/v1";
const url = {
  CAMPAIGN: "/campaign",
  CAMPAIGN_UPDATE: "/campaign/update-by-one",
};

// clear input
const clearInput = async (driver, xpath) => {
  await driver.findElement(By.xpath(xpath)).sendKeys(Key.CONTROL, "a");
  await driver.findElement(By.xpath(xpath)).sendKeys(Key.DELETE);
};
// wait for driver hover hidden parent element
const mouseHoverElement = (el, driver) => {
  driver.executeScript(
    "arguments[0].dispatchEvent(new MouseEvent('mouseover', {bubbles: true}));",
    el
  );
};
const updateStatusCampaign = async (
  id,
  status,
  userId,
  message = "Run test failed"
) => {
  try {
    await axios.patch(backend_campaign_url + url.CAMPAIGN_UPDATE + "/" + id, {
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
// handle choose input
const handleChooseLocation = async (
  driver,
  inputArr,
  inputSearchPath,
  inactivatePath,
  userId,
  id
) => {
  try {
    const maxTime = 30000;
    return new Promise(async (resolve, reject) => {
      for (const data of inputArr) {
        await driver.findElement(By.xpath(inputSearchPath)).sendKeys(data);
        // wait for loading data to be active
        const selectPath = "//span[contains(text(),'" + data + "')]";
        const condition_select = until.elementLocated({
          xpath: selectPath,
        });
        await driver.wait(condition_select, maxTime).then(async (e) => {
          const select = await driver.findElement(By.xpath(selectPath));
          await driver.executeScript("arguments[0].click();", select);
          // wait for clear input search
          clearInput(driver, inputSearchPath);
          driver.sleep(1000);
        });
      }

      await driver.findElement(By.xpath(inactivatePath)).click().then(resolve);
    });
  } catch (error) {
    reject(error);
    updateStatusCampaign(id, "canceled", userId);
  }
};
const handleChooseLanguage = async (driver, inputArr, inactivatePath) => {
  return new Promise(async (resolve, reject) => {
    try {
      const maxTime = 30000;
      for (const data of inputArr) {
        // wait for loading data to be active
        const selectPath =
          "//div[@class='vi-tree-node__content']//span[contains(text(),'" +
          data +
          "')]";
        const condition_select = until.elementLocated({
          xpath: selectPath,
        });
        await driver.wait(condition_select, maxTime).then(async (e) => {
          const select = await driver.findElement(By.xpath(selectPath));
          await driver.executeScript("arguments[0].click();", select);
          // wait for clear input search
          driver.sleep(1000);
        });
      }

      await driver.findElement(By.xpath(inactivatePath)).click().then(resolve);
    } catch (error) {
      reject(error);
      updateStatusCampaign(id, "canceled", userId);
    }
  });
};
const handleVideos = async (driver, inputArr, userId, id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const maxTime = 20000;
      const buttonImportPath =
        "//button[@class='vi-button vi-byted-button vi-button--default']//span[contains(text(),'From library')]";
      const inputSearchVideoPath =
        "//input[@placeholder='Search by name or ID']";
      const iconSearchVideoPath = "(//i[@class='vi-icon2-search'])[1]";
      const firstVideoPath =
        "(//div[@class='slip-content_loadingMask_idBtk'])[1]";

      const buttonImport = await driver.findElement(By.xpath(buttonImportPath));
      await driver.executeScript("arguments[0].click();", buttonImport);
      driver.sleep(1000);
      // wait for loading data to be active
      const condition_select = until.elementLocated({
        xpath: firstVideoPath,
      });
      await driver.wait(condition_select, maxTime).then(async (e) => {
        // scroll to button import
        for (const [index, data] of inputArr.entries()) {
          await driver
            .findElement(By.xpath(inputSearchVideoPath))
            .sendKeys(data);
          await driver
            .findElement(By.xpath(iconSearchVideoPath))
            .click()
            .then(async () => {
              // handle wait for loading video
              const condition_video = until.elementLocated({
                xpath: firstVideoPath,
              });
              await driver.wait(condition_video, maxTime).then(async (e) => {
                const element = await driver.findElement(
                  By.xpath(firstVideoPath)
                );
                await driver.executeScript("arguments[0].click();", element);
                clearInput(driver, inputSearchVideoPath);
                driver.sleep(3000);
              });
            });
        }
      });

      const confirmButtonPath =
        "//button[@data-testid='creative_detail_libraryConfirm']//span[contains(text(),'Confirm')]";
      await driver
        .findElement(By.xpath(confirmButtonPath))
        .click()
        .then(() => {
          resolve("success");
        });
    } catch (error) {
      reject(error);
      updateStatusCampaign(id, "canceled", userId);
    }
  });
};
const handleAddText = async (driver, inputArr, userId, id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const addButtonPath =
        "//button[@data-testid='creative_text_titleListAddItem']";
      for (const [index, data] of inputArr.entries()) {
        const textPath =
          "(//textarea[@placeholder='Enter text for your ad'])[" +
          (index + 1) +
          "]";
        const findAddButton = await driver.findElement(By.xpath(addButtonPath));
        // const findText = await driver.findElement(By.xpath(textPath));
        await driver.findElement(By.xpath(textPath)).sendKeys(data);
        await driver.sleep(1000);
        if (index !== inputArr.length - 1) {
          await driver.executeScript("arguments[0].click();", findAddButton);
        }
      }

      /// handle submit - upload ads

      const submitButtonPath = "//button[@data-testid='common_next_button']";
      const finshishBtn = await driver.findElement(By.xpath(submitButtonPath));
      await new Actions(driver)
        .doubleClick(finshishBtn)
        .perform()
        .then(async () => {
          console.log("RUN TEST SUCCESS");
          await updateStatusCampaign(
            id,
            "completed",
            userId,
            "Run test success"
          );
          await driver.sleep(15000).then(async () => {
            resolve("success");
            await driver.quit();
          });
        });
    } catch (error) {
      reject(error);
      // console.log("error: ", error);
      await updateStatusCampaign(id, "canceled", userId);
      await driver.quit();
    }
  });
};
// wait for targeting to be active
const handleWaitToTargeting = async (driver, data, userId, id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const xpathCheck = "//label[normalize-space()='Location']";
      const maxTime = 30000;
      const condition = until.elementsLocated({
        xpath: xpathCheck,
      });
      await driver.wait(condition, maxTime).then(async function () {
        // await driver.findElement(By.className("vi-icon2-edit")).click();
        // Find the element that causes the hidden element to appear
        const triggerElement = await driver.findElement(By.xpath(xpathCheck));
        // handle select app
        const selectAppPath = "//input[@placeholder='Select app']";
        const condition_select_app = until.elementLocated({
          xpath: selectAppPath,
        });
        await driver.wait(condition_select_app, maxTime).then(async (e) => {
          await driver.findElement(By.xpath(selectAppPath)).click();

          const app_name_paths = "//div[@class='item-text item-name']";
          const condition_ = until.elementLocated({
            xpath: app_name_paths,
          });
          await driver.wait(condition_, maxTime).then(async (e) => {
            const app = data.app_name;
            const select_app_p = "//div[normalize-space()='" + app + "']";
            await driver.findElement(By.xpath(select_app_p)).click();

            const blurPath =
              "//span[normalize-space()='Where would you like to show your ads?']";
            const blur = driver.findElement(By.xpath(blurPath));
            await driver.executeScript("arguments[0].click();", blur);
            // Move the mouse over the trigger element to make the hidden element visible
            driver
              .actions()
              .move({ origin: triggerElement })
              .perform()
              .then(async function () {
                mouseHoverElement(triggerElement, driver);
                const hiddenElementXpath =
                  "//button[@class='vi-button vi-byted-button vi-button--text index_spcLocationEditBtn_Y2bQH']//span[contains(text(),'Edit')]";
                await driver
                  .wait(
                    until.elementsLocated({
                      xpath: hiddenElementXpath,
                    }),
                    maxTime
                  )
                  .then(async function () {
                    const findHiddenElement = await driver.findElement(
                      By.xpath(hiddenElementXpath)
                    );
                    await driver.executeScript(
                      "arguments[0].click();",
                      findHiddenElement
                    );
                    const inputPath =
                      "//div[@class='vi-select-tree index_locationFormItem_dP0yb']//div//div[@class='vi-select-tree-inside-container']";
                    const findInputEl = await driver.findElement(
                      By.xpath(inputPath)
                    );
                    await driver
                      .executeScript(
                        "arguments[0].dispatchEvent(new MouseEvent('mouseover', {bubbles: true}));",
                        findInputEl
                      )
                      .then(async function () {
                        const x_close_path =
                          "//i[@class='right-icon vi-icon-circle-close']";
                        const condition_close = until.elementLocated({
                          xpath: x_close_path,
                        });
                        await driver
                          .wait(condition_close, maxTime)
                          .then(async (e) => {
                            const delete_all_location =
                              await driver.findElement(By.xpath(x_close_path));

                            await driver
                              .executeScript(
                                "arguments[0].click();",
                                delete_all_location
                              )
                              .then(async () => {
                                await driver.sleep(1000);
                                await driver.executeScript(
                                  "arguments[0].click();",
                                  findInputEl
                                );
                                // wait for input search
                                const inputSearchPath =
                                  "//input[@placeholder='Search']";
                                //  wait for input search to be active
                                const condition = until.elementLocated({
                                  xpath: inputSearchPath,
                                });
                                await driver
                                  .wait(condition, maxTime)
                                  .then(async function () {
                                    const inactivatePath =
                                      "//span[normalize-space()='Who should see your ads?']";
                                    await handleChooseLocation(
                                      driver,
                                      data.locations,
                                      inputSearchPath,
                                      inactivatePath,
                                      userId,
                                      id
                                    );

                                    // handle mouse hover language input
                                    const languageInputPath =
                                      "//label[normalize-space()='Languages']";
                                    const findLanguageInputEl =
                                      await driver.findElement(
                                        By.xpath(languageInputPath)
                                      );
                                    driver
                                      .actions()
                                      .move({ origin: findLanguageInputEl })
                                      .perform()
                                      .then(async function () {
                                        mouseHoverElement(
                                          findLanguageInputEl,
                                          driver
                                        );
                                        const hiddenElementXpath =
                                          "/html[1]/body[1]/div[3]/div[1]/div[1]/div[2]/div[1]/div[1]/div[2]/div[1]/div[1]/div[1]/form[1]/div[2]/div[1]/section[2]/div[2]/div[1]/div[1]/div[2]/div[1]/div[1]/button[1]/span[1]";
                                        await driver
                                          .wait(
                                            until.elementsLocated({
                                              xpath: hiddenElementXpath,
                                            }),
                                            maxTime
                                          )
                                          .then(async function () {
                                            await driver
                                              .findElement(
                                                By.xpath(hiddenElementXpath)
                                              )
                                              .click();
                                            const inputLanguagePath =
                                              "//div[@class='vi-select-tree']//div//div[@class='vi-select-tree-inside-container']";
                                            await driver
                                              .findElement(
                                                By.xpath(inputLanguagePath)
                                              )
                                              .click();
                                            await handleChooseLanguage(
                                              driver,
                                              ["English"],
                                              inactivatePath
                                            );
                                            // handle change budget input
                                            if (data.budget !== 50) {
                                              const budgetInputPath =
                                                "//input[@data-tea='create_adgroup_budget_num']";
                                              clearInput(
                                                driver,
                                                budgetInputPath
                                              );
                                              driver.sleep(1000);
                                              await driver
                                                .findElement(
                                                  By.xpath(budgetInputPath)
                                                )
                                                .sendKeys(data.budget);
                                            }
                                          });
                                        // handle select start date
                                        const startDatePath =
                                          "//input[@placeholder='Start date']";
                                        const selectDatePath =
                                          "(//input[@placeholder='Select date'])[1]";
                                        const selectTimePath =
                                          "(//input[@placeholder='Select time'])[1]";
                                        // enable input start date
                                        await driver
                                          .findElement(By.xpath(startDatePath))
                                          .click();
                                        await driver.sleep(1000);
                                        // clear select date input
                                        clearInput(driver, selectDatePath);
                                        await driver
                                          .findElement(By.xpath(selectDatePath))
                                          .sendKeys(data.startDate.date);
                                        driver.sleep(1000);
                                        // clear select time input
                                        clearInput(driver, selectTimePath);
                                        await driver
                                          .findElement(By.xpath(selectTimePath))
                                          .sendKeys(data.startDate.time);
                                        // inactivate input end date
                                        const inactivateSelectPath =
                                          "//span[@class='budget-schedule-title']";
                                        const inaac = await driver.findElement(
                                          By.xpath(inactivateSelectPath)
                                        );
                                        await driver
                                          .executeScript(
                                            "arguments[0].click();",
                                            inaac
                                          )
                                          .then(async () => {});
                                        // handle select video
                                        handleVideos(
                                          driver,
                                          data.videos,
                                          userId,
                                          id
                                        ).then(async () => {
                                          // scroll to end page
                                          // find the <body> element

                                          const buttonElPath =
                                            "//div[@class='index_title_gRuIn']//span[contains(text(),'Tracking')]";
                                          const el = driver.findElement(
                                            By.xpath(buttonElPath)
                                          );
                                          // scroll to the bottom of the page
                                          driver
                                            .executeScript(
                                              "arguments[0].scrollIntoView(true)",
                                              el
                                            )
                                            .then(async function () {
                                              // handle add text
                                              handleAddText(
                                                driver,
                                                data.texts,
                                                userId,
                                                id
                                              )
                                                .then((e) => resolve("success"))
                                                .catch((e) => reject(e));
                                            });
                                          // })
                                          // });
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
      updateStatusCampaign(id, "canceled", userId);
    }
  });
};

// wait for switch status to be active
const waitSwitchStatus = async (driver, data, userId, id) => {
  return new Promise(async (resolve, reject) => {
    try {
      // await driver until.elementLocated find element success
      const xpath =
        "//div[@data-tea='create_campaign_spc_status']//div[@role='switch']";
      const condition = until.elementLocated({
        xpath: xpath,
      });
      const maxTime = 30000;
      driver.wait(condition, maxTime).then(async function () {
        await driver
          .findElement(
            By.xpath(
              "//div[@data-tea='create_campaign_spc_status']//div[@role='switch']"
            )
          )
          .click();
        clearInput(driver, "//input[@type='text']");
        await driver
          .findElement(By.xpath("//input[@type='text']"))
          .sendKeys(data.campaign_name);

        // handle click button continue
        await driver
          .findElement(By.xpath("//button[@data-testid='common_next_button']"))
          .click();
        await driver.sleep(5000).then(async function () {
          handleWaitToTargeting(driver, data, userId, id)
            .then((e) => resolve("success"))
            .catch((e) => reject(e));
        });
      });
    } catch (error) {
      reject(error);
      updateStatusCampaign(id, "canceled", userId);
    }
  });
};

const runTest = (req, res, next) => {
  const data = req.data;
  const { id } = data;
  const userId = req.body.userId;
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
          await driver.get(data.campaign_url);
          await driver.sleep(1000);
          let maxTime = 30000;
          var xpath = "//div[normalize-space()='App promotion']";
          var condition = until.elementLocated({
            xpath: xpath,
          });
          await driver.wait(condition, maxTime).then(async function () {
            await driver
              .findElement(By.xpath("//div[normalize-space()='App promotion']"))
              .click()
              .then(async () => {
                waitSwitchStatus(driver, data, userId, id)
                  .then((e) => resolve("success"))
                  .catch((e) => reject(e));
              });
          });
        } catch (error) {
          console.log("RUN TEST FAILED", error);
          updateStatusCampaign(id, "canceled", userId);
        } finally {
          const startOverPath =
            "//button[@data-tea-click='draft_confirmation_start_over']";
          const findButton = await driver
            .findElement(By.xpath(startOverPath))
            .isDisplayed();
          if (findButton) {
            await driver
              .findElement(By.xpath(startOverPath))
              .click()
              .then(async () => {
                runTest(req, res, next)
                  .then((e) => resolve("success"))
                  .catch((e) => reject(e));
                await driver.quit();
              });
          }
        }
      })
      .catch(async (err) => {
        console.log("RUN TEST FAILED", err);
        updateStatusCampaign(id, "canceled", userId);
      });
  });
};

const handleFetchApi = catchAsync(async (req, res, next) => {
  try {
    const origin_data = req.body.data;
    // console.log("origin_data", origin_data);
    let formattedDate = new Date(origin_data.start_date)
      .toISOString()
      .slice(0, 10);

    const campaign_data = {
      id: origin_data._id,
      campaign_url: origin_data.campaign_url,
      campaign_name: origin_data.campaign_name,
      app_name: origin_data.product,
      locations: origin_data.locations,
      budget: origin_data.budget,
      startDate: {
        date: formattedDate,
        time: "00:00",
      },
      videos: origin_data.ads_groups[0].videos,
      texts: origin_data.ads_groups[0].headline,
      // profile: origin_data.profile,
    };
    req.data = campaign_data;
    if (origin_data.status === "pending" || origin_data.status === "canceled")
      runTest(req, res, next);
  } catch (error) {
    console.log(error);
  }
});
const handleMultiFetchApi = catchAsync(async (req, res, next) => {
  const { all_campaign } = req.body;
  try {
    let index = 0;
    while (index < all_campaign.length) {
      const response = await axios.get(
        backend_campaign_url + url.CAMPAIGN + "/" + all_campaign[index]
      );
      if (response.status === 200) {
        const origin_data = response.data.data;
        // console.log("origin_data", origin_data);
        let formattedDate = new Date(origin_data.start_date)
          .toISOString()
          .slice(0, 10);

        const campaign_data = {
          campaign_url: origin_data.campaign_url,
          campaign_name: origin_data.campaign_name,
          app_name: origin_data.product,
          locations: origin_data.locations,
          // languages: origin_data.languages,
          budget: origin_data.budget,
          startDate: {
            date: formattedDate,
            time: "00:00",
          },
          videos: origin_data.ads_groups[0].videos,
          texts: origin_data.ads_groups[0].headline,
          // profile: origin_data.profile,
        };
        // console.log("==========DATA===========", campaign_data);
        req.data = campaign_data;
        req.body = {
          ...req.body,
          id: all_campaign[index],
        };
        if (
          origin_data.status === "pending" ||
          origin_data.status === "canceled"
        )
          await runTest(req, res, next);
      } else throw new ApiError(400, "BAD REQUEST");
      index++;
    }
  } catch (error) {
    throw new ApiError(400, "BAD REQUEST");
  }
});
module.exports = {
  handleFetchApi,
  updateStatusCampaign,
  handleMultiFetchApi,
  clearInput,
  mouseHoverElement,
};
