const _ = require("underscore");
const util = require("util");

const finalEnv = process.env.NODE_ENV || "development";

const allConf = require("./env/all");

const allowedEnvs = ["development", "production", "test"];
const envName = finalEnv.toLowerCase();
if (!allowedEnvs.includes(envName)) {
    throw new Error(`Invalid NODE_ENV value: "${finalEnv}". Allowed values: ${allowedEnvs.join(", ")}`);
}
const envConf = require("./env/" + envName) || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
