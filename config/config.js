const _ = require("underscore");
const util = require("util");

const envConfigs = {
    development: require("./env/development.js"),
    test: require("./env/test.js"),
    production: require("./env/production.js")
};

const allConf = require("./env/all.js");

const allowedEnvs = ["development", "test", "production"];
const requestedEnv = (process.env.NODE_ENV || "development").toLowerCase();
const finalEnv = allowedEnvs.indexOf(requestedEnv) !== -1 ? requestedEnv : "development";

const envConf = envConfigs[finalEnv] || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
