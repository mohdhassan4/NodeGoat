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
const fs = require("fs");
const https = require("https");
const path = require("path");

const tlsBaseDir = path.resolve(
    process.env.TLS_BASE_DIR || path.join(__dirname, "artifacts", "cert")
);

function loadTlsFile(filePath, baseDir) {
    if (filePath.indexOf("..") !== -1) {
        throw new Error(
            "TLS file path contains traversal sequence: " + filePath
        );
    }
    var resolvedPath = path.isAbsolute(filePath)
        ? path.normalize(filePath)
        : path.resolve(baseDir, filePath);
    if (!resolvedPath.startsWith(baseDir + path.sep) &&
        resolvedPath !== baseDir) {
        throw new Error(
            "TLS file path outside allowed directory: " + resolvedPath
        );
    }
    if (!fs.existsSync(resolvedPath)) {
        return null;
    }
    return fs.readFileSync(resolvedPath);
}

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
        // Use generic cookie name to avoid fingerprinting
        name: "id",
        // Both mandatory in Express v4
        saveUninitialized: true,
        resave: true,
        cookie: {
            httpOnly: true,
            secure: true,
            domain: process.env.COOKIE_DOMAIN || "localhost",
            path: "/",
            maxAge: 2 * 60 * 60 * 1000,
            expires: new Date(Date.now() + 2 * 60 * 60 * 1000)
        }
        /*
        // Fix for A5 - Security MisConfig
        // Use generic cookie name
        key: "sessionId",
        */

        /*
        // Fix for A3 - XSS
        // TODO: Add "maxAge"
        cookie: {
            httpOnly: true
            // Remember to start an HTTPS server to get this working
            // secure: true
        }
        */

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

    // Use HTTPS when TLS cert and key are available, fall back to HTTP otherwise
    const tlsCertPathRaw = process.env.TLS_CERT_PATH ||
        path.resolve(__dirname, "./artifacts/cert/server.crt");
    const tlsKeyPathRaw = process.env.TLS_KEY_PATH ||
        path.resolve(__dirname, "./artifacts/cert/server.key");

    var tlsCertData, tlsKeyData;
    try {
        tlsCertData = loadTlsFile(tlsCertPathRaw, tlsBaseDir);
        tlsKeyData = loadTlsFile(tlsKeyPathRaw, tlsBaseDir);
    } catch (pathErr) {
        console.error("TLS path validation failed: " + pathErr.message);
        if (process.env.ALLOW_HTTP === "true") {
            console.warn("ALLOW_HTTP=true: starting HTTP server despite invalid TLS paths.");
            http.createServer(app).listen(port, () => {
                console.log(`Express http server listening on port ${port}`);
            });
        } else {
            console.error(
                "Cannot start server without valid TLS configuration. " +
                "Set ALLOW_HTTP=true to allow HTTP in development."
            );
            process.exit(1);
        }
        return;
    }

    if (tlsCertData && tlsKeyData) {
        var httpsOptions = {
            key: tlsKeyData,
            cert: tlsCertData
        };
        https.createServer(httpsOptions, app).listen(port, () => {
            console.log(`Express https server listening on port ${port}`);
        });
    } else {
        if (process.env.ALLOW_HTTP === "true") {
            console.warn(
                "ALLOW_HTTP=true: TLS cert/key not found, starting HTTP server. " +
                "Set TLS_CERT_PATH and TLS_KEY_PATH for HTTPS."
            );
            http.createServer(app).listen(port, () => {
                console.log(`Express http server listening on port ${port}`);
            });
        } else {
            console.error(
                "TLS cert/key not found and ALLOW_HTTP is not enabled. " +
                "Provide TLS_CERT_PATH/TLS_KEY_PATH or set ALLOW_HTTP=true for development."
            );
            process.exit(1);
        }
    }

});
