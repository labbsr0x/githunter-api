'use strict';

const express = require('express');
const metricsController = require('../controller/user.controller');

const init = middlewares => {
  const router = express.Router();

  if (middlewares) {
    middlewares.forEach(middleware => router.use(middleware));
  }

  router.get('/user', metricsController);

  return router;
};

module.exports = init;
