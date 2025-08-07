const app = require("../app");
const serverless = require("serverless-http");

// Exportamos app como una función que Vercel puede invocar
module.exports = serverless(app);
