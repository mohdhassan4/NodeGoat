const MemosDAO = require("../data/memos-dao").MemosDAO;
const {
    environmentalScripts
} = require("../../config/config");

function MemosHandler(db) {
    "use strict";

    const memosDAO = new MemosDAO(db);

    this.addMemos = (req, res, next) => {
        // Input validation: ensure memo is a string and sanitize
        var memo = req.body.memo;
        if (typeof memo !== "string") {
            memo = "";
        }
        memo = memo.trim().substring(0, 10000);
        // Encode opening angle brackets to prevent storing raw HTML/XSS payloads
        // Preserves > for markdown blockquotes since > alone cannot open an HTML tag
        memo = memo.replace(/</g, "&lt;");

        memosDAO.insert(memo, (err, docs) => {
            if (err) return next(err);
            this.displayMemos(req, res, next);
        });
    };

    this.displayMemos = (req, res, next) => {

        const {
            userId
        } = req.session;

        memosDAO.getAllMemos((err, docs) => {
            if (err) return next(err);
            return res.render("memos", {
                memosList: docs,
                userId: userId,
                environmentalScripts
            });
        });
    };

}

module.exports = MemosHandler;
