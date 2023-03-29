const { Builder, Browser, By, Key, until } = require("selenium-webdriver");
const http = require("http");
const helmet = require("helmet");
const express = require("express");
const { handleFetchApi } = require("./handle_automate");
const cors = require("cors");
const ApiError = require("./utils/apiError");
const catchAsync = require("./utils/catchAsync");
const { errorConverter, errorHandler } = require("./utils/error");
const app = express();
const PORT = 9002;
// enable cors
app.use(
  cors({
    origin: true,
    optionsSuccessStatus: 200,
    credentials: true,
  })
);
app.options(
  "*",
  cors({
    origin: true,
    optionsSuccessStatus: 200,
    credentials: true,
  })
);

// set security HTTP headers
app.use(helmet());
// body parser, reading data from body into req.body
app.use(express.json());
// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

const createCampaign = catchAsync(async (req, res, next) => {
  await handleFetchApi(req, res, next);
  return res.json(" OK ");
});

app.post("/tool/tiktok", createCampaign);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(404, "Not found"));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

// start the server
server = http.createServer({}, app);
server.listen(PORT, () => {
  console.info(`--- Server Started --- http://localhost:${PORT}`);
});
