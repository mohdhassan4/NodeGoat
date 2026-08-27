const _ = require("underscore");
const util = require("util");

const allConf = require("../config/env/all.js");

const envConfigs = {
    development: require("../config/env/development.js"),
    production: require("../config/env/production.js"),
    test: require("../config/env/test.js")
};

const normalizedEnv = (process.env.NODE_ENV || "development").toLowerCase();
const envConf = envConfigs[normalizedEnv] || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
