const config = require('config');
const express = require('express');
const http = require('http');
const kue = require('kue');
const KueAdminPanel = require('../');

const app = express();
const server = http.createServer(app);
const queue = kue.createQueue(config.kue);

app.get('/', (req, res) => res.redirect('/kue'));

app.use(new KueAdminPanel({
  basePath: '/kue',
  verifyClient: (info, callback) => {
    // Do authorization for web socket.
    // const user = auth(info.req);
    // if (!user) {
    //   callback(false, 401, 'Unauthorized');
    // }
    callback(true);
  },
  queue: queue,
  server: server
}));

// Launch server
server.listen(config.expressServer.port, config.expressServer.host, () => {
  const {address, port} = server.address();
  console.log(`Server listening at http://${address}:${port}`);
});
