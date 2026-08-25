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
const crypto = require("crypto");
const https = require("https");
const fs = require("fs");
const path = require("path");
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

// Generate an ephemeral self-signed TLS certificate using Node built-ins
function generateSelfSignedCert() {
    var keyPair = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "der" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" }
    });
    var certPem = buildSelfSignedCert(keyPair);
    return { key: keyPair.privateKey, cert: certPem };
}

function buildSelfSignedCert(keyPair) {
    var privateKey = crypto.createPrivateKey(keyPair.privateKey);
    var publicDer = keyPair.publicKey; // Buffer in DER format

    var serial = crypto.randomBytes(8);
    var now = new Date();
    var notBefore = formatAsn1Time(now);
    var expiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    var notAfter = formatAsn1Time(expiry);

    // Subject/Issuer: CN=localhost
    var cnOid = derOid("550403");
    var cnAttr = derSequence([cnOid, derUtf8("localhost")]);
    var name = derSequence([derSet([cnAttr])]);
    var validity = derSequence([notBefore, notAfter]);

    // Version: v3(2) with explicit [0] tag
    var version = derTag(0xa0, derTag(0x02, Buffer.from([0x02])));
    var serialNum = derInteger(serial);

    // sha256WithRSAEncryption: OID 1.2.840.113549.1.1.11
    var sigAlgOid = derOid("2a864886f70d01010b");
    var sigAlg = derSequence([sigAlgOid, Buffer.from("0500", "hex")]);

    var tbs = derSequence([
        version, serialNum, sigAlg, name, validity,
        name, publicDer
    ]);

    var signer = crypto.createSign("SHA256");
    signer.update(tbs);
    var signature = signer.sign(privateKey);
    var sigBits = Buffer.concat([Buffer.from([0x00]), signature]);

    var cert = derSequence([tbs, sigAlg, derBitString(sigBits)]);

    var pem = "-----BEGIN CERTIFICATE-----\n" +
        cert.toString("base64").match(/[A-Za-z0-9+/=]{1,64}/g).join("\n") +
        "\n-----END CERTIFICATE-----\n";
    return pem;
}

function derTag(tag, content) {
    var len = content.length;
    var header;
    if (len < 128) {
        header = Buffer.from([tag, len]);
    } else if (len < 256) {
        header = Buffer.from([tag, 0x81, len]);
    } else if (len < 65536) {
        header = Buffer.from([tag, 0x82, len >> 8, len & 0xff]);
    } else {
        header = Buffer.from([
            tag, 0x83,
            (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff
        ]);
    }
    return Buffer.concat([header, content]);
}

function derSequence(items) {
    return derTag(0x30, Buffer.concat(items));
}

function derSet(items) {
    return derTag(0x31, Buffer.concat(items));
}

function derInteger(buf) {
    var content = (buf[0] & 0x80) ?
        Buffer.concat([Buffer.from([0x00]), buf]) : buf;
    return derTag(0x02, content);
}

function derBitString(content) {
    return derTag(0x03, content);
}

function derOid(hexValue) {
    return derTag(0x06, Buffer.from(hexValue, "hex"));
}

function derUtf8(str) {
    return derTag(0x0c, Buffer.from(str, "utf8"));
}

function formatAsn1Time(date) {
    var y = date.getUTCFullYear().toString().slice(2);
    var mo = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    var d = date.getUTCDate().toString().padStart(2, "0");
    var h = date.getUTCHours().toString().padStart(2, "0");
    var mi = date.getUTCMinutes().toString().padStart(2, "0");
    var sec = date.getUTCSeconds().toString().padStart(2, "0");
    var s = y + mo + d + h + mi + sec + "Z";
    return derTag(0x17, Buffer.from(s, "ascii"));
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
        // Both mandatory in Express v4
        saveUninitialized: true,
        resave: true,
        cookie: {
            httpOnly: true
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

    // Use HTTPS with file-based certs or a self-signed certificate
    var httpsOptions;
    var tlsKeyPath = path.join(__dirname, "artifacts", "cert", "server.key");
    var tlsCertPath = path.join(__dirname, "artifacts", "cert", "server.crt");

    if (fs.existsSync(tlsKeyPath) && fs.existsSync(tlsCertPath)) {
        httpsOptions = {
            key: fs.readFileSync(tlsKeyPath),
            cert: fs.readFileSync(tlsCertPath)
        };
    } else {
        // Generate ephemeral self-signed cert for development
        var ephemeral = generateSelfSignedCert();
        httpsOptions = {
            key: ephemeral.key,
            cert: ephemeral.cert
        };
        console.warn(
            "Using auto-generated self-signed certificate."
        );
    }

    https.createServer(httpsOptions, app).listen(port, () => {
        console.log(`Express https server listening on port ${port}`);
    });

});
