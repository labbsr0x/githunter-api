const qs = require('qs');
const moment = require('moment');
const config = require('config');
const Route = require('route-parser');
const HttpClient = require('../rest/RESTClient');
const logger = require('../../infra/logger');

const starwsConfig = config.get('star-ws');
const httpClient = new HttpClient({
  url: starwsConfig.urlData,
});

const auth = {
  accessToken: '',
  accessTokenGenerationTime: '', // last token generation time
  expiresIn: '', // token expires in (cames from starws auth response)
};

// TODO: Use percentage of expires_in
// const isTokenExpired = () => {
//   // Fist time for authentication
//   if (!auth.accessToken) return true;

//   const { renewTokenInMinute } = starwsConfig; // should renew token in minute

//   // Check if should renew token using expires date from startws
//   //      or from app config
//   let expires = auth.expiresIn - renewTokenInMinute;
//   expires = expires > 0 ? renewTokenInMinute : auth.expiresIn;

//   const expiresDatetime = moment().add(expires, 'minutes');
//   return auth.accessTokenGenerationTime.isAfter(expiresDatetime);
// };

const authenticate = async () => {
  try {
    // if (!isTokenExpired()) {
    //   return true;
    // }

    const headers = {
      'content-type': 'application/x-www-form-urlencoded',
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    const response = await httpClient.post(
      starwsConfig.endpoints.auth,
      qs.stringify(starwsConfig.authParams),
      headers,
      starwsConfig.urlAuth,
    );

    if (response && response.data) {
      auth.accessToken = response.data.access_token;
      auth.expiresIn = response.data.expires_in;
      auth.accessTokenGenerationTime = moment();
      httpClient.addAccessToken(auth.accessToken);
      logger.info(`Authentication successfully! ${auth.accessToken}`);
    } else {
      logger.info(`Something wrong.`);
      logger.info(response);
    }
    return true;
  } catch (err) {
    logger.error(`Authentication failure! msg: ${err}`);
    return false;
  }
};

const publishMetrics = async (provider, node, data) => {
  const isAuthenticate = await authenticate();
  if (!isAuthenticate) {
    return false;
  }
  let endPoint = starwsConfig.endpoints.publishMetrics;

  const route = new Route(endPoint);
  endPoint = route.reverse({ provider, node });

  try {
    const response = await httpClient.post(endPoint, data);
    logger.info(`POST Request for path /publish successfully executed!`);
    return response;
  } catch (e) {
    logger.error(`POST Request for path /publish failure! ${e}`);
    return e.response;
  }
};

const metrics = async (provider, node, params) => {
  const isAuthenticate = await authenticate();
  if (!isAuthenticate) {
    return false;
  }
  let endPoint = starwsConfig.endpoints.metrics;

  const route = new Route(endPoint);
  endPoint = route.reverse({ provider, node });

  try {
    const response = await httpClient.get({ path: endPoint, params });
    logger.info(`GET Request for path /metrics successfully executed!`);
    return response;
  } catch (e) {
    logger.error(`GET Request for path /metrics failure! ${e}`);
    return e.response;
  }
};

const saveJSONData = async data => {
  const isAuthenticate = await authenticate();
  const endPoint = starwsConfig.endpoints.jsonDataAPI;

  if (!isAuthenticate) {
    return false;
  }

  try {
    const response = await httpClient.post(endPoint, data);
    if (response.status === 200 && response.data) {
      logger.info(
        `POST Request to save JSON data in JSON-Data-API successfully!`,
      );
      return response.data;
    }
    logger.error(`POST Request to save JSON data in JSON-Data-API failure!`);
    return false;
  } catch (e) {
    logger.error(
      `POST Request to save JSON data in JSON-Data-API failure! ${e}`,
    );
    return e.response;
  }
};

const getJSONData = async url => {
  const isAuthenticate = await authenticate();
  if (!isAuthenticate) {
    return false;
  }

  try {
    const response = await httpClient.get({ path: url, isFullURL: true });
    if (response.status === 200 && response.data) {
      logger.info(
        `GET Request to get JSON data in JSON-Data-API successfully!`,
      );
      return response.data;
    }
    logger.error(`GET Request to get JSON data in JSON-Data-API failure!`);
    return false;
  } catch (e) {
    logger.error(`GET Request to get JSON data in JSON-Data-API failure! ${e}`);
    return e.response;
  }
};

module.exports = {
  publishMetrics,
  metrics,
  saveJSONData,
  getJSONData,
};
