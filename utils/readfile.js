const readline = require("readline");
const fs = require("fs");
const os = require("os");
const events = require("events");

// Get the operating system platform
const platform = os.platform();

const readFile = () => {
  let profile = [];
  // /Users/thanhxuan/Library/Application Support/Firefox/profiles.ini
  const windowOsPath = process.env.APPDATA + "\\Mozilla\\Firefox\\profiles.ini"; // Get the path to the AppData folder
  const macOsPath =
    process.env.HOME + "/Library/Application Support/Firefox/profiles.ini"; // Get the path to the AppData folder
  return new Promise((resolve, rejects) => {
    const readInterface = readline.createInterface({
      input: fs.createReadStream(
        platform === "darwin" ? macOsPath : windowOsPath
      ),
      output: process.stdout,
      console: false,
    });
    readInterface.on("line", function (line) {
      profile.push(line);
    });

    /// wait for readInterface to close
    events.once(readInterface, "close").then(async (e) => {
      if (platform === "darwin") {
        const profileMacOsPath =
          process.env.HOME +
          "/Library/Application Support/Firefox/" +
          profile[3].split("=")[1];
        resolve(profileMacOsPath);
      } else {
        const profileWinOsPath =
          process.env.APPDATA +
          "\\Mozilla\\Firefox\\" +
          profile[1].split("=")[1];
        resolve(profileWinOsPath);
      }
    });
  });
};

module.exports = {
  readFile,
};
