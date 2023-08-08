const { By, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");
const webdriver = require("selenium-webdriver");
const ApiError = require("../utils/apiError");
const catchAsync = require("../utils/catchAsync");
const { readFile } = require("../utils/readfile");
const { emitEvent } = require("../utils/socket");

/**
 *
 *
 *
 *
 *
 *
 *
 *
 */
let totalProgress = 0;
let currentProgress = 0;
const totalStepsCompletedEachBrowser = 4;
let x = 0,
  y = 0;
// Create an array to store the WebDriver instances for each browser
const drivers = [];

const diff = (a, b) => {
  return Math.abs(a - b);
};
// Create a function to open a new browser window and set its size
const openBrowserWindow = async (data, index) => {
  const numBrowsers = data?.listMintegralDeletedCreative.length;
  return new Promise(async (resolve, reject) => {
    readFile().then(async (path) => {
      try {
        // init maxtime
        let options = new firefox.Options();
        options.add_argument("--headless");
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
        // console.log("checking data \n\n", data);
        const req = data;
        const res = null;
        const next = null;

        runTest(req, res, next, driver, index, numBrowsers);
      } catch (error) {
        reject(error);
      }
    });
  });
};
// Polling function to check if the browser window is closed
async function checkBrowserClosed(driver) {
  try {
    // Attempt to find an element on the page
    await driver.findElement(By.tagName("html"));
  } catch (error) {
    // If the element cannot be found, it means the browser window is closed
    return true;
  }

  // If the element is found, the browser window is still open
  return false;
}
// Continuously poll to check if the browser window is closed
async function pollBrowserClosed(drivers) {
  for (const driver of drivers) {
    const isClosed = await checkBrowserClosed(driver);
    if (isClosed) {
      console.log("Firefox browser closed");
      // Additional cleanup or actions after browser close
      drivers.splice(drivers.indexOf(driver), 1);
      break;
    }
    await driver.sleep(1000); // Wait for 1 second before polling again
  }
}
const checkBrowserIsOpened = async () => {
  return drivers.length > 0;
};
// Open multiple browser windows
const openMultipleBrowsers = async (data) => {
  // console.log(data);
  const numBrowsers = data?.listMintegralDeletedCreative?.length;
  totalProgress = numBrowsers * totalStepsCompletedEachBrowser;
  for (let i = 0; i < numBrowsers; i++) {
    await openBrowserWindow(data, i, numBrowsers);
  }
};
// handle run data
const handleFetchMintegralRemoveCreative = catchAsync(
  async (req, res, next) => {
    const { data } = req.body;
    let listMintegralDelectedPending = [];
    try {
      req.data = data;
      /// reset x, y
      x = 0;
      y = 0;
      if (listMintegralDelectedPending.length > 0) {
        // Example usage
        openMultipleBrowsers(listMintegralDelectedPending)
          .then(() => {
            // Do something after opening the browsers
            console.log("Browsers opened successfully");
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      }
    } catch (error) {
      throw new ApiError(400, "BAD REQUEST");
    }
  }
);
// handle run multiple data
const handMultiFetchMintegralRemovedCreative = catchAsync(
  async (req, res, next) => {
    await pollBrowserClosed(drivers);
    const checkOpened = await checkBrowserIsOpened();
    if (checkOpened === false) {
      const { listMintegralDeletedCreative } = req.body;
      try {
        /// reset x, y
        x = 0;
        y = 0;
        if (listMintegralDeletedCreative.length > 0) {
          // Example usage
          openMultipleBrowsers(req.body)
            .then(() => {
              // Do something after opening the browsers
              console.log("====== RUN SUCCESS ======");
            })
            .catch((error) => {
              console.error("Error:", error);
            });
        }
      } catch (error) {
        console.log("======ERROR======", error);
        throw new ApiError(400, "BAD REQUEST");
      }
    } else {
      console.log("\n\n\nBROWSER IS OPENING ................");
    }
  }
);
const handlePushNotifications = (
  type,
  userId,
  data,
  success = false,
  progress
) => {
  switch (type) {
    case "update-progress":
      emitEvent("integral-deleted-creative:update-progress-on", {
        created_by: userId,
        progress,
      });
      break;
    case "notify-task":
      emitEvent("integral-deleted-creative:notify-task-on", {
        created_by: userId,
        success,
        data,
      });
      break;
    default:
      break;
  }
};

/** Reset variables */
const handleResetVariables = () => {
  totalProgress = 0;
  currentProgress = 0;
};
/**
 * MAIN
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @param {*} driver
 * @returns
 */
const runTest = (req, res, next, driver, index, numBrowsers) => {
  const maxTime = 30000;
  const { userId, listMintegralDeletedCreative } = req;
  const { creativeName, offerName } = listMintegralDeletedCreative[index];
  return new Promise(async (resolve, reject) => {
    try {
      // open the browser with the specified creative name
      await driver.get(
        "https://adv.mintegral.com/creatives?creative_name=" + creativeName
      );
      currentProgress += 1;
      // send notify update progress
      handlePushNotifications(
        "update-progress",
        userId,
        null,
        null,
        (currentProgress / totalProgress) * 100
      );
      // define path delete button
      const btnDeletePath =
        "//button[@class='el-button text--red el-button--text']";
      await driver
        .wait(
          until.elementLocated({
            xpath: btnDeletePath,
          }),
          maxTime
        )
        .then(async () => {
          await driver.findElement(By.xpath(btnDeletePath)).click();
          currentProgress += 1;
          // send notify update progress
          handlePushNotifications(
            "update-progress",
            userId,
            null,
            null,
            (currentProgress / totalProgress) * 100
          );
          // define offer name path
          const offerNamePath = "//textarea[@class='el-textarea__inner']";
          await driver
            .wait(
              until.elementLocated({
                xpath: offerNamePath,
              }),
              maxTime
            )
            .then(async () => {
              /** change offer name */
              await driver
                .findElement(By.xpath(offerNamePath))
                .sendKeys(offerName);
              currentProgress += 1;
              // send notify update progress
              handlePushNotifications(
                "update-progress",
                userId,
                null,
                null,
                (currentProgress / totalProgress) * 100
              );
              // define delete button

              const btnDeleteCreativePath =
                "//div[@aria-label='Delete Creative']//button[2]";
              await driver
                .wait(
                  until.elementLocated({
                    xpath: btnDeleteCreativePath,
                  })
                )
                .then(async () => {
                  await driver
                    .findElement(By.xpath(btnDeleteCreativePath))
                    .click();
                  currentProgress += 1;
                  // send notify update progress
                  handlePushNotifications(
                    "update-progress",
                    userId,
                    null,
                    null,
                    (currentProgress / totalProgress) * 100
                  );
                  resolve("Run Sucess");
                  /****************** DONE ***************************/
                })
                .catch(reject);
            })
            .catch(reject);
        })
        .catch(reject);
    } catch (error) {
      handleResetVariables();
      reject(error);
    } finally {
      await driver.sleep(5000).then(async () => {
        await driver.quit();
      });
    }
  }).catch((err) => {
    console.log("RUN TEST FAILED\n\n", err);
  });
};
// const runTest = (req, res, next, driver, index, numBrowsers) => {
//   const maxTime = 30000;
//   const { userId, listMintegralDeletedCreative } = req;
//   const { creativeName, offerName } = listMintegralDeletedCreative[index];
//   return new Promise(async (resolve, reject) => {
//     try {
//       await driver.get("https://www.google.com");
//       const inputSearchCss = "textarea[name=q]";
//       await driver
//         .wait(
//           until.elementLocated({
//             css: inputSearchCss,
//           }),
//           maxTime
//         )
//         .then(async () => {
//           await driver
//             .findElement(By.css(inputSearchCss))
//             .sendKeys(creativeName);
//           currentProgress += 1;
//           // send notify update progress
//           handlePushNotifications(
//             "update-progress",
//             userId,
//             null,
//             null,
//             (currentProgress / totalProgress) * 100
//           );

//           const btnSearchPath =
//             "//div[@class='FPdoLc lJ9FBc']//input[@name='btnK']";
//           await driver.findElement(By.xpath(btnSearchPath)).click();
//           currentProgress += 1;
//           // send notify update progress
//           handlePushNotifications(
//             "update-progress",
//             userId,
//             null,
//             null,
//             (currentProgress / totalProgress) * 100
//           );
//           // send notification status task
//           handlePushNotifications(
//             "notify-task",
//             userId,
//             { creativeName, offerName },
//             true,
//             null
//           );
//           if (index === numBrowsers - 1) {
//             handleResetVariables();
//           }
//           resolve("Run success");
//         })
//         .catch(reject);
//     } catch (error) {
//       // send notification status task
//       handlePushNotifications(
//         "notify-task",
//         userId,
//         { creativeName, offerName },
//         false,
//         null
//       );
//       handleResetVariables();
//       reject(error);
//     } finally {
//       await driver.sleep(5000).then(async () => {
//         await driver.quit();
//       });
//     }
//   }).catch((err) => {
//     console.log("RUN TEST FAILED\n\n", err);
//   });

module.exports = {
  runTest,
  handleFetchMintegralRemoveCreative,
  handMultiFetchMintegralRemovedCreative,
};
