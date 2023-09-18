const fs = require("fs");

const readFile = async () => {
  try {
    // Read the file asynchronously
    const rawData = await fs.readFile(filePath);
    const jsonData = JSON.parse(rawData);
    console.log(jsonData);
    return jsonData;
  } catch (error) {
    console.error("Error reading file:", error);
  }
};

const writeFile = async (filePath, jsonData) => {
  try {
    // Write to the file asynchronously
    await fs.writeFile(filePath, JSON.stringify(dataToWrite, null, 2));
    console.log("Data written to file.");
  } catch (error) {
    console.error("Error writing file:", error);
  }
};
