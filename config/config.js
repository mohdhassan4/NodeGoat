const _ = require("underscore");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const allConf = require("./env/all");

const envConfigs = {
    development: require("./env/development"),
    test: require("./env/test"),
    production: require("./env/production")
};
const envName = finalEnv.toLowerCase();
const envConf = envConfigs[envName] || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
