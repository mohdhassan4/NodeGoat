const {
    BenefitsDAO
} = require("../data/benefits-dao");
const {
    UserDAO
} = require("../data/user-dao");
const {
    environmentalScripts
} = require("../../config/config");

function BenefitsHandler(db) {
    "use strict";

    const benefitsDAO = new BenefitsDAO(db);
    const userDAO = new UserDAO(db);

    this.displayBenefits = (req, res, next) => {

        benefitsDAO.getAllNonAdminUsers((error, users) => {

            if (error) return next(error);

            return res.render("benefits", {
                users,
                user: {
                    isAdmin: true
                },
                environmentalScripts
            });
        });
    };

    this.updateBenefits = (req, res, next) => {
        // Verify the requesting user has admin privileges
        const sessionUserId = req.session.userId;
        if (!sessionUserId) {
            return res.redirect("/login");
        }

        userDAO.getUserById(sessionUserId, (err, currentUser) => {
            if (err) return next(err);
            if (!currentUser || !currentUser.isAdmin) {
                return res.redirect("/login");
            }

            const {
                userId,
                benefitStartDate
            } = req.body;

            benefitsDAO.updateBenefits(userId, benefitStartDate, (error) => {

                if (error) return next(error);

                benefitsDAO.getAllNonAdminUsers((error, users) => {
                    if (error) return next(error);

                    const data = {
                        users,
                        user: {
                            isAdmin: true
                        },
                        updateSuccess: true,
                        environmentalScripts
                    };

                    return res.render("benefits", data);
                });
            });
        });
    };
}

module.exports = BenefitsHandler;
