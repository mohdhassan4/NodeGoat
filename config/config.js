const _ = require("underscore");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";
const allowedEnvs = ["development", "test", "production"];
const envName = allowedEnvs.includes(finalEnv.toLowerCase()) ? finalEnv.toLowerCase() : "development";

const allConf = require("./env/all.js");

const envModules = {
    development: require("./env/development.js"),
    test: require("./env/test.js"),
    production: require("./env/production.js")
};

const envConf = envModules[envName] || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
