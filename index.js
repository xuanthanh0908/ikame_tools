const { Builder, Browser, By, Key, until } = require("selenium-webdriver");
const http = require("http");
const helmet = require("helmet");
const express = require("express");
const { handleFetchApi } = require("./tools/automate_titktok");
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

const createCampaign = catchAsync(async (req, res, next) => {
  await handleFetchApi(req, res, next);
  res.status(200).send({ message: "success" });
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

process.on("SIGTERM", () => {
  console.log("SIGTERM received");
  // if (server) {
  //   server.close();
  // }
});
