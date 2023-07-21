const { Builder, Browser, By, Key, until } = require("selenium-webdriver");
// const axios = require("axios");
const firefox = require("selenium-webdriver/firefox");
const webdriver = require("selenium-webdriver");
const ApiError = require("../utils/apiError");
const catchAsync = require("../utils/catchAsync");
const { readFile } = require("../utils/readfile");
const { emitEvent } = require("../utils/socket");

///
let data = [
  {
    id: 1,
    creativeName: "test 01",
  },
  {
    id: 2,
    creativeName: "test 02",
  },
  {
    id: 3,
    creativeName: "test 03",
  },
  {
    id: 4,
    creativeName: "test 04",
  },
  {
    id: 5,
    creativeName: "test 05",
  },
];
let totalProgress = 0;
let currentProgress = 0;
const totalStepsCompleted = 2;
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

        runTest(req, res, next, driver, index);
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
  totalProgress = numBrowsers * totalStepsCompleted;
  for (let i = 0; i < numBrowsers; i++) {
    await openBrowserWindow(data, i);
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
    const checkOpened = await checkBrowserIsOpened();
    await pollBrowserClosed(drivers);
    if (!checkOpened) {
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
/**
 * MAIN
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @param {*} driver
 * @returns
 */
const runTest = (req, res, next, driver, index) => {
  const maxTime = 30000;
  const { userId, listMintegralDeletedCreative } = req;
  const { creativeName, offerName } = listMintegralDeletedCreative[index];
  return new Promise(async (resolve, reject) => {
    try {
      await driver.get("https://www.google.com");
      const inputSearchCss = "textarea[name=q]";
      await driver
        .wait(
          until.elementLocated({
            css: inputSearchCss,
          }),
          maxTime
        )
        .then(async () => {
          await driver
            .findElement(By.css(inputSearchCss))
            .sendKeys(creativeName);
          currentProgress += index * 1;
          // send notify update progress
          handlePushNotifications(
            "update-progress",
            userId,
            null,
            null,
            currentProgress
          );
          const btnSearchPath =
            "//div[@class='FPdoLc lJ9FBc']//input[@name='btnK']";
          await driver.findElement(By.xpath(btnSearchPath)).click();
          currentProgress += index * 2;
          // send notify update progress
          handlePushNotifications(
            "update-progress",
            userId,
            null,
            null,
            currentProgress
          );
          // send notification status task
          handlePushNotifications(
            "notify-task",
            userId,
            "Test ID",
            false,
            null
          );
          resolve("Run success");
        })
        .catch(reject);
    } catch (error) {
      reject(error);
      await driver.sleep(2000);
    }
  }).catch((err) => {
    console.log("RUN TEST FAILED\n\n", err);
  });
};
// const runTest = (req, res, next, driver, index) => {
//   const maxTime = 30000;
//   const { userId } = req.body;
//   const DATA = req.data;
//   const { creativeName, offerName } = DATA;
//   // console.log("=============DATA==============", DATA);
//   return new Promise(async (resolve, reject) => {
//     try {
//       // open the browser with the specified creative name
//       await driver.get(
//         "https://adv.mintegral.com/creatives?creative_name=" + creativeName
//       );
//       currentProgress += index * 1;
//       // define path delete button
//       const btnDeletePath =
//         "//button[@class='el-button text--red el-button--text']";
//       await driver
//         .wait(
//           until.elementLocated({
//             xpath: btnDeletePath,
//           }),
//           maxTime
//         )
//         .then(async () => {
//           await driver.findElement(By.xpath(btnDeletePath)).click();
//           currentProgress += index * 2;
//           // define offer name path
//           const offerNamePath = "//textarea[@class='el-textarea__inner']";
//           await driver
//             .wait(
//               until.elementLocated({
//                 xpath: offerNamePath,
//               }),
//               maxTime
//             )
//             .then(async () => {
//               /** change offer name */
//               await driver
//                 .findElement(By.xpath(offerNamePath))
//                 .sendKeys(offerName);
//               currentProgress += index * 3;
//               // define delete button

//               const btnDeleteCreativePath =
//                 "//div[@aria-label='Delete Creative']//button[2]";
//               await driver
//                 .wait(
//                   until.elementLocated({
//                     xpath: btnDeleteCreativePath,
//                   })
//                 )
//                 .then(async () => {
//                   await driver
//                     .findElement(By.xpath(btnDeleteCreativePath))
//                     .click();
//                   currentProgress += index * 4;
//                   resolve("Run Sucess")
//                   /****************** DONE ***************************/
//                 })
//                 .catch(reject);
//             })
//             .catch(reject);
//         })
//         .catch(reject);
//     } catch (error) {
//       reject(error);
//       await driver.sleep(2000);
//     }
//   }).catch((err) => {
//     console.log("RUN TEST FAILED", err);
//   });
// };
module.exports = {
  runTest,
  handleFetchMintegralRemoveCreative,
  handMultiFetchMintegralRemovedCreative,
};
