'use strict';
const express = require('express');
const config = require('config');
const logger = require('../logger');

const serverConfig = config.get('server');

const initRoutes = async app => {
  // Routers
  const routers = require('../../router/router');
  app.use(serverConfig.baseDir, routers());
};

const configureApp = app => {
  const bodyParser = require('body-parser');

  app.use(bodyParser.json({ limit: '10mb', extended: true }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  var cors = require('cors');
  app.use(cors());
};

const startApp = app => {
  const http = require('http');
  const server = http.createServer(app);

  var appEnv = serverConfig;
  server.listen(appEnv.port, appEnv.host, () => {
    const env = config.util.getEnv('NODE_ENV');
    logger.info(`Starting app for environment: ${env}`);
    // print a message when the server starts listening
    logger.info(`Server starting on ${appEnv.host}:${appEnv.port}`);
  });
};

const init = () => {
  const app = express();
  configureApp(app);
  initRoutes(app);
  startApp(app);
};

module.exports = init;
