const _ = require("underscore");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const VALID_ENVS = { "development": true, "production": true, "test": true };
const env = finalEnv.toLowerCase();
if (!VALID_ENVS[env]) {
    throw new Error("Invalid environment: " + env);
}

const envConfigs = {
    development: require("../config/env/development.js"),
    production: require("../config/env/production.js"),
    test: require("../config/env/test.js")
};
const allConf = require("../config/env/all.js");
const envConf = envConfigs[env] || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
