# bull-admin-panel
[![npm version](https://badge.fury.io/js/kue-admin-panel.svg)](https://www.npmjs.com/package/kue-admin-panel)
[![Actions Status](https://github.com/kelp404/bull-admin-panel/workflows/test/badge.svg)](https://github.com/kelp404/bull-admin-panel/actions)

An admin panel of [Bull](https://github.com/OptimalBits/bull) based on WebSocket.

## Installation
```bash
npm install bull-admin-panel
```

## Screenshots
<img src="_screenshots/screenshots-01.png"/>

## Example
[more details...](/example)
```js
const express = require('express');
const http = require('http');
const Bull = require('bull');
const BullAdminPanel = require('bull-admin-panel');

const app = express();
const server = http.createServer(app);
const queue = new Bull('queue-name', {
  redis: {
    host: 'localhost',
    port: 6379,
    db: 1
  }
});

app.use('/bull', new BullAdminPanel({
  basePath: '/bull',
  verifyClient: (info, callback) => {
    // Do authorization for web socket.
    callback(true);
  },
  queues: [queue],
  server: server
}));

// Launch server
server.listen(8000, 'localhost', () => {
  const {address, port} = server.address();
  console.log(`Server listening at http://${address}:${port}`);
});
```
