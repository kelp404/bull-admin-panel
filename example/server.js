const config = require('config');
const express = require('express');
const http = require('http');
const Bull = require('bull');
const BullAdminPanel = require('../');

const app = express();
const server = http.createServer(app);

app.get('/', (req, res) => res.redirect('/bull'));

app.use('/bull', new BullAdminPanel({
  basePath: '/bull',
  verifyClient: (info, callback) => {
    // Do authorization for WebSocket.
    // const user = auth(info.req);
    // if (!user) {
    //   callback(false, 401, 'Unauthorized');
    // }
    callback(true);
  },
  queues: [new Bull('task-worker', config.bull)],
  server: server
}));

// Launch server
server.listen(config.expressServer.port, config.expressServer.host, () => {
  const {address, port} = server.address();
  console.log(`Server listening at http://${address}:${port}`);
});
