const {
    BenefitsDAO
} = require("../data/benefits-dao");
const UserDAO = require("../data/user-dao").UserDAO;
const {
    environmentalScripts
} = require("../../config/config");

function BenefitsHandler(db) {
    "use strict";

    const benefitsDAO = new BenefitsDAO(db);
    const userDAO = new UserDAO(db);

    this.displayBenefits = (req, res, next) => {
        const {
            userId
        } = req.session;

        userDAO.getUserById(userId, (error, user) => {
            if (error) return next(error);

            benefitsDAO.getAllNonAdminUsers((error, users) => {

                if (error) return next(error);

                return res.render("benefits", {
                    users,
                    user: {
                        isAdmin: user.isAdmin
                    },
                    environmentalScripts
                });
            });
        });
    };

    this.updateBenefits = (req, res, next) => {
        const {
            userId,
            benefitStartDate
        } = req.body;
        const sessionUserId = req.session.userId;

        userDAO.getUserById(sessionUserId, (error, user) => {
            if (error) return next(error);

            benefitsDAO.updateBenefits(userId, benefitStartDate, (error) => {

                if (error) return next(error);

                benefitsDAO.getAllNonAdminUsers((error, users) => {
                    if (error) return next(error);

                    const data = {
                        users,
                        user: {
                            isAdmin: user.isAdmin
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
