let connectedSocket = {};

async function socketHandler(connectingSockets) {
  return async (socket) => {
    // socket listener for auth
    socket.on("auth", async ({ id }) => {
      console.log("=================USER CONNECTED===================", id);
      connectedSocket[id] = socket.id;
    });
    /**
     *
     *
     *
     *
     *
     */
    // socket listener for message
    socket.on("message", async ({ userId, message }) => {
      console.log(
        "===========GET MESSAGE FROM USER============",
        userId,
        message
      );
      console.log("connectedSocket", connectedSocket);
      if (connectedSocket[userId]) {
        socket.to(connectedSocket[userId]).emit("update", message);
      }
    });

    /**
     *
     *
     *
     *
     *
     */
    // socket listener for update progress step upload youtube
    socket.on("progress-ytb", async (data) => {
      console.log("=========== UPDATE PROGRESS YOUTUBE ============", data);
      if (connectedSocket[data.created_by]) {
        socket
          .to(connectedSocket[data.created_by])
          .emit("update-progress-ytb", data);
      }
    });
    /**
     *
     *
     *
     *
     *
     */
    // socket listener for deleted creative mintegral
    socket.on("integral-deleted-creative:update-progress-on", async (data) => {
      if (connectedSocket[data.created_by]) {
        console.log("\n\nchecking update-progress-on", data);
        socket
          .to(connectedSocket[data.created_by])
          .emit("integral-deleted-creative:update-progress-to", data);
      }
    });
    socket.on("integral-deleted-creative:notify-task-on", async (data) => {
      if (connectedSocket[data.created_by]) {
        console.log("\n\nchecking notify-task-on", data);
        socket
          .to(connectedSocket[data.created_by])
          .emit("integral-deleted-creative:notify-task-to", data);
      }
    });
    /**
     *
     *
     *
     *
     *
     *
     *
     */
    // socket listener for disconnect
    socket.on("disconnect", () => {
      console.log("Client disconnected");
      delete connectedSocket[socket.id];
    });
  };
}
module.exports = {
  socketHandler,
};
