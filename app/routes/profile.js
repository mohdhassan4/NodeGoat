const ProfileDAO = require("../data/profile-dao").ProfileDAO;
const ESAPI = require("node-esapi");
const {
    environmentalScripts
} = require("../../config/config");

/* The ProfileHandler must be constructed with a connected db */
function ProfileHandler(db) {
    "use strict";

    const profile = new ProfileDAO(db);

    this.displayProfile = (req, res, next) => {
        const {
            userId
        } = req.session;



        profile.getByUserId(parseInt(userId), (err, doc) => {
            if (err) return next(err);
            doc.userId = userId;

            // Validate website URL scheme - only allow http and https to prevent javascript: XSS
            if (doc.website) {
                const websiteLower = doc.website.trim().toLowerCase();
                if (!websiteLower.startsWith("http://") && !websiteLower.startsWith("https://")) {
                    doc.website = "";
                }
            }

            // Build a safe URL for the profile search link (URL context requires scheme validation)
            doc.firstNameSafeURLString = "https://www.google.com/search?q=" +
                encodeURIComponent(doc.firstName || "");

            return res.render("profile", {
                ...doc,
                environmentalScripts
            });
        });
    };

    this.handleProfileUpdate = (req, res, next) => {

        const {
            firstName,
            lastName,
            ssn,
            dob,
            address,
            bankAcc,
            bankRouting
        } = req.body;

        // Validate bankRouting: one or more digits followed by '#'
        const regexPattern = /^[0-9]+#$/;
        // Allow only numbers with a suffix of the letter #, for example: 'XXXXXX#'
        const testComplyWithRequirements = regexPattern.test(bankRouting);
        // if the regex test fails we do not allow saving
        if (testComplyWithRequirements !== true) {
            const firstNameSafeString = firstName;
            // Build a safe URL for the profile search link (URL context)
            const firstNameSafeURLString = "https://www.google.com/search?q=" +
                encodeURIComponent(firstName || "");
            return res.render("profile", {
                updateError: "Bank Routing number does not comply with requirements for format specified",
                firstNameSafeString,
                firstNameSafeURLString,
                lastName,
                ssn,
                dob,
                address,
                bankAcc,
                bankRouting,
                environmentalScripts
            });
        }

        const {
            userId
        } = req.session;

        profile.updateUser(
            parseInt(userId),
            firstName,
            lastName,
            ssn,
            dob,
            address,
            bankAcc,
            bankRouting,
            (err, user) => {

                if (err) return next(err);

                // WARN: Applying any sting specific methods here w/o checking type of inputs could lead to DoS by HPP
                //firstName = firstName.trim();
                user.updateSuccess = true;
                user.userId = userId;

                // Build a safe URL for the profile search link (URL context)
                user.firstNameSafeURLString = "https://www.google.com/search?q=" +
                    encodeURIComponent(user.firstName || "");

                return res.render("profile", {
                    ...user,
                    environmentalScripts
                });
            }
        );

    };

}

module.exports = ProfileHandler;
