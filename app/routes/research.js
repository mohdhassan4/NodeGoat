const ResearchDAO = require("../data/research-dao").ResearchDAO;
const needle = require("needle");
const ESAPI = require("node-esapi");
const net = require("net");
const dns = require("dns");
const {
    environmentalScripts
} = require("../../config/config");

function isPrivateIP(ip) {
    "use strict";

    // IPv4 private/reserved ranges
    var parts = ip.split(".");
    if (parts.length === 4) {
        var first = parseInt(parts[0], 10);
        var second = parseInt(parts[1], 10);
        if (first === 127) { return true; }
        if (first === 10) { return true; }
        if (first === 172 && second >= 16 && second <= 31) { return true; }
        if (first === 192 && second === 168) { return true; }
        if (first === 169 && second === 254) { return true; }
        if (first === 0) { return true; }
    }
    // IPv6 loopback and private
    var normalized = ip.toLowerCase();
    if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") {
        return true;
    }
    if (normalized.startsWith("fd") || normalized.startsWith("fc")) {
        return true;
    }
    if (normalized.startsWith("fe80")) {
        return true;
    }
    return false;
}

function validateUrl(urlString, callback) {
    "use strict";

    var parsed;
    try {
        parsed = new URL(urlString);
    } catch (e) {
        return callback(new Error("Invalid URL"));
    }

    // Only allow http and https schemes
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return callback(new Error("Only http and https protocols are allowed"));
    }

    var hostname = parsed.hostname;

    // Block common internal hostnames
    if (hostname === "localhost" || hostname === "metadata.google.internal") {
        return callback(new Error("Requests to internal hosts are not allowed"));
    }

    // If hostname is already an IP, check directly
    if (net.isIP(hostname)) {
        if (isPrivateIP(hostname)) {
            return callback(new Error("Requests to private IP addresses are not allowed"));
        }
        return callback(null, urlString);
    }

    // Resolve hostname and check resolved IP
    dns.lookup(hostname, function(err, address) {
        if (err) {
            return callback(new Error("Unable to resolve hostname"));
        }
        if (isPrivateIP(address)) {
            return callback(new Error("Requests to private IP addresses are not allowed"));
        }
        return callback(null, urlString);
    });
}

function ResearchHandler(db) {
    "use strict";

    const researchDAO = new ResearchDAO(db);

    this.displayResearch = (req, res) => {

        if (req.query.symbol) {
            const url = req.query.url + req.query.symbol;
            return validateUrl(url, (err) => {
                if (err) {
                    res.writeHead(400, {"Content-Type": "text/html"});
                    res.write("<h1>Invalid request: " +
                        ESAPI.encoder().encodeForHTML(err.message) + "</h1>");
                    return res.end();
                }
                return needle.get(url, (error, newResponse, body) => {
                    if (!error && newResponse.statusCode === 200) {
                        res.writeHead(200, {
                            "Content-Type": "text/html"
                        });
                    }
                    res.write("<h1>The following is the stock information you requested.</h1>\n\n");
                    res.write("\n\n");
                    if (body) {
                        res.write(ESAPI.encoder().encodeForHTML(body.toString()));
                    }
                    return res.end();
                });
            });
        }

        return res.render("research", {
            environmentalScripts
        });
    };

}

module.exports = ResearchHandler;
