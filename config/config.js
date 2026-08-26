const _ = require("underscore");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const allConf = require("../config/env/all.js");

const validEnvs = ["development", "production", "test"];
const env = validEnvs.includes(finalEnv.toLowerCase()) ? finalEnv.toLowerCase() : "development";
const envConfigs = {
    development: require("../config/env/development.js"),
    production: require("../config/env/production.js"),
    test: require("../config/env/test.js")
};
const envConf = envConfigs[env] || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
