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
const marked = require("marked");
//const nosniff = require('dont-sniff-mimetype');
const app = express(); // Web framework to handle routing requests
const routes = require("./app/routes");
const { port, db, cookieSecret } = require("./config/config"); // Application config properties
/*
// Fix for A6-Sensitive Data Exposure
// Load keys for establishing secure HTTPS connection
const fs = require("fs");
const https = require("https");
const path = require("path");
const httpsOptions = {
    key: fs.readFileSync(path.resolve(__dirname, "./artifacts/cert/server.key")),
    cert: fs.readFileSync(path.resolve(__dirname, "./artifacts/cert/server.crt"))
};
*/

MongoClient.connect(db, (err, db) => {
    if (err) {
        console.log("Error: DB: connect");
        console.log(err);
        process.exit(1);
    }
    console.log(`Connected to the database`);

    // Fix for A5 - Security MisConfig
    // Enable helmet to set security headers (X-Frame-Options, X-Content-Type-Options,
    // X-XSS-Protection, Strict-Transport-Security, etc.)
    app.use(helmet());
    app.disable("x-powered-by");

    // Fix for A6 - Sensitive Data Exposure
    // Enforce HTTPS in production by redirecting plaintext requests
    // when running behind a TLS-terminating reverse proxy
    app.set("trust proxy", 1);
    app.use((req, res, next) => {
        if (process.env.NODE_ENV === "production" &&
            req.headers["x-forwarded-proto"] !== "https") {
            return res.redirect(301, "https://" + req.headers.host + req.url);
        }
        next();
    });

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
        key: "sessionId",
        // Fix for A3 - XSS and A5 - Security MisConfig
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
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
    // Fix for A9 - Insecure Dependencies
    marked.setOptions({
        sanitize: true
    });

    // Fix for A3 - XSS: Sanitize marked output to prevent stored XSS
    // The sanitize option in marked is deprecated and has known bypasses,
    // so we add output sanitization to strip dangerous HTML patterns.
    const safeMarked = function(text) {
        if (!text) return "";
        var html = marked(text);
        // Remove script tags and their content
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
        // Remove event handler attributes (onclick, onerror, onload, etc.)
        html = html.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");
        // Neutralize javascript:, vbscript:, and data: protocol URLs
        html = html.replace(/(href|src|action)\s*=\s*["']\s*(javascript|vbscript|data)\s*:/gi,
            "$1=\"#sanitized:");
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

    // Insecure HTTP connection
    http.createServer(app).listen(port, () => {
        console.log(`Express http server listening on port ${port}`);
    });

    /*
    // Fix for A6-Sensitive Data Exposure
    // Use secure HTTPS protocol
    https.createServer(httpsOptions, app).listen(port, () => {
        console.log(`Express http server listening on port ${port}`);
    });
    */

});
