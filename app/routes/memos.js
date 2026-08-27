const MemosDAO = require("../data/memos-dao").MemosDAO;
const {
    environmentalScripts
} = require("../../config/config");

function MemosHandler(db) {
    "use strict";

    const memosDAO = new MemosDAO(db);

    this.addMemos = (req, res, next) => {
        // Sanitize memo input to prevent stored XSS
        const sanitizedMemo = req.body.memo
            ? req.body.memo.replace(/[<>'"&]/g, (ch) => {
                const map = {"<": "&lt;", ">": "&gt;", "'": "&#x27;", "\"": "&quot;", "&": "&amp;"};
                return map[ch];
            })
            : "";

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
