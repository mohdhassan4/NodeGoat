const ResearchDAO = require("../data/research-dao").ResearchDAO;
const needle = require("needle");
const {
    environmentalScripts
} = require("../../config/config");

// Allowlist of trusted hosts for outbound research requests
const ALLOWED_HOSTS = [
    "finance.yahoo.com"
];

const ALLOWED_SCHEMES = ["https:"];

function isPrivateIp(hostname) {
    "use strict";

    // Block private/internal/link-local IP ranges
    const privateRanges = [
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2\d|3[01])\./,
        /^192\.168\./,
        /^169\.254\./,
        /^0\./,
        /^::1$/,
        /^fc00:/i,
        /^fd/i,
        /^fe80:/i,
        /^localhost$/i
    ];
    return privateRanges.some((range) => range.test(hostname));
}

function isAllowedUrl(targetUrl) {
    "use strict";

    let parsed;
    try {
        parsed = new URL(targetUrl);
    } catch (e) {
        return false;
    }

    if (!ALLOWED_SCHEMES.includes(parsed.protocol)) {
        return false;
    }

    if (isPrivateIp(parsed.hostname)) {
        return false;
    }

    if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
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
                res.writeHead(403, {
                    "Content-Type": "text/html"
                });
                res.write("<h1>Forbidden</h1>\n");
                res.write("<p>The requested research URL is not allowed.</p>");
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
