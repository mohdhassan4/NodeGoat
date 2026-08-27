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

    // Rate limiting middleware for sensitive endpoints (login, signup)
    const rateLimitMap = new Map();
    const rateLimitWindowMs = 15 * 60 * 1000; // 15 minutes
    const rateLimitMaxAttempts = 5;

    const sensitiveEndpointLimiter = (req, res, next) => {
        var ip = req.ip || req.connection.remoteAddress;
        var now = Date.now();
        var key = ip + ":" + req.path;
        var entry = rateLimitMap.get(key);

        if (!entry || (now - entry.startTime) > rateLimitWindowMs) {
            rateLimitMap.set(key, {count: 1, startTime: now});
            return next();
        }

        if (entry.count >= rateLimitMaxAttempts) {
            res.status(429);
            return res.end("Too many requests. Please try again later.");
        }

        entry.count += 1;
        return next();
    };

    // The main page of the app
    app.get("/", sessionHandler.displayWelcomePage);

    // Login form
    app.get("/login", sessionHandler.displayLoginPage);
    app.post("/login", sensitiveEndpointLimiter, sessionHandler.handleLoginRequest);

    // Signup form
    app.get("/signup", sessionHandler.displaySignupPage);
    app.post("/signup", sensitiveEndpointLimiter, sessionHandler.handleSignup);

    // Logout page
    app.get("/logout", sessionHandler.displayLogoutPage);

    // The main page of the app
    app.get("/dashboard", isLoggedIn, sessionHandler.displayWelcomePage);

    // Profile page
    app.get("/profile", isLoggedIn, profileHandler.displayProfile);
    app.post("/profile", isLoggedIn, profileHandler.handleProfileUpdate);

    // Account deletion endpoint (GDPR Art. 17 - Right to Erasure)
    app.post("/delete-account", isLoggedIn, (req, res, next) => {
        const userId = parseInt(req.session.userId);
        const usersCol = db.collection("users");
        const allocationsCol = db.collection("allocations");
        const contributionsCol = db.collection("contributions");

        usersCol.remove({_id: userId}, (err) => {
            if (err) return next(err);
            allocationsCol.remove({userId: userId}, (err) => {
                if (err) return next(err);
                contributionsCol.remove({userId: userId}, (err) => {
                    if (err) return next(err);
                    req.session.destroy((err) => {
                        if (err) return next(err);
                        res.clearCookie("connect.sid");
                        return res.redirect("/");
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
        const redirectUrl = req.query.url;
        // Validate redirect destination against allowlist
        const allowedDomains = [
            "https://www.khanacademy.org"
        ];
        const isAllowedExternal = allowedDomains.some((domain) => {
            return redirectUrl && redirectUrl.indexOf(domain) === 0;
        });
        const isSafeRelative = redirectUrl &&
            redirectUrl.charAt(0) === "/" &&
            redirectUrl.charAt(1) !== "/";
        if (isAllowedExternal || isSafeRelative) {
            return res.redirect(redirectUrl);
        }
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
