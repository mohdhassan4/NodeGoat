/* The BenefitsDAO must be constructed with a connected database object */
function BenefitsDAO(db) {

    "use strict";

    /* If this constructor is called without the "new" operator, "this" points
     * to the global object. Log a warning and call it correctly. */
    if (false === (this instanceof BenefitsDAO)) {
        console.log("Warning: BenefitsDAO constructor called without 'new' operator");
        return new BenefitsDAO(db);
    }

    const usersCol = db.collection("users");

    this.getAllNonAdminUsers = callback => {
        usersCol.find({
            "isAdmin": {
                $ne: true
            }
        }).toArray((err, users) => callback(null, users));
    };

    this.updateBenefits = (userId, startDate, callback) => {
        // Validate and coerce startDate to a proper date string to prevent BSON injection
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (typeof startDate !== "string" || !dateRegex.test(startDate)) {
            return callback(new Error("Invalid date format for benefitStartDate"), null);
        }
        const parsedDate = new Date(startDate);
        if (isNaN(parsedDate.getTime())) {
            return callback(new Error("Invalid date format for benefitStartDate"), null);
        }
        const safeDateString = startDate;

        usersCol.update({
                _id: parseInt(userId)
            }, {
                $set: {
                    benefitStartDate: safeDateString
                }
            },
            (err, result) => {
                if (!err) {
                    console.log("Updated benefits");
                    return callback(null, result);
                }

                return callback(err, null);
            }
        );
    };
}

module.exports = { BenefitsDAO };
