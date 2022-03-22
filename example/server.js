const config = require('config');
const express = require('express');
const http = require('http');
const Bull = require('bull');
const BullAdminPanel = require('../');

const queue = new Bull('task-worker', config.bull.redisUrl);

setInterval(() => {
  queue.add(
    {data: Math.random().toString(36)},
    {removeOnComplete: 30, removeOnFail: 30, timeout: 30000},
  );
}, 1000);
queue.process(1, () => new Promise((resolve, reject) => {
  const isSuccess = Math.random() >= 0.5;
  const sleepTime = parseInt(Math.random() * 3, 10) * 1000;

  setTimeout(() => {
    if (isSuccess) {
      resolve({sleepTime});
    } else {
      reject(new Error('failed'));
    }
  }, sleepTime);
}));

const app = express();
const server = http.createServer(app);

app.get('/', (req, res) => res.redirect('/bull'));

app.use('/bull', new BullAdminPanel({
  basePath: '/bull',
  verifyClient(info, callback) {
    // Do authorization for WebSocket.
    // const user = auth(info.req);
    // if (!user) {
    //   callback(false, 401, 'Unauthorized');
    // }
    callback(true);
  },
  queues: [queue],
  server,
}));

// Launch server
server.listen(config.expressServer.port, config.expressServer.host, () => {
  const {address, port} = server.address();
  console.log(`Server listening at http://${address}:${port}`);
});
