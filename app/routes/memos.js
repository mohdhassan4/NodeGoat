const MemosDAO = require("../data/memos-dao").MemosDAO;
const ESAPI = require("node-esapi");
const {
    environmentalScripts
} = require("../../config/config");

function MemosHandler(db) {
    "use strict";

    const memosDAO = new MemosDAO(db);

    this.addMemos = (req, res, next) => {
        // Sanitize memo input to prevent stored XSS while preserving markdown
        // Remove dangerous HTML tags and attributes
        let sanitizedMemo = req.body.memo || "";
        sanitizedMemo = sanitizedMemo.replace(/<script[^>]*>.*?<\/script>/gi, "");
        sanitizedMemo = sanitizedMemo.replace(/<iframe[^>]*>.*?<\/iframe>/gi, "");
        sanitizedMemo = sanitizedMemo.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
        sanitizedMemo = sanitizedMemo.replace(/javascript:/gi, "");

        memosDAO.insert(sanitizedMemo, (err, docs) => {
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
