const _ = require("underscore");
const path = require("path");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const allConf = require(path.resolve(__dirname + "/../config/env/all.js"));
const envConfigs = {
    "development": require("../config/env/development.js"),
    "production": require("../config/env/production.js"),
    "test": require("../config/env/test.js")
};
const envConf = envConfigs[finalEnv.toLowerCase()] || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
