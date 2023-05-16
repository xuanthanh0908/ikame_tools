var crontab = require("node-crontab");
var exec = require("child_process").exec;

crontab.scheduleJob("*/45 * * * *", function () {
  exec("py pull.py", function (error, stdout, stderr) {
    console.log("stdout: " + stdout);
    console.log("stderr: " + stderr);
    if (error !== null) {
      console.log("exec error: " + error);
    }
  });
});
