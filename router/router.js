'use strict';

const express = require('express');
const metricsController = require('../controller/user.controller');
const userSimpleController = require('../controller/userSimple.controller');

const init = middlewares => {
  const router = express.Router();

  if (middlewares) {
    middlewares.forEach(middleware => router.use(middleware));
  }

  router.get('/user', metricsController);
  router.get('/user-simple', userSimpleController);

  return router;
};

module.exports = init;
