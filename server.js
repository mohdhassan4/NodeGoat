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
const allowedCertBase = path.resolve(__dirname, "artifacts", "cert");
const certPath = path.resolve(__dirname, "./artifacts/cert/server.crt");
const keyPath = path.resolve(__dirname, "./artifacts/cert/server.key");

// Validate resolved paths stay within the expected certs directory (CWE-22 mitigation)
if (!certPath.startsWith(allowedCertBase + path.sep) ||
    !keyPath.startsWith(allowedCertBase + path.sep)) {
    throw new Error("TLS cert/key path escapes allowed directory");
}

const httpsEnabled = fs.existsSync(certPath) && fs.existsSync(keyPath);
const httpsOptions = httpsEnabled ? {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
} : null;

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
        // Fix for A3 - XSS
        cookie: {
            httpOnly: true,
            secure: true,
            path: "/",
            domain: process.env.COOKIE_DOMAIN || "localhost",
            maxAge: 2 * 60 * 60 * 1000,
            expires: new Date(Date.now() + 2 * 60 * 60 * 1000)
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
    // Use secure HTTPS protocol when certs are available
    if (httpsEnabled) {
        https.createServer(httpsOptions, app).listen(port, () => {
            console.log(`Express https server listening on port ${port}`);
        });
        // Redirect HTTP to HTTPS on port 80 (if available)
        const httpRedirectPort = process.env.HTTP_REDIRECT_PORT || 80;
        http.createServer((req, res) => {
            res.writeHead(301, {
                "Location": "https://" + req.headers.host + req.url
            });
            res.end();
        }).listen(httpRedirectPort, () => {
            console.log(`HTTP redirect server listening on port ${httpRedirectPort}`);
        }).on("error", () => {
            // Port 80 may not be available; redirect server is optional
        });
    } else {
        // Fallback for development when TLS certs are not available
        console.warn("WARNING: No TLS certificates found. Starting insecure HTTP server.");
        http.createServer(app).listen(port, () => {
            console.log(`Express http server listening on port ${port}`);
        });
    }

});
