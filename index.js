const http = require("http");
const helmet = require("helmet");
const express = require("express");
const {
  handleFetchApiGgAds,
  handleFetchMultiApiGgAds,
  handFetchAdsGroup,
  handMultiFetchAdsGroup,
  handleFetchApi,
  handleMultiFetchApi,
  handFetchCreativePlaylist,
  handMultiFetchCreativePlaylist,
  scheduleRun,
} = require("./tools/");
const cors = require("cors");
const socketIo = require("socket.io");
const ApiError = require("./utils/apiError");
const catchAsync = require("./utils/catchAsync");
const { errorConverter, errorHandler } = require("./utils/error");
const { socketHandler } = require("./socket");

const Server = socketIo.Server;
const app = express();
let server;
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

const createCampaignTikTok = catchAsync(async (req, res, next) => {
  const { isMulti } = req.body;
  if (isMulti) {
    await handleMultiFetchApi(req, res, next);
  } else await handleFetchApi(req, res, next);
  res.status(200).send({ message: "success" });
});
const createCampaignGgAds = catchAsync(async (req, res, next) => {
  const { isMulti } = req.body;
  if (isMulti) {
    await handleFetchMultiApiGgAds(req, res, next);
  } else await handleFetchApiGgAds(req, res, next);
  res.status(200).send({ message: "success" });
});

const automateAdsGroup = catchAsync(async (req, res, next) => {
  const { isMulti } = req.body;
  // console.log(req.body);
  if (isMulti) {
    await handMultiFetchAdsGroup(req, res, next);
  } else await handFetchAdsGroup(req, res, next);
  res.status(200).send({ message: "success" });
});

const automateCreativePlaylist = catchAsync(async (req, res, next) => {
  const { isMulti } = req.body;
  res.status(200).send({ message: "success" });
  if (isMulti) {
    await handMultiFetchCreativePlaylist(req, res, next);
  } else await handFetchCreativePlaylist(req, res, next);
});

app.post("/tool/tiktok", createCampaignTikTok);
app.post("/tool/playlist", automateCreativePlaylist);
app.post("/tool/google-ads", createCampaignGgAds);
app.post("/tool/google-ads-group", automateAdsGroup);
// app.post("/tool/creative-youtube", automateCreativeYoutube);
// scheduleRun();
// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(404, "Not found"));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

// init socket
server = http.createServer({}, app);
let io = new Server(server, {
  pingTimeOut: 3 * 60 * 1000,
  autoConnect: true,
  cors: {
    origin: "*",
  },
});
const namespaceSocket = io.of("/");
socketHandler(namespaceSocket)
  .then((handler) => {
    io.on("connection", handler);
    server.listen(PORT, () => {
      console.info(`--- Server Started --- http://localhost:${PORT}`);
    });
  })
  .catch((error) => console.log(error));
// start the server

const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.log("Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  console.log(error);
  // exitHandler();
};

process.on("unhandledRejection", unexpectedErrorHandler);
process.on("uncaughtException", unexpectedErrorHandler);

/// something went wrong .
process.on("SIGTERM", () => {
  console.log("SIGTERM received");
  // if (server) {
  //   server.close();
  // }
});
