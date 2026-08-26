const _ = require("underscore");
const path = require("path");
const util = require("util");

const allowedEnvs = ["development", "test", "production"];
const requestedEnv = (process.env.NODE_ENV || "development").toLowerCase();
const finalEnv = allowedEnvs.indexOf(requestedEnv) !== -1 ? requestedEnv : "development";

const allConf = require(path.resolve(__dirname, "..", "config", "env", "all.js"));
const envConf = require(path.resolve(__dirname, "..", "config", "env", finalEnv + ".js")) || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
