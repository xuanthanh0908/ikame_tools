const readline = require('readline')
const fs = require('fs')
const events = require('events')
const readFile = () => {
  let profile = []
  const appDataPath = process.env.APPDATA + '\\Mozilla\\Firefox\\profiles.ini' // Get the path to the AppData folder
  return new Promise((resolve, rejects) => {
    const readInterface = readline.createInterface({
      input: fs.createReadStream(appDataPath),
      output: process.stdout,
      console: false,
    })
    readInterface.on('line', function (line) {
      profile.push(line)
    })

    /// wait for readInterface to close
    events.once(readInterface, 'close').then(async (e) => {
      const profilePath =
        process.env.APPDATA + '\\Mozilla\\Firefox\\' + profile[1].split('=')[1]
      resolve(profilePath)
    })
  })
}

module.exports = {
  readFile,
}
