const _ = require("underscore");
const util = require("util");

const finalEnv = (process.env.NODE_ENV || "development").toLowerCase();

const allConf = require("./env/all.js");

const envConfigs = {
    development: require("./env/development.js"),
    test: require("./env/test.js"),
    production: require("./env/production.js")
};

const envConf = envConfigs[finalEnv] || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
