const AllocationsDAO = require("../data/allocations-dao").AllocationsDAO;
const {
    environmentalScripts
} = require("../../config/config");

function AllocationsHandler(db) {
    "use strict";

    const allocationsDAO = new AllocationsDAO(db);

    this.displayAllocations = (req, res, next) => {
        // Fix for A4 Insecure DOR - take user id from session instead of from URL param
        const userId = req.session.userId;

        // Authorization check: reject if URL userId does not match session userId
        if (req.params.userId !== String(userId)) {
            return res.status(403).send("Forbidden: You are not authorized to view this resource");
        }

        const {
            threshold
        } = req.query;

        allocationsDAO.getByUserIdAndThreshold(userId, threshold, (err, allocations) => {
            if (err) return next(err);
            return res.render("allocations", {
                userId,
                allocations,
                environmentalScripts
            });
        });
    };
}

module.exports = AllocationsHandler;
