const ResearchDAO = require("../data/research-dao").ResearchDAO;
const needle = require("needle");
const {
    environmentalScripts
} = require("../../config/config");

// Allowlist of permitted hostnames for outbound stock research requests
const ALLOWED_HOSTS = [
    "finance.yahoo.com",
    "www.finance.yahoo.com",
    "query1.finance.yahoo.com",
    "query2.finance.yahoo.com"
];

const ALLOWED_SCHEMES = ["https:", "http:"];

// Block requests to private/internal network addresses
function isPrivateHost(hostname) {
    "use strict";

    // Reject localhost variants
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
        return true;
    }

    // Reject link-local, private ranges, and metadata endpoints
    const parts = hostname.split(".");
    if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) {
        const first = parseInt(parts[0], 10);
        const second = parseInt(parts[1], 10);
        if (first === 10) return true;
        if (first === 172 && second >= 16 && second <= 31) return true;
        if (first === 192 && second === 168) return true;
        if (first === 169 && second === 254) return true;
        if (first === 127) return true;
        if (first === 0) return true;
    }

    return false;
}

function isAllowedUrl(rawUrl) {
    "use strict";

    var parsed;
    try {
        parsed = new URL(rawUrl);
    } catch (e) {
        return false;
    }

    if (ALLOWED_SCHEMES.indexOf(parsed.protocol) === -1) {
        return false;
    }

    if (isPrivateHost(parsed.hostname)) {
        return false;
    }

    if (ALLOWED_HOSTS.indexOf(parsed.hostname) === -1) {
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

            if (!isAllowedUrl(url)) {
                res.writeHead(403, {"Content-Type": "text/html"});
                res.write("<h1>Forbidden</h1>\n");
                res.write("<p>The requested URL is not in the list of allowed hosts.</p>");
                return res.end();
            }

            return needle.get(url, (error, newResponse, body) => {
                if (!error && newResponse.statusCode === 200) {
                    res.writeHead(200, {
                        "Content-Type": "text/plain"
                    });
                }
                res.write("The following is the stock information you requested.\n\n");
                res.write("\n\n");
                if (body) {
                    res.write(typeof body === "string" ? body : String(body));
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
