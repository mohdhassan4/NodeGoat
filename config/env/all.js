// default app configuration
const port = process.env.PORT || 4000;
let db = process.env.MONGODB_URI || "mongodb://localhost:27017/nodegoat";

// SESSION_SECRET and CRYPTO_KEY must be set in production via environment variables.
// The fallback values are for local development only and must not be used in production.
const cookieSecret = process.env.SESSION_SECRET || "dev-only-session-secret-replace-in-production";
const cryptoKey = process.env.CRYPTO_KEY || "dev-only-crypto-key-replace-in-production";

module.exports = {
    port,
    db,
    cookieSecret,
    cryptoKey,
    cryptoAlgo: "aes256",
    hostName: "localhost",
    environmentalScripts: []
};

