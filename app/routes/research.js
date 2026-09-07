const ResearchDAO = require("../data/research-dao").ResearchDAO;
const needle = require("needle");
const ESAPI = require("node-esapi");
const {
    environmentalScripts
} = require("../../config/config");

function ResearchHandler(db) {
    "use strict";

    const researchDAO = new ResearchDAO(db);

    // Allowlist of permitted base URLs for stock research
    const ALLOWED_RESEARCH_URLS = [
        "https://finance.yahoo.com/quote/"
    ];

    const isUrlAllowed = (urlString) => {
        try {
            const parsedUrl = new URL(urlString);

            // Only allow HTTPS protocol
            if (parsedUrl.protocol !== "https:") {
                return false;
            }

            // Check if URL starts with any allowed base URL
            const isAllowed = ALLOWED_RESEARCH_URLS.some(allowedUrl => {
                return urlString.startsWith(allowedUrl);
            });

            if (!isAllowed) {
                return false;
            }

            // Block private IP ranges and localhost
            const hostname = parsedUrl.hostname;
            if (hostname === "localhost" ||
                hostname === "127.0.0.1" ||
                hostname.startsWith("10.") ||
                hostname.startsWith("192.168.") ||
                hostname.startsWith("172.16.") ||
                hostname.startsWith("172.17.") ||
                hostname.startsWith("172.18.") ||
                hostname.startsWith("172.19.") ||
                hostname.startsWith("172.20.") ||
                hostname.startsWith("172.21.") ||
                hostname.startsWith("172.22.") ||
                hostname.startsWith("172.23.") ||
                hostname.startsWith("172.24.") ||
                hostname.startsWith("172.25.") ||
                hostname.startsWith("172.26.") ||
                hostname.startsWith("172.27.") ||
                hostname.startsWith("172.28.") ||
                hostname.startsWith("172.29.") ||
                hostname.startsWith("172.30.") ||
                hostname.startsWith("172.31.") ||
                hostname.startsWith("169.254.") || // AWS metadata
                hostname === "[::1]") { // IPv6 localhost
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    };

    this.displayResearch = (req, res) => {

        if (req.query.symbol) {
            const url = req.query.url + req.query.symbol;

            // Validate URL against allowlist to prevent SSRF
            if (!isUrlAllowed(url)) {
                res.writeHead(400, {
                    "Content-Type": "text/html"
                });
                res.write("<h1>Invalid URL. Only allowed research sources are permitted.</h1>");
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
                    res.write(ESAPI.encoder().encodeForHTML(body));
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
