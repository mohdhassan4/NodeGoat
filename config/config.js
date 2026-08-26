const _ = require("underscore");
const path = require("path");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const allConf = require(path.join(__dirname, "..", "config", "env", "all.js"));

const validEnvs = ["development", "production", "test"];
const env = validEnvs.includes(finalEnv.toLowerCase()) ? finalEnv.toLowerCase() : "development";
const envConf = require(path.join(__dirname, "..", "config", "env", `${env}.js`)) || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
