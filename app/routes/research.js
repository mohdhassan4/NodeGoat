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
            const allowedHosts = [
                "finance.yahoo.com",
                "query1.finance.yahoo.com",
                "query2.finance.yahoo.com"
            ];
            const fullUrl = req.query.url + req.query.symbol;

            // Validate URL scheme and host against allowlist
            let parsedUrl;
            try {
                parsedUrl = new URL(fullUrl);
            } catch (e) {
                res.writeHead(400, {"Content-Type": "text/html"});
                return res.end("<h1>Invalid URL</h1>");
            }
            if (parsedUrl.protocol !== "https:" || !allowedHosts.includes(parsedUrl.hostname)) {
                res.writeHead(403, {"Content-Type": "text/html"});
                return res.end("<h1>Requested URL is not allowed</h1>");
            }

            return needle.get(fullUrl, (error, newResponse, body) => {
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
