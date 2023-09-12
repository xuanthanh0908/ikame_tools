const { By, Key, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");
const webdriver = require("selenium-webdriver");
const { readFile } = require("../utils/readfile");
/**
 *
 *
 *
 *
 */
// const listAdjustLinks = [
//   "https://dash.adjust.com/#/setup/krz1uucf2m80/raw-data-export",
//   "https://dash.adjust.com/#/setup/3j6mywx9xebk/raw-data-export",
//   "https://dash.adjust.com/#/setup/92lmvmh6uf40/raw-data-export",
// ];

const handleRunMultipleMain = async (req, res) => {
  const { text_csv, listAdjustLinks } = req.data;
  try {
    // loops
    for (const link of listAdjustLinks) {
      await Main(link, text_csv);
    }
    return res.status(200).json({
      message: "Run successfully !!!",
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      message:
        "There was an error processing. Please contact the administrator (Thanhnx@ikameglobal.com)",
      error: error,
    });
  }
};
/***
 *
 *
 *      MAIN
 *
 *
 */
const Main = (data, text_csv) => {
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
          await driver.get(data);
          const csvUploadDropdownPath = "(//a[@class='item-name flex-one'])[2]";
          const csvInputID = "definition";
          await driver
            .wait(
              until.elementLocated({
                xpath: csvUploadDropdownPath,
              }),
              max_time
            )
            .then(async () => {
              const csvUploadDropdown = await driver.findElement(
                By.xpath(csvUploadDropdownPath)
              );
              await driver
                .executeScript("arguments[0].click()", csvUploadDropdown)
                .then(async () => {
                  const csvInput = await driver.findElement(By.id(csvInputID));
                  // Wait for the element to be visible and clickable
                  await driver.wait(until.elementIsVisible(csvInput), max_time);
                  // Clear all text
                  await csvInput.clear();
                  // Now send keys to the element
                  await csvInput.sendKeys(text_csv);
                  resolve("Run successfully");
                });
            });
        } catch (error) {
          await driver.quit();
          reject(error);
        } finally {
          await driver.sleep(2000);
          await driver.quit();
        }
      })
      .catch(async (err) => {
        console.log("RUN FAILED", err);
      });
  });
};
// handleRunMultipleMain();
module.exports = {
  handleRunMultipleMain,
};
