const ProfileDAO = require("../data/profile-dao").ProfileDAO;
const ESAPI = require("node-esapi");
const {
    environmentalScripts
} = require("../../config/config");

/**
 * Validates that a URL uses only safe schemes (http or https).
 * Returns the URL if valid, or an empty string otherwise.
 */
function sanitizeUrl(url) {
    "use strict";
    if (!url || typeof url !== "string") {
        return "";
    }
    var trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }
    return "";
}

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

            // Encode firstName for HTML context (input value)
            doc.firstNameSafeString = ESAPI.encoder().encodeForHTML(
                doc.firstName || ""
            );

            // Build a safe Google search URL for the href context
            doc.firstNameSearchURL = "https://www.google.com/search?q=" +
                encodeURIComponent(doc.firstName || "");

            // Validate website URL scheme — only allow http/https
            doc.website = sanitizeUrl(doc.website);

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
            bankRouting,
            website
        } = req.body;

        // Validate website URL scheme — only allow http/https
        const safeWebsite = sanitizeUrl(website);

        // Fix for Section: ReDoS attack
        // The following regexPattern that is used to validate the bankRouting number is insecure and vulnerable to
        // catastrophic backtracking which means that specific type of input may cause it to consume all CPU resources
        // with an exponential time until it completes
        // --
        // The Fix: Instead of using greedy quantifiers the same regex will work if we omit the second quantifier +
        // const regexPattern = /([0-9]+)\#/;
        const regexPattern = /([0-9]+)+\#/;
        // Allow only numbers with a suffix of the letter #, for example: 'XXXXXX#'
        const testComplyWithRequirements = regexPattern.test(bankRouting);
        // if the regex test fails we do not allow saving
        if (testComplyWithRequirements !== true) {
            const firstNameSafeString = ESAPI.encoder().encodeForHTML(
                firstName || ""
            );
            const firstNameSearchURL = "https://www.google.com/search?q=" +
                encodeURIComponent(firstName || "");
            return res.render("profile", {
                updateError: "Bank Routing number does not comply" +
                    " with requirements for format specified",
                firstNameSafeString,
                firstNameSearchURL,
                lastName,
                ssn,
                dob,
                address,
                bankAcc,
                bankRouting,
                website: safeWebsite,
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
            safeWebsite,
            (err, user) => {

                if (err) return next(err);

                // WARN: Applying any sting specific methods here w/o checking type of inputs could lead to DoS by HPP
                //firstName = firstName.trim();
                user.updateSuccess = true;
                user.userId = userId;
                user.firstNameSafeString = ESAPI.encoder().encodeForHTML(
                    user.firstName || ""
                );
                user.firstNameSearchURL =
                    "https://www.google.com/search?q=" +
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
