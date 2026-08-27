const _ = require("underscore");
const path = require("path");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const allConf = require(path.resolve(__dirname + "/../config/env/all.js"));
const allowedEnvConfigs = {
    "development": require(path.resolve(__dirname + "/../config/env/development.js")),
    "production": require(path.resolve(__dirname + "/../config/env/production.js")),
    "test": require(path.resolve(__dirname + "/../config/env/test.js"))
};
const envConf = allowedEnvConfigs[finalEnv.toLowerCase()] || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
