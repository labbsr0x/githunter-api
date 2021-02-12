const config = require('config');

const logger = require('../../infra/logger');
const HttpClient = require('../rest/RESTClient');

const dataProvider = config.get('data-provider');
const httpClient = new HttpClient({
  url: dataProvider.url,
});

const getUsersLogin = async ({ provider, organization }) => {
  const endPoint = dataProvider.endpoints.usersSimple;

  try {
    const response = await httpClient.get({
      path: endPoint,
      params: { provider, organization },
    });

    logger.debug(`GET Request to get data into Data-Provider successfully!`);

    return response;
  } catch (e) {
    logger.error(`GET Request get data into Data-Provider: ${e.message}`);
    logger.error(`%j`, e);

    throw e;
  }
};

// Method: GET
// Gets all the static information of a user by passing a login and provider
const getUserInfo = async ({ login, provider }) => {
  const endPoint = `${dataProvider.endpoints.users}/${login}/provider/${provider}`;

  try {
    const response = await httpClient.get({
      path: endPoint,
    });

    logger.debug(
      `GET Request by login and provider to get data into Data-Provider successfully!`,
    );

    return response;
  } catch (e) {
    logger.error(
      `GET Request by login and provider to get data into Data-Provider: ${e.message}`,
    );
    logger.error(`%j`, e);

    throw e;
  }
};

module.exports = {
  getUsersLogin,
  getUserInfo,
};
