class Queue {
  constructor() {
    this.q = [];
  }
  send(item) {
    this.q.push(item);
  }
  receive() {
    return this.q.shift();
  }
}

module.exports = Queue;
