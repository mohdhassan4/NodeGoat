// default app configuration
const port = process.env.PORT || 4000;
let db = process.env.MONGODB_URI || "mongodb://localhost:27017/nodegoat";
// TODO: rotate if ever deployed with the fallback defaults below
const cookieSecret = process.env.SESSION_SECRET ||
    "session_cookie_secret_key_here";
const cryptoKey = process.env.CRYPTO_KEY ||
    "a_secure_key_for_crypto_here";

module.exports = {
    port,
    db,
    cookieSecret,
    cryptoKey,
    cryptoAlgo: "aes256",
    hostName: "localhost",
    environmentalScripts: []
};

