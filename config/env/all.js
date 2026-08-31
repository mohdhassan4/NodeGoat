// default app configuration
const port = process.env.PORT || 4000;
let db = process.env.MONGODB_URI || "mongodb://localhost:27017/nodegoat";

module.exports = {
    port,
    db,
    // Secret must be rotated - was hardcoded in version control
    cookieSecret: process.env.COOKIE_SECRET || "session_cookie_secret_key_here",
    cryptoKey: process.env.CRYPTO_KEY || "a_secure_key_for_crypto_here",
    cryptoAlgo: "aes256",
    hostName: "localhost",
    environmentalScripts: []
};

