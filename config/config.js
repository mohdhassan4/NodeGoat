const _ = require("underscore");
const path = require("path");
const util = require("util");

const validEnvs = ["development", "production", "test"];
const requestedEnv = (process.env.NODE_ENV || "development").toLowerCase();
const finalEnv = validEnvs.includes(requestedEnv) ? requestedEnv : "development";

const allConf = require(path.join(__dirname, "..", "config", "env", "all.js"));
const envConf = require(path.join(__dirname, "..", "config", "env", finalEnv + ".js")) || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
