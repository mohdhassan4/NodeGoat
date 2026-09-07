const _ = require("underscore");
const path = require("path");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

// Explicitly require all known environment configs to prevent dynamic require vulnerability
const envConfigs = {
    development: require(path.resolve(__dirname + "/../config/env/development.js")),
    production: require(path.resolve(__dirname + "/../config/env/production.js")),
    test: require(path.resolve(__dirname + "/../config/env/test.js"))
};

const allConf = require(path.resolve(__dirname + "/../config/env/all.js"));
const envConf = envConfigs[finalEnv.toLowerCase()] || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
