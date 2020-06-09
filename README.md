# bull-admin-panel
[![npm version](https://badge.fury.io/js/bull-admin-panel.svg)](https://www.npmjs.com/package/bull-admin-panel)
[![Coverage Status](https://coveralls.io/repos/github/kelp404/bull-admin-panel/badge.svg?branch=master)](https://coveralls.io/github/kelp404/bull-admin-panel?branch=master)
[![Actions Status](https://github.com/kelp404/bull-admin-panel/workflows/test%20and%20upload%20coveralls/badge.svg)](https://github.com/kelp404/bull-admin-panel/actions)

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
    // Do authorization for WebSocket.
    // https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback
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


## Work with nginx
bull-admin-panel use WebSocket. You need config upgrade request.  
[NGINX as a WebSocket Proxy](https://www.nginx.com/blog/websocket-nginx/)
```
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $http_connection;
}
```


## Options
### basePath
Type: `string`  
Required: `required`  
The bull admin panel base path. We pass to frontend app.

### socketValidationPath
Type: `string`  
Required: `optional`  
The default value is copy from `basePath`. The websocket just accepts to connect via this path.  
If your site has rewrite path settings. You can use this option.

### verifyClient
Type: `function(info: object, callback: function)`  
Required: `required`  
For websocket authorization.  
More information:
+ [A function which can be used to validate incoming connections.](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback)
+ [Usage](https://github.com/websockets/ws/issues/377#issuecomment-462152231)

### queues
Type: `Array<Bull>`  
Required: `required`  
Bull instances.
```js
const Bull = require('bull');
const queues = [
  new Bull('queue-a', 'redis://localhost:6379/0'),
  new Bull('queue-b', 'redis://localhost:6379/0')
];
```

### server
Type: `http.Server`  
Required: `required`  
The node.js [http.Server](https://nodejs.org/api/http.html#http_class_http_server) instance.


## Develop
Fork this repository then clone it.  
1. Install node modules.  
`npm install`

2. Start the develop server.    
`npm start`


## [Git Commit Guidelines](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines)

We have very precise rules over how our git commit messages can be formatted.  This leads to **more
readable messages** that are easy to follow when looking through the **project history**.  But also,
we use the git commit messages to **generate the AngularJS change log**.

The commit message formatting can be added using a typical git workflow or through the use of a CLI
wizard ([Commitizen](https://github.com/commitizen/cz-cli)). To use the wizard, run `yarn run commit`
in your terminal after staging your changes in git.

### Commit Message Format
Each commit message consists of a **header**, a **body** and a **footer**.  The header has a special
format that includes a **type**, a **scope** and a **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

The **header** is mandatory and the **scope** of the header is optional.

Any line of the commit message cannot be longer 100 characters! This allows the message to be easier
to read on GitHub as well as in various git tools.

### Revert
If the commit reverts a previous commit, it should begin with `revert: `, followed by the header
of the reverted commit.
In the body it should say: `This reverts commit <hash>.`, where the hash is the SHA of the commit
being reverted.

### Type
Must be one of the following:

* **feat**: A new feature
* **fix**: A bug fix
* **docs**: Documentation only changes
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing
  semi-colons, etc)
* **refactor**: A code change that neither fixes a bug nor adds a feature
* **perf**: A code change that improves performance
* **test**: Adding missing or correcting existing tests
* **chore**: Changes to the build process or auxiliary tools and libraries such as documentation
  generation

### Scope
The scope could be anything specifying place of the commit change. For example `/`,
`/jobs`, etc...

You can use `*` when the change affects more than a single scope.

### Subject
The subject contains succinct description of the change:

* use the imperative, present tense: "change" not "changed" nor "changes"
* don't capitalize first letter
* no dot (.) at the end

### Body
Just as in the **subject**, use the imperative, present tense: "change" not "changed" nor "changes".
The body should include the motivation for the change and contrast this with previous behavior.

### Footer
The footer should contain any information about **Breaking Changes** and is also the place to
[reference GitHub issues that this commit closes][closing-issues].

**Breaking Changes** should start with the word `BREAKING CHANGE:` with a space or two newlines.
The rest of the commit message is then used for this.

A detailed explanation can be found in this [document][commit-message-format].
