const config = require('config');

const logger = require('../../infra/logger');
const HttpClient = require('../rest/RESTClient');

const dataProvider = config.get('data-provider');
const httpClient = new HttpClient({
  url: dataProvider.url,
});

const getUsersByOrganization = async ({ provider, organization }) => {
  const endPoint = dataProvider.endpoints.usersSimple;

  try {
    const response = await httpClient.get({
      path: endPoint,
      params: { provider, organization },
    });

    logger.debug(
      `GET Request by organization to get data into Data-Provider successfully!`,
    );

    return response;
  } catch (e) {
    logger.error(
      `GET Request by organization to get data into Data-Provider: ${e.message}`,
    );
    logger.error(`%j`, e);

    throw e;
  }
};

const getUserByLogin = async ({ login, provider }) => {
  const endPoint = `${dataProvider.endpoints.users}/${login}/provider/${provider}`;

  try {
    const response = await httpClient.get({
      path: endPoint,
    });

    logger.debug(
      `GET Request by login to get data into Data-Provider successfully!`,
    );

    return response;
  } catch (e) {
    logger.error(
      `GET Request by login to get data into Data-Provider: ${e.message}`,
    );
    logger.error(`%j`, e);

    throw e;
  }
};

module.exports = {
  getUsersByOrganization,
  getUserByLogin,
};
