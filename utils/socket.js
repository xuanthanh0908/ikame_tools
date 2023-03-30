const ClientSocket = require("socket.io-client");

const socket = ClientSocket("http://localhost:9002");

const emitEvent = (event, data) => {
  socket.emit(event, data);
};

module.exports = {
  emitEvent,
};
