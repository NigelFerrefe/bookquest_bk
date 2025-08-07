const app = require('../app'); // importa tu app Express
const serverless = require('serverless-http');

module.exports = serverless(app);
