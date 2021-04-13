const moment = require('moment');
const config = require('config');
const starws = require('../services/star-ws/controller');
const dataProvider = require('../services/data-provider/controller');
const logger = require('../infra/logger');
const { input } = require('../infra/logger');

const quantityMonthlyPeriod = config.get('quantity-monthly-period');

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
      { thing: '+', node: 'issues' },
      { thing: '+', node: 'pulls' },
      { thing: '+', node: 'commits' },
      { thing: '+', node: 'comments' },
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
      .filter(i => i.type === 'pull')
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
      .reduce(accumulator => accumulator + 1, 0);

    const issuesAmount = data
      .filter(i => i.type === 'issues')
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
      .reduce(accumulator => accumulator + 1, 0);

    const commitsAmount = data
      .filter(i => i.type === 'commits')
      .reduce(accumulator => accumulator + 1, 0);

    const contributedRepositories = data
      .filter(
        (arr, index, self) =>
          index ===
          self.findIndex(
            t =>
              t.author === author &&
              t.owner === arr.owner &&
              t.name === arr.name,
          ),
      )
      .reduce(acc => acc + 1, 0);

    const commentsAmount = data
      .filter(i => i.type === 'comments')
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
      .reduce(accumulator => accumulator + 1, 0);

    logger.info('Requesting User Stats on data-provider');
    const userStats = await dataProvider.getUserInfo({
      login: author,
      provider: authorProvider,
    });

    if (userStats.data && userStats.data.length > 0) {
      const {
        name,
        login,
        provider,
        avatarUrl,
        ownedRepositories,
        followers,
      } = userStats.data.shift();

      const stars = ownedRepositories
        .map(
          r =>
            r.starsReceived /
            (moment().diff(moment(r.createdAt), 'months', true) /
              quantityMonthlyPeriod),
        )
        .reduce((acc, cur) => acc + cur);

      const starsAmmount =
        stars - Math.round(stars) !== 0 ? Math.round(stars) : stars;

      const stats = {
        name: name || '',
        login: login || '',
        provider: provider || '',
        avatarUrl: avatarUrl || '',
        contributedRepositories: contributedRepositories || 0,
        commits: commitsAmount,
        pullRequests: pullsAmount,
        issuesOpened: issuesAmount,
        starsReceived: starsAmmount,
        comments: commentsAmount,
        followers: followers.length || 0,
      };

      res.status(200).send(stats);
    } else {
      logger.error(`User ${author} not found in Data-Provider DB!`);
      res
        .status(500)
        .send({ message: `User ${author} not found in Data-Provider DB!` });
    }
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .send({ message: error.message ? error.message : 'Unknow error' });
  }
};

module.exports = metrics;
