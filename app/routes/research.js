const ResearchDAO = require("../data/research-dao").ResearchDAO;
const needle = require("needle");
const {
    environmentalScripts
} = require("../../config/config");

function ResearchHandler(db) {
    "use strict";

    const researchDAO = new ResearchDAO(db);

    this.displayResearch = (req, res) => {

        if (req.query.symbol) {
            // Fixed: Validate URL to prevent SSRF attacks
            const baseUrl = req.query.url || "";
            const allowedDomains = ["https://api.example.com", "https://finance.yahoo.com"];

            // Check if baseUrl starts with an allowed domain
            const isAllowed = allowedDomains.some(domain => baseUrl.startsWith(domain));

            if (!isAllowed) {
                res.writeHead(400, {"Content-Type": "text/html"});
                res.write("<h1>Error: Invalid or disallowed URL</h1>");
                return res.end();
            }

            const url = baseUrl + req.query.symbol;
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
