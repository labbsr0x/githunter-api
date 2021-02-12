const axios = require('axios').default;

const logger = require('../../infra/logger');

class Http {
  constructor({ url, headers, accessToken }) {
    headers = headers || { 'Content-type': 'application/json' };

    if (!headers['Content-type']) {
      headers['Content-type'] = 'application/json';
    }

    this.service = axios.create({
      url,
      timeout: 80000,
      headers,
    });

    if (accessToken) {
      this.addAccessToken(accessToken);
    }
  }

  addAccessToken(accessToken) {
    this.service.interceptors.request.use(config => {
      config.headers.common.Authorization = `Bearer ${accessToken}`;
      return config;
    });
  }

  get({ path, params, headers, body, isFullURL = false }) {
    let url = this.service.defaults.url + path;
    if (isFullURL) {
      url = path;
    }

    const config = { params, headers };
    if (body) config.data = body;

    return this.service.get(url, config);
  }

  patch(path, payload, callback) {
    return this.service
      .request({
        method: 'PATCH',
        url: this.service.defaults.url + path,
        responseType: 'json',
        data: payload,
      })
      .then(response => callback(response.status, response.data))
      .catch(err => {
        logger.error(err);
      });
  }

  post(path, payload, headers, url = null) {
    return this.service.request({
      method: 'POST',
      url: url ? url + path : this.service.defaults.url + path,
      headers,
      responseType: 'json',
      data: payload,
    });
  }
}

module.exports = Http;
