const ResearchDAO = require("../data/research-dao").ResearchDAO;
const needle = require("needle");
const {
    environmentalScripts
} = require("../../config/config");
const {URL} = require("url");

const ALLOWED_HOSTS = [
    "finance.yahoo.com",
    "query1.finance.yahoo.com",
    "query2.finance.yahoo.com"
];

function isPrivateOrReservedIp(hostname) {
    "use strict";

    // IPv4 pattern
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);
    if (match) {
        const octets = [
            parseInt(match[1], 10),
            parseInt(match[2], 10),
            parseInt(match[3], 10),
            parseInt(match[4], 10)
        ];
        // 127.0.0.0/8 loopback
        if (octets[0] === 127) return true;
        // 10.0.0.0/8 private
        if (octets[0] === 10) return true;
        // 172.16.0.0/12 private
        if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
        // 192.168.0.0/16 private
        if (octets[0] === 192 && octets[1] === 168) return true;
        // 169.254.0.0/16 link-local / cloud metadata
        if (octets[0] === 169 && octets[1] === 254) return true;
        // 0.0.0.0
        if (octets[0] === 0) return true;
    }

    // IPv6 loopback or link-local
    if (hostname === "::1" || hostname === "[::1]") return true;
    if (hostname.startsWith("fe80") || hostname.startsWith("[fe80")) return true;

    return false;
}

function isUrlAllowed(urlString) {
    "use strict";

    var parsed;
    try {
        parsed = new URL(urlString);
    } catch (e) {
        return false;
    }

    // Only allow http and https schemes
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return false;
    }

    var hostname = parsed.hostname.toLowerCase();

    // Block localhost variants
    if (hostname === "localhost" || hostname === "localhost.localdomain") {
        return false;
    }

    // Block private/reserved IPs
    if (isPrivateOrReservedIp(hostname)) {
        return false;
    }

    // Allowlist of permitted hosts
    if (ALLOWED_HOSTS.indexOf(hostname) === -1) {
        return false;
    }

    return true;
}

function ResearchHandler(db) {
    "use strict";

    const researchDAO = new ResearchDAO(db);

    this.displayResearch = (req, res) => {

        if (req.query.symbol) {
            const url = req.query.url + req.query.symbol;

            if (!isUrlAllowed(url)) {
                res.writeHead(400, {"Content-Type": "text/html"});
                res.write("<h1>Request blocked: URL is not allowed.</h1>\n");
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
                    res.write(body);
                }
                return res.end();
            });
        }

        return res.render("research", {
            environmentalScripts
        });
    };

}

module.exports = ResearchHandler;
