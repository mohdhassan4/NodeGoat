const ResearchDAO = require("../data/research-dao").ResearchDAO;
const needle = require("needle");
const url = require("url");
const {
    environmentalScripts
} = require("../../config/config");

// Allowlisted base URLs for stock research
const ALLOWED_HOSTS = ["finance.yahoo.com"];

function isAllowedUrl(targetUrl) {
    try {
        const parsed = url.parse(targetUrl);
        if (parsed.protocol !== "https:") {
            return false;
        }
        if (!parsed.hostname || ALLOWED_HOSTS.indexOf(parsed.hostname) === -1) {
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

function ResearchHandler(db) {
    "use strict";

    const researchDAO = new ResearchDAO(db);

    this.displayResearch = (req, res) => {

        if (req.query.symbol) {
            // Validate symbol contains only alphanumeric characters
            const symbol = req.query.symbol;
            if (!/^[A-Za-z0-9.^=\-]+$/.test(symbol)) {
                res.writeHead(400, { "Content-Type": "text/html" });
                res.write("<h1>Invalid stock symbol.</h1>");
                return res.end();
            }

            const targetUrl = "https://finance.yahoo.com/quote/" + symbol;

            if (!isAllowedUrl(targetUrl)) {
                res.writeHead(403, { "Content-Type": "text/html" });
                res.write("<h1>Requested URL is not allowed.</h1>");
                return res.end();
            }

            return needle.get(targetUrl, (error, newResponse, body) => {
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
