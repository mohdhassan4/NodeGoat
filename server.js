"use strict";

const express = require("express");
const favicon = require("serve-favicon");
const bodyParser = require("body-parser");
const session = require("express-session");
const csrf = require("csurf");
const consolidate = require("consolidate"); // Templating library adapter for Express
const swig = require("swig");
const helmet = require("helmet");
const MongoClient = require("mongodb").MongoClient; // Driver for connecting to MongoDB
const http = require("http");
const fs = require("fs");
const https = require("https");
const path = require("path");
const marked = require("marked");
const nosniff = require("dont-sniff-mimetype");
const app = express(); // Web framework to handle routing requests
const routes = require("./app/routes");
const { port, db, cookieSecret } = require("./config/config"); // Application config properties

// Fix for A6-Sensitive Data Exposure
// Load keys for establishing secure HTTPS connection
const tlsKeyPath = process.env.TLS_KEY_PATH ||
    path.resolve(__dirname, "./artifacts/cert/server.key");
const tlsCertPath = process.env.TLS_CERT_PATH ||
    path.resolve(__dirname, "./artifacts/cert/server.crt");
const httpsOptions = (fs.existsSync(tlsKeyPath) && fs.existsSync(tlsCertPath))
    ? { key: fs.readFileSync(tlsKeyPath), cert: fs.readFileSync(tlsCertPath) }
    : null;

MongoClient.connect(db, (err, db) => {
    if (err) {
        console.log("Error: DB: connect");
        console.log(err);
        process.exit(1);
    }
    console.log(`Connected to the database`);

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
        saveUninitialized: false,
        resave: false,
        // Fix for A5 - Security MisConfig
        // Use generic cookie name
        key: "sessionId",
        // Fix for A3 - XSS
        cookie: {
            httpOnly: true,
            // Only send cookie over HTTPS when TLS certificates are available
            secure: !!httpsOptions,
            maxAge: 3600000 // 1 hour
        }
    }));

    // Fix for A8 - CSRF
    // Enable Express csrf protection
    app.use(csrf());
    // Make csrf token available in templates
    app.use((req, res, next) => {
        res.locals.csrftoken = req.csrfToken();
        next();
    });

    // Register templating engine
    app.engine(".html", consolidate.swig);
    app.set("view engine", "html");
    app.set("views", `${__dirname}/app/views`);
    // Fix for A5 - Security MisConfig
    // TODO: make sure assets are declared before app.use(session())
    app.use(express.static(`${__dirname}/app/assets`));


    // Initializing marked library
    // Fix for A9 - Insecure Dependencies (upgraded to marked 4.x)

    // Fix for A3 - XSS: sanitize marked output to prevent stored XSS
    // Custom post-processing sanitizer (marked 4.x removed the built-in sanitize option)
    const safeMarked = function(text) {
        if (!text) return "";
        var html = marked.parse(text);
        // Remove all tags not in the allowlist of safe markdown-generated tags
        var allowedTags = /^\/?(p|br|strong|em|b|i|u|a|ul|ol|li|h[1-6]|blockquote|code|pre|hr|table|thead|tbody|tr|th|td|img|del|sup|sub|dd|dt|dl)$/i;
        html = html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?>/g, function(match, tagName) {
            if (!allowedTags.test(tagName)) {
                return "";
            }
            // For closing tags, return as-is
            if (match.indexOf("</") === 0) {
                return match;
            }
            // Strip event handler attributes (on*)
            var cleaned = match.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
            // Strip dangerous URI schemes in href and src attributes
            cleaned = cleaned.replace(/(href|src)\s*=\s*"?\s*(javascript|vbscript|data)\s*:[^"]*"/gi, "$1=\"#\"");
            cleaned = cleaned.replace(/(href|src)\s*=\s*'?\s*(javascript|vbscript|data)\s*:[^']*'/gi, "$1='#'");
            return cleaned;
        });
        return html;
    };
    app.locals.marked = safeMarked;

    // Application routes
    routes(app, db);

    // Template system setup
    // Fix for A3 - XSS, enable auto escaping
    swig.setDefaults({
        autoescape: true
    });

    // Fix for A6-Sensitive Data Exposure
    // Use secure HTTPS protocol when certificates are available
    if (httpsOptions) {
        https.createServer(httpsOptions, app).listen(port, () => {
            console.log(`Express https server listening on port ${port}`);
        });
    } else {
        console.warn("WARNING: TLS certificates not found at configured paths.");
        console.warn("Set TLS_KEY_PATH and TLS_CERT_PATH to enable HTTPS.");
        http.createServer(app).listen(port, () => {
            console.log(`Express http server listening on port ${port}`);
        });
    }

});
