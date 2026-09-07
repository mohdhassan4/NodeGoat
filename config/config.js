const _ = require("underscore");
const path = require("path");
const util = require("util");

// Allowlist of valid environment names to prevent code injection
const validEnvironments = ["development", "production", "test"];
const rawEnv = process.env.NODE_ENV || "development";
const normalizedEnv = rawEnv.toLowerCase();

// Validate environment against allowlist
if (!validEnvironments.includes(normalizedEnv)) {
    throw new Error(`Invalid NODE_ENV: ${rawEnv}. Must be one of: ${validEnvironments.join(", ")}`);
}
const finalEnv = normalizedEnv;

const allConf = require(path.join(__dirname, "..", "config", "env", "all.js"));
const envConf = require(path.join(__dirname, "..", "config", "env", `${finalEnv}.js`)) || {};

const config = { ...allConf, ...envConf };

console.log(`Current Config:`);
console.log(util.inspect(config, false, null));

module.exports = config;
