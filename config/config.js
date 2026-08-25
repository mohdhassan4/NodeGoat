const _ = require("underscore");
const path = require("path");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const VALID_ENVS = { "development": true, "production": true, "test": true };
const env = finalEnv.toLowerCase();
if (!VALID_ENVS[env]) {
    throw new Error("Invalid environment: " + env);
}

const allConf = require(path.join(__dirname, "..", "config", "env", "all.js"));
const envConf = require(path.join(__dirname, "..", "config", "env", env + ".js")) || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
