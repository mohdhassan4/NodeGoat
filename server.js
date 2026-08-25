"use strict";

const express = require("express");
const favicon = require("serve-favicon");
const bodyParser = require("body-parser");
const session = require("express-session");
// const csrf = require('csurf');
const consolidate = require("consolidate"); // Templating library adapter for Express
const swig = require("swig");
// const helmet = require("helmet");
const MongoClient = require("mongodb").MongoClient; // Driver for connecting to MongoDB
const http = require("http");
const marked = require("marked");
//const nosniff = require('dont-sniff-mimetype');
const app = express(); // Web framework to handle routing requests
const routes = require("./app/routes");
const { port, db, cookieSecret } = require("./config/config"); // Application config properties
// Fix for A6-Sensitive Data Exposure
// Load keys for establishing secure HTTPS connection
const fs = require("fs");
const https = require("https");
const path = require("path");

// Validate that a TLS file path is safe (no path traversal).
// Resolved path must stay within the allowed base directory.
const allowedTlsBaseDir = path.resolve(__dirname);

function validateTlsPath(filePath) {
    // Sanitize input before resolution: reject traversal sequences and null bytes.
    if (!filePath || typeof filePath !== "string") {
        throw new Error("TLS path must be a non-empty string");
    }
    if (filePath.indexOf("\0") !== -1) {
        throw new Error("TLS path contains null byte: " + filePath);
    }
    // Split on both separators and reject any ".." segment in the raw input.
    var segments = filePath.split(/[/\\]/);
    for (var i = 0; i < segments.length; i++) {
        if (segments[i] === "..") {
            throw new Error("TLS path contains traversal sequence: " + filePath);
        }
    }
    // Resolve against the project base and confirm the result stays within it.
    var safePath = path.join(allowedTlsBaseDir, filePath);
    var normalized = path.normalize(safePath);
    if (!normalized.startsWith(allowedTlsBaseDir + path.sep) && normalized !== allowedTlsBaseDir) {
        throw new Error("TLS path escapes allowed base directory: " + filePath);
    }
    return normalized;
}

const tlsKeyPath = validateTlsPath(process.env.TLS_KEY_PATH || "./artifacts/cert/server.key");
const tlsCertPath = validateTlsPath(process.env.TLS_CERT_PATH || "./artifacts/cert/server.crt");

MongoClient.connect(db, (err, db) => {
    if (err) {
        console.log("Error: DB: connect");
        console.log(err);
        process.exit(1);
    }
    console.log(`Connected to the database`);

    /*
    // Fix for A5 - Security MisConfig
    // TODO: Review the rest of helmet options, like "xssFilter"
    // Remove default x-powered-by response header
    app.disable("x-powered-by");

    // Prevent opening page in frame or iframe to protect from clickjacking
    app.use(helmet.frameguard()); //xframe deprecated

    // Prevents browser from caching and storing page
    app.use(helmet.noCache());

    // Allow loading resources only from white-listed domains
    app.use(helmet.contentSecurityPolicy()); //csp deprecated

    // Allow communication only on HTTPS
    app.use(helmet.hsts());

    // TODO: Add another vuln: https://github.com/helmetjs/helmet/issues/26
    // Enable XSS filter in IE (On by default)
    // app.use(helmet.iexss());
    // Now it should be used in hit way, but the README alerts that could be
    // dangerous, like specified in the issue.
    // app.use(helmet.xssFilter({ setOnOldIE: true }));

    // Forces browser to only use the Content-Type set in the response header instead of sniffing or guessing it
    app.use(nosniff());
    */

    // Adding/ remove HTTP Headers for security
    app.use(favicon(__dirname + "/app/assets/favicon.ico"));

    // Express middleware to populate "req.body" so we can access POST variables
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        // Mandatory in Express v4
        extended: false
    }));

    // Enable session management using express middleware
    app.use(session({
        // genid: (req) => {
        //    return genuuid() // use UUIDs for session IDs
        //},
        secret: cookieSecret,
        // Both mandatory in Express v4
        saveUninitialized: true,
        resave: true,
        // Fix for A5 - Security MisConfig
        // Use generic cookie name
        name: "sessionId",
        // Fix for A3 - XSS and target cookie security
        cookie: {
            httpOnly: true,
            secure: true,
            maxAge: 24 * 60 * 60 * 1000,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            path: "/",
            domain: process.env.COOKIE_DOMAIN || "localhost"
        }

    }));

    /*
    // Fix for A8 - CSRF
    // Enable Express csrf protection
    app.use(csrf());
    // Make csrf token available in templates
    app.use((req, res, next) => {
        res.locals.csrftoken = req.csrfToken();
        next();
    });
    */

    // Register templating engine
    app.engine(".html", consolidate.swig);
    app.set("view engine", "html");
    app.set("views", `${__dirname}/app/views`);
    // Fix for A5 - Security MisConfig
    // TODO: make sure assets are declared before app.use(session())
    app.use(express.static(`${__dirname}/app/assets`));


    // Initializing marked library
    // Fix for A9 - Insecure Dependencies
    marked.setOptions({
        sanitize: true
    });
    app.locals.marked = marked;

    // Application routes
    routes(app, db);

    // Template system setup
    swig.setDefaults({
        // Autoescape disabled
        autoescape: false
        /*
        // Fix for A3 - XSS, enable auto escaping
        autoescape: true // default value
        */
    });

    // Fix for A6-Sensitive Data Exposure
    // Use secure HTTPS protocol when TLS cert/key files are available
    if (fs.existsSync(tlsKeyPath) && fs.existsSync(tlsCertPath)) {
        const httpsOptions = {
            key: fs.readFileSync(tlsKeyPath),
            cert: fs.readFileSync(tlsCertPath)
        };
        https.createServer(httpsOptions, app).listen(port, () => {
            console.log(`Express https server listening on port ${port}`);
        });
    } else {
        // HTTP fallback bound to localhost only to mitigate cleartext exposure.
        const httpHost = "127.0.0.1";
        http.createServer(app).listen(port, httpHost, () => {
            console.log(`Express http server listening on ${httpHost}:${port}`);
            console.warn("WARNING: Server is using HTTP (cleartext). Use HTTPS in production.");
        });
    }

});
