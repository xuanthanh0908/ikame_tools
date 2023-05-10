const { Builder, Browser, By, Key, until } = require("selenium-webdriver");
const axios = require("axios");
const firefox = require("selenium-webdriver/firefox");
const webdriver = require("selenium-webdriver");
const ApiError = require("../utils/apiError");
const catchAsync = require("../utils/catchAsync");
const { readFile } = require("../utils/readfile");
const { emitEvent } = require("../utils/socket");
const fs = require("fs");
// const backend_campaign_url = "https://api.ikamegroup.com/api/v1";
// const backend_campaign_url = 'http://localhost:9000/api/v1'
const url = {
  ADSGROUP: "/ads-asset",
};
const DATA = {
  channel_name: "nunmoon",
  playlist_name: "Test 03",
  videos: ["10 06 DiCSM T React03 916"],
  choose_date: "10-05-2023",
  range_max_date: "24h",
};
const updateCreativeURLCampaign = async (
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
const runTest = () => {
  // const { id, userId } = req.body;
  // const DATA = req.data;
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
                                  handleStep2(driver)
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
        // updateCreativeURLCampaign(id, "canceled", userId);
      });
  });
};
/// handle select playlist
const handleStep2 = async (driver) => {
  const max_time = 30000;
  return new Promise(async (resolve, reject) => {
    try {
      const content_tab_path = "";
      const filterIcon_path = "//tp-yt-iron-icon[@id='filter-icon']";
      const byTilte_path =
        "(//yt-formatted-string[normalize-space()='Title'])[1]";
      // wait for filter icon load
      await driver
        .wait(until.elementLocated(By.xpath(filterIcon_path)), max_time)
        .then(async () => {
          /// wait for dropdown load
          await driver
            .wait(until.elementLocated(By.xpath(byTilte_path)), max_time)
            .then(async () => {
              // click filter by title
              await driver.findElement(By.xpath(byTilte_path)).click();
              const input_path =
                "//input[@class='style-scope tp-yt-paper-input']";
              await driver
                .wait(until.elementLocated(By.xpath(input_path)), max_time)
                .then(async () => {
                  const input_value = await driver.findElement(
                    By.xpath(input_path)
                  );
                  input_value.sendKeys(DATA.videos[0]);
                  await driver.sleep(1000).then(async () => {
                    const apply_path =
                      "//div[@class='label style-scope ytcp-button'][normalize-space()='Apply']";
                    await driver.findElement(By.xpath(apply_path)).click();
                  });
                });
            });
        });
    } catch (error) {
      reject(error);
      console.log("RUN TEST FAILED", error);
      // updateCreativeURLCampaign(id, "canceled", userId);
    }
  });
};

// handle run campaign gg ads
const handFetchCreativeURL = catchAsync(async (req, res, next) => {
  const { id } = req.body;
  try {
    const response = await axios.get(
      backend_campaign_url + url.ADSGROUP + "/" + id
    );
    if (response.status === 200) {
      const origin_data = response.data.data;
      // console.log('==========DATA===========', origin_data)
      req.data = origin_data;
      if (origin_data.status === "pending" || origin_data.status === "canceled")
        await runTest(req, res, next);
    } else throw new ApiError(400, "BAD REQUEST");
  } catch (error) {
    throw new ApiError(400, "BAD REQUEST");
  }
});
// handle run multiple campaign ads group
const handMultiFetchCreativeURL = catchAsync(async (req, res, next) => {
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
runTest();
module.exports = {
  runTest,
  handFetchCreativeURL,
  handMultiFetchCreativeURL,
  updateCreativeURLCampaign,
};
