"use strict";

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
const envKey = finalEnv.toLowerCase();
const envConf = Object.prototype.hasOwnProperty.call(envConfigs, envKey) ? envConfigs[envKey] : {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
