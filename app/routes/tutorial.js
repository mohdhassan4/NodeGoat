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

const templates = {
    "a1": "tutorial/a1",
    "a2": "tutorial/a2",
    "a3": "tutorial/a3",
    "a4": "tutorial/a4",
    "a5": "tutorial/a5",
    "a6": "tutorial/a6",
    "a7": "tutorial/a7",
    "a8": "tutorial/a8",
    "a9": "tutorial/a9",
    "a10": "tutorial/a10",
    "redos": "tutorial/redos",
    "ssrf": "tutorial/ssrf"
};

router.get("/:page", (req, res) => {
    "use strict";
    const page = req.params.page;
    const templatePath = templates[page];
    if (!templatePath) {
        return res.status(404).send("Not found");
    }
    return res.render(templatePath, {
        environmentalScripts
    });
});

module.exports = router;
