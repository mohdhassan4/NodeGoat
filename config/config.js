var util = require("util");

var finalEnv = (process.env.NODE_ENV || "development").toLowerCase();

var allConf = require("../config/env/all.js");

var envConf = {};
if (finalEnv === "development") {
    envConf = require("../config/env/development.js");
} else if (finalEnv === "production") {
    envConf = require("../config/env/production.js");
} else if (finalEnv === "test") {
    envConf = require("../config/env/test.js");
}

var config = Object.assign({}, allConf, envConf);

console.log("Current Config:");
console.log(util.inspect(config, false, null));

module.exports = config;
