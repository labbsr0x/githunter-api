const logger = require('../infra/logger');
const dataProvider = require('../services/data-provider/controller');

const userSimpleController = async (req, res) => {
  try {
    const { provider, organization } = req.query;

    logger.info('User Simple Controller -> Endpoint requested');
    logger.info('%j', req.query);

    const users = await dataProvider.getUsersLogin({ provider, organization });

    res.status(200).send(users.data);
  } catch (error) {
    logger.error(error);

    res
      .status(500)
      .send({ message: error.message ? error.message : 'Unknow error' });
  }
};

module.exports = userSimpleController;
