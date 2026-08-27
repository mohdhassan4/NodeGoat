const SessionHandler = require("./session");
const ProfileHandler = require("./profile");
const BenefitsHandler = require("./benefits");
const ContributionsHandler = require("./contributions");
const AllocationsHandler = require("./allocations");
const MemosHandler = require("./memos");
const ResearchHandler = require("./research");
const tutorialRouter = require("./tutorial");
const ErrorHandler = require("./error").errorHandler;

const index = (app, db) => {

    "use strict";

    const sessionHandler = new SessionHandler(db);
    const profileHandler = new ProfileHandler(db);
    const benefitsHandler = new BenefitsHandler(db);
    const contributionsHandler = new ContributionsHandler(db);
    const allocationsHandler = new AllocationsHandler(db);
    const memosHandler = new MemosHandler(db);
    const researchHandler = new ResearchHandler(db);

    // Middleware to check if a user is logged in
    const isLoggedIn = sessionHandler.isLoggedInMiddleware;

    //Middleware to check if user has admin rights
    const isAdmin = sessionHandler.isAdminUserMiddleware;

    // Rate limiting for sensitive endpoints (brute-force protection)
    const rateLimitStore = {};
    const rateLimiter = function(maxAttempts, windowMs) {
        return function(req, res, next) {
            const key = req.ip + ":" + req.path;
            const now = Date.now();
            if (!rateLimitStore[key] || now - rateLimitStore[key].start > windowMs) {
                rateLimitStore[key] = { count: 1, start: now };
            } else {
                rateLimitStore[key].count++;
            }
            if (rateLimitStore[key].count > maxAttempts) {
                return res.status(429).send("Too many requests, please try again later.");
            }
            next();
        };
    };
    const sensitiveRateLimit = rateLimiter(10, 15 * 60 * 1000);

    // The main page of the app
    app.get("/", sessionHandler.displayWelcomePage);

    // Login form
    app.get("/login", sessionHandler.displayLoginPage);
    app.post("/login", sensitiveRateLimit, sessionHandler.handleLoginRequest);

    // Signup form
    app.get("/signup", sessionHandler.displaySignupPage);
    app.post("/signup", sensitiveRateLimit, sessionHandler.handleSignup);

    // Logout page
    app.get("/logout", sessionHandler.displayLogoutPage);

    // The main page of the app
    app.get("/dashboard", isLoggedIn, sessionHandler.displayWelcomePage);

    // Profile page
    app.get("/profile", isLoggedIn, profileHandler.displayProfile);
    app.post("/profile", isLoggedIn, profileHandler.handleProfileUpdate);

    // Account deletion (GDPR Art. 17 - Right to Erasure)
    app.delete("/account", isLoggedIn, (req, res, next) => {
        const userId = parseInt(req.session.userId);

        db.collection("users").remove({ _id: userId }, (err) => {
            if (err) return next(err);
            db.collection("allocations").remove({ userId: userId }, (err) => {
                if (err) return next(err);
                db.collection("contributions").remove({ userId: userId }, (err) => {
                    if (err) return next(err);
                    req.session.destroy(() => {
                        res.clearCookie("connect.sid");
                        return res.status(200).json({
                            success: true,
                            message: "Account and associated data deleted"
                        });
                    });
                });
            });
        });
    });

    // Contributions Page
    app.get("/contributions", isLoggedIn, contributionsHandler.displayContributions);
    app.post("/contributions", isLoggedIn, contributionsHandler.handleContributionsUpdate);

    // Benefits Page
    app.get("/benefits", isLoggedIn, benefitsHandler.displayBenefits);
    app.post("/benefits", isLoggedIn, benefitsHandler.updateBenefits);
    /* Fix for A7 - checks user role to implement  Function Level Access Control
     app.get("/benefits", isLoggedIn, isAdmin, benefitsHandler.displayBenefits);
     app.post("/benefits", isLoggedIn, isAdmin, benefitsHandler.updateBenefits);
     */

    // Allocations Page
    app.get("/allocations/:userId", isLoggedIn, allocationsHandler.displayAllocations);

    // Memos Page
    app.get("/memos", isLoggedIn, memosHandler.displayMemos);
    app.post("/memos", isLoggedIn, memosHandler.addMemos);

    // Handle redirect for learning resources link
    app.get("/learn", isLoggedIn, (req, res) => {
        const url = req.query.url;
        const allowedDomains = ["www.khanacademy.org"];

        // Allow safe relative paths (starting with / but not // or /\)
        if (url && url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) {
            return res.redirect(url);
        }

        // Allow trusted external domains
        try {
            const parsed = new URL(url);
            if (allowedDomains.indexOf(parsed.hostname) !== -1) {
                return res.redirect(url);
            }
        } catch (e) {
            // Invalid URL falls through to safe default
        }

        // Default redirect for unrecognized or missing URLs
        return res.redirect("/dashboard");
    });

    // Research Page
    app.get("/research", isLoggedIn, researchHandler.displayResearch);

    // Mount tutorial router
    app.use("/tutorial", tutorialRouter);

    // Error handling middleware
    app.use(ErrorHandler);
};

module.exports = index;
