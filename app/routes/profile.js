const ProfileDAO = require("../data/profile-dao").ProfileDAO;
const {
    environmentalScripts
} = require("../../config/config");

/* The ProfileHandler must be constructed with a connected db */
function ProfileHandler(db) {
    "use strict";

    const profile = new ProfileDAO(db);

    // Build a safe Google search URL from a name, allowing only safe schemes in href context
    function buildSafeProfileSearchURL(name) {
        if (!name || typeof name !== "string") {
            return "https://www.google.com/search?q=";
        }
        return "https://www.google.com/search?q=" + encodeURIComponent(name);
    }

    this.displayProfile = (req, res, next) => {
        const {
            userId
        } = req.session;



        profile.getByUserId(parseInt(userId), (err, doc) => {
            if (err) return next(err);
            doc.userId = userId;

            // Swig autoescape is now enabled globally, so template variables are
            // automatically HTML-encoded. No manual ESAPI encoding needed here.

            // Build a safe URL for the href context (HTML encoding alone does not
            // neutralize javascript: URIs in href attributes).
            var firstNameSafeURLString = buildSafeProfileSearchURL(doc.firstName);

            return res.render("profile", {
                ...doc,
                firstNameSafeURLString,
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

        // Fix for Section: ReDoS attack
        // The following regexPattern that is used to validate the bankRouting number is insecure and vulnerable to
        // catastrophic backtracking which means that specific type of input may cause it to consume all CPU resources
        // with an exponential time until it completes
        // --
        // The Fix: Instead of using greedy quantifiers the same regex will work if we omit the second quantifier +
        const regexPattern = /([0-9]+)\#/;
        // Allow only numbers with a suffix of the letter #, for example: 'XXXXXX#'
        const testComplyWithRequirements = regexPattern.test(bankRouting);
        // if the regex test fails we do not allow saving
        if (testComplyWithRequirements !== true) {
            const firstNameSafeString = firstName;
            var firstNameSafeURLString = buildSafeProfileSearchURL(firstName);
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

                var firstNameSafeURLString = buildSafeProfileSearchURL(user.firstName);

                return res.render("profile", {
                    ...user,
                    firstNameSafeURLString,
                    environmentalScripts
                });
            }
        );

    };

}

module.exports = ProfileHandler;
