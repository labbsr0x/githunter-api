'use strict';
const starws = require('../services/star-ws/controller');
const logger = require('../infra/logger');
const dataFeed = require('../services/data-feed/controller');

const metrics = async (req, res) => {
  try {
    const { startDateTime, endDateTime, author, authorProvider } = req.query;

    logger.info('USER Controller -> Endpoint requested');
    logger.info('%j', req.query);

    // Get data from different nodes
    //    commits, comments, issues, pulls

    const filters = [];
    filters.push({ author: `a:${author}` });
    filters.push({ provider: authorProvider });
    const body = JSON.stringify({ filters });

    const source = [
      { thing: '*', node: 'issues' },
      { thing: '*', node: 'pulls' },
      { thing: '*', node: 'commits' },
    ];

    const dataPromisses = [];
    source.forEach(theSource => {
      try {
        dataPromisses.push(
          starws
            .getMetrics(theSource.thing, theSource.node, body, {
              startDateTime,
              endDateTime,
            })
            .catch(e => e),
        );
      } catch (error) {
        logger.info(
          `USER CONTROLLER: No content data for ${theSource.thing} - ${theSource.node}`,
        );
        logger.info('%j', error);
      }
    });

    let sourceData = [];
    try {
      sourceData = await Promise.all(dataPromisses);
    } catch (error) {
      logger.info('%j', error);
    }

    let data = [];
    sourceData.forEach((d, index) => {
      // Means that we have data to calculate
      if (d && d.data && d.data.data && d.data.data.length > 0) {
        data = [...data, ...d.data.data];
      } else {
        logger.info(
          `USER CONTROLLER: No content data for ${source[index].thing} - ${source[index].node}`,
        );
      }
    });

    const pullsAmount = data
      .filter(i => i.type == 'pull')
      .filter(
        (arr, index, self) =>
          index ===
          self.findIndex(
            t =>
              t.number === arr.number &&
              t.owner === arr.owner &&
              t.name === arr.name,
          ),
      )
      .reduce((accumulator, currentValue) => accumulator + 1, 0);

    const issuesAmount = data
      .filter(i => i.type == 'issues')
      .filter(
        (arr, index, self) =>
          index ===
          self.findIndex(
            t =>
              t.number === arr.number &&
              t.owner === arr.owner &&
              t.name === arr.name,
          ),
      )
      .reduce((accumulator, currentValue) => accumulator + 1, 0);

    const commitsAmount = data
      .filter(i => i.type == 'commits')
      .reduce((accumulator, currentValue) => accumulator + 1, 0);

    logger.info('Requesting User Stats on data-provider');
    const userStats = await dataFeed.getUserStats({
      login: author,
      provider: authorProvider,
    });

    const stats = {
      name: userStats.name ? userStats.name : '',
      login: userStats.login ? userStats.login : '',
      avatarUrl: userStats.avatarUrl ? userStats.avatarUrl : '',
      contributedRepositories: userStats.contributedRepositories
        ? userStats.contributedRepositories
        : [],
      commits: commitsAmount ? commitsAmount : 0,
      pullRequests: pullsAmount,
      issuesOpened: issuesAmount,
      starsReceived:
        userStats.amount && userStats.amount.starsReceived
          ? userStats.amount.starsReceived
          : 0,
      followers:
        userStats.amount && userStats.amount.followers
          ? userStats.amount.followers
          : 0,
    };

    res.status(200).send(stats);
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .send({ message: error.message ? error.message : 'Unknow error' });
  }
};

module.exports = metrics;
