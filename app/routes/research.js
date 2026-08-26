const ResearchDAO = require("../data/research-dao").ResearchDAO;
const needle = require("needle");
const ESAPI = require("node-esapi");
const {
    environmentalScripts
} = require("../../config/config");

const ALLOWED_BASE_URLS = [
    "https://finance.yahoo.com/quote/"
];

function ResearchHandler(db) {
    "use strict";

    const researchDAO = new ResearchDAO(db);

    this.displayResearch = (req, res) => {

        if (req.query.symbol) {
            const baseUrl = req.query.url;
            const symbol = req.query.symbol;

            if (!ALLOWED_BASE_URLS.includes(baseUrl)) {
                res.writeHead(400, {"Content-Type": "text/html"});
                return res.end(
                    "<h1>Invalid request: URL not allowed.</h1>"
                );
            }

            if (!/^[A-Za-z0-9._^-]{1,10}$/.test(symbol)) {
                res.writeHead(400, {"Content-Type": "text/html"});
                return res.end(
                    "<h1>Invalid request: invalid stock symbol.</h1>"
                );
            }

            const url = baseUrl + encodeURIComponent(symbol);
            return needle.get(url, (error, newResponse, body) => {
                if (!error && newResponse.statusCode === 200) {
                    res.writeHead(200, {
                        "Content-Type": "text/html"
                    });
                }
                res.write("<h1>The following is the stock information you requested.</h1>\n\n");
                res.write("\n\n");
                if (body) {
                    res.write(ESAPI.encoder().encodeForHTML(String(body)));
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
