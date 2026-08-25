const _ = require("underscore");
const path = require("path");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const envConfigs = {
    "all": require(path.resolve(__dirname, "..", "config", "env", "all.js")),
    "development": require(path.resolve(__dirname, "..", "config", "env", "development.js")),
    "production": require(path.resolve(__dirname, "..", "config", "env", "production.js")),
    "test": require(path.resolve(__dirname, "..", "config", "env", "test.js"))
};

const allConf = envConfigs["all"];
const envName = finalEnv.toLowerCase();
if (!envConfigs.hasOwnProperty(envName) || envName === "all") {
    throw new Error("Invalid environment: " + envName);
}
const envConf = envConfigs[envName] || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
