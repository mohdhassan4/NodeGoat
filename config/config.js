const _ = require("underscore");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const allConf = require("./env/all.js");

// Use explicit switch to avoid bracket-notation object injection (CWE-94)
function getEnvConfig(env) {
    switch (env.toLowerCase()) {
        case "development":
            return require("./env/development.js");
        case "production":
            return require("./env/production.js");
        case "test":
            return require("./env/test.js");
        default:
            return {};
    }
}

const envConf = getEnvConfig(finalEnv);

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
