const _ = require("underscore");
const path = require("path");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const allowedEnvironments = ["development", "production", "test"];
const normalizedEnv = finalEnv.toLowerCase();
if (!allowedEnvironments.includes(normalizedEnv)) {
  throw new Error(`Invalid NODE_ENV value: "${finalEnv}". Allowed values: ${allowedEnvironments.join(", ")}`);
}

const allConf = require(path.resolve(__dirname + "/../config/env/all.js"));
const envConf = require(path.resolve(__dirname + "/../config/env/" + normalizedEnv + ".js")) || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
