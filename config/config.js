const _ = require("underscore");
const util = require("util");

const validEnvironments = ["development", "test", "production"];
const finalEnv = (process.env.NODE_ENV || "development").toLowerCase();

const allConf = require("./env/all");
const envConf = validEnvironments.indexOf(finalEnv) !== -1
    ? require("./env/" + finalEnv)
    : {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
