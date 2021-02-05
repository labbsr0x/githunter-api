const config = require('config');

const logger = require('../../infra/logger');
const HttpClient = require('../rest/RESTClient');

const dataProvider = config.get('data-provider');
const httpClient = new HttpClient({
  url: dataProvider.url,
});

const getUsersLogin = async ({ provider, organization }) => {
  let endPoint = dataProvider.endpoints.usersSimple;

  try {
    const response = await httpClient.get({
      path: endPoint,
      params: { provider, organization },
    });

    logger.debug(`GET Request to get data into Data-Provider successfully!`);

    return response;
  } catch (e) {
    logger.error(`GET Request to get data into Data-Provider: ${e.message}`);
    logger.error(`%j`, e);

    throw e;
  }
};

module.exports = {
  getUsersLogin,
};
