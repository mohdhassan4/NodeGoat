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

router.get("/:page", (req, res) => {
    "use strict";
    const page = req.params.page;
    switch (page) {
    case "a1":
        return res.render("tutorial/a1", { environmentalScripts });
    case "a2":
        return res.render("tutorial/a2", { environmentalScripts });
    case "a3":
        return res.render("tutorial/a3", { environmentalScripts });
    case "a4":
        return res.render("tutorial/a4", { environmentalScripts });
    case "a5":
        return res.render("tutorial/a5", { environmentalScripts });
    case "a6":
        return res.render("tutorial/a6", { environmentalScripts });
    case "a7":
        return res.render("tutorial/a7", { environmentalScripts });
    case "a8":
        return res.render("tutorial/a8", { environmentalScripts });
    case "a9":
        return res.render("tutorial/a9", { environmentalScripts });
    case "a10":
        return res.render("tutorial/a10", { environmentalScripts });
    case "redos":
        return res.render("tutorial/redos", { environmentalScripts });
    case "ssrf":
        return res.render("tutorial/ssrf", { environmentalScripts });
    default:
        return res.status(404).send("Not found");
    }
});

module.exports = router;
