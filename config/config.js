const _ = require("underscore");
const path = require("path");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const envConfigs = {
    "all": require("./env/all.js"),
    "development": require("./env/development.js"),
    "production": require("./env/production.js"),
    "test": require("./env/test.js")
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
