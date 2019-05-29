const path = require('path');
const dispatch = require('dispatch');
const express = require('express');
const queryString = require('query-string');
const WebSocket = require('ws');
const errors = require('./models/errors');
const Request = require('./models/request');
const Response = require('./models/response');
const socketRouter = require('./routers/socket-router');
const webRouter = require('./routers/web-router');

const _isDebug = process.env.KUE_ADMIN_PANEL_DEBUG;

module.exports = class AdminPanel {
  constructor(args = {}) {
    /*
    @param args {Object}
      basePath {String}
      expressRouter {express.Router}
      verifyClient {Function} (info, callback) =>
      queue {kue.Queue}
      server {http.Server}
     */
    this.basePath = args.basePath;
    this.expressRouter = args.expressRouter;
    this.verifyClient = args.verifyClient;
    this.queue = args.queue;
    this.server = args.server;

    this.dispatcher = dispatch(socketRouter);
    this.wss = new WebSocket.Server({noServer: true, verifyClient: this.verifyClient});
    this.wss.on('connection', this.onConnection.bind(this));
    this.server.on('upgrade', this.onUpgrade.bind(this));

    this.expressRouter.use(
      `${this.basePath}/assets`,
      (req, res, next) => {
        if (/\.(js|css)$/.test(req.path)) {
          res.set('Content-Encoding', 'gzip');
        }

        next();
      },
      express.static(path.join(__dirname, 'frontend', 'dist'))
    );
    this.expressRouter.use(
      this.basePath,
      (req, res, next) => {
        res.locals.kueAdminPanel = {
          assetsPath: _isDebug ? '//localhost:8001' : `${this.basePath}/assets`,
          basePath: this.basePath
        };
        next();
      },
      webRouter
    );
  }

  onUpgrade(request, socket, head) {
    const {url} = queryString.parseUrl(request.url);
    if (url === this.basePath) {
      this.wss.handleUpgrade(request, socket, head, ws => {
        this.wss.emit('connection', ws, request);
      });
    }
  }

  onConnection(ws) {
    ws.on('message', message => {
      let request;
      let response;
      let result;
      try {
        request = new Request({
          ...JSON.parse(message),
          queue: this.queue
        });
        response = new Response({
          requestId: request.id,
          ws: ws
        });
      } catch (error) {
        AdminPanel.returnError(response, error);
      }

      try {
        result = this.dispatcher(request, response, () => {
          throw new errors.Http404(`Not found ${request.method} ${request.url}`);
        });
        if (result && typeof result.catch === 'function') {
          result.catch(error => {
            AdminPanel.returnError(response, error);
          });
        }
      } catch (error) {
        AdminPanel.returnError(response, error);
      }
    });
  }

  static returnError(response, error) {
    if (!(error instanceof Error)) {
      error = new errors.Http500(error);
    }

    console.error(error);
    response.json(
      {
        message: `${error}`,
        stack: _isDebug ? error.stack : undefined,
        extra: error.extra
      },
      error.status || 500
    );
  }
};
