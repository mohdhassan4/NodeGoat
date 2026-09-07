const _ = require("underscore");
const path = require("path");
const util = require("util");

// Allowlist valid environment names to prevent path traversal
const validEnvironments = ["development", "production", "test"];
const requestedEnv = (process.env.NODE_ENV || "development").toLowerCase();
const finalEnv = validEnvironments.includes(requestedEnv) ? requestedEnv : "development";

const allConf = require(path.resolve(__dirname + "/../config/env/all.js"));
const envConf = require(path.resolve(__dirname + "/../config/env/" + finalEnv + ".js")) || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
