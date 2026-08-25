const _ = require("underscore");
const path = require("path");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const allowedEnvs = ["development", "production", "test"];
const normalizedEnv = finalEnv.toLowerCase();

if (!allowedEnvs.includes(normalizedEnv)) {
    throw new Error("Invalid NODE_ENV value: " + finalEnv + ". Allowed values: " + allowedEnvs.join(", "));
}

const allConf = require(path.join(__dirname, "..", "config", "env", "all.js"));
const envConf = require(path.join(__dirname, "..", "config", "env", normalizedEnv + ".js")) || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
