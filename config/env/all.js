// default app configuration
const port = process.env.PORT || 4000;
let db = process.env.MONGODB_URI || "mongodb://localhost:27017/nodegoat";

module.exports = {
    port,
    db,
    // SECURITY: Load secrets from environment; rotate credentials — old values are in git history
    cookieSecret: process.env.COOKIE_SECRET || "change-me-in-production-cookie-secret",
    cryptoKey: process.env.CRYPTO_KEY || "change-me-in-production-crypto-key",
    cryptoAlgo: "aes256",
    hostName: "localhost",
    environmentalScripts: []
};

