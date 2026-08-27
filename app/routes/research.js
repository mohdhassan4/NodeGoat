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
            const url = req.query.url + req.query.symbol;

            // Validate URL scheme - only allow http and https
            let parsedUrl;
            try {
                parsedUrl = new URL(url);
            } catch (e) {
                return res.status(400).end("Invalid URL");
            }
            if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
                return res.status(400).end("Only http and https URLs are allowed");
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
