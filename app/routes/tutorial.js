const express = require("express");
const {
    environmentalScripts
} = require("../../config/config");

const router = express.Router();

router.get("/", (req, res) => {
    "use strict";
    return res.render("tutorial/a1", {
        environmentalScripts
    });
});

const allowedPages = new Set([
    "a1",
    "a2",
    "a3",
    "a4",
    "a5",
    "a6",
    "a7",
    "a8",
    "a9",
    "a10",
    "redos",
    "ssrf"
]);

router.get("/:page", (req, res) => {
    "use strict";
    const page = req.params.page;
    if (!allowedPages.has(page)) {
        return res.status(404).send("Not Found");
    }
    return res.render("tutorial/" + page, {
        environmentalScripts
    });
});

module.exports = router;
