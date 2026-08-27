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

    //Middleware to check if user has admin rights and regenerate session on privilege escalation
    const isAdmin = (req, res, next) => {
        sessionHandler.isAdminUserMiddleware(req, res, () => {
            // Regenerate session when escalating to admin context to prevent session fixation
            if (!req.session.adminSessionRegenerated) {
                const userId = req.session.userId;
                return req.session.regenerate((err) => {
                    if (err) return next(err);
                    req.session.userId = userId;
                    req.session.adminSessionRegenerated = true;
                    return next();
                });
            }
            return next();
        });
    };

    // Simple in-memory rate limiter for sensitive endpoints
    const rateLimitStore = {};
    const createRateLimiter = (windowMs, maxAttempts) => {
        return (req, res, next) => {
            var key = req.ip + req.path;
            var now = Date.now();

            if (!rateLimitStore[key] || rateLimitStore[key].resetTime <= now) {
                rateLimitStore[key] = { count: 1, resetTime: now + windowMs };
                return next();
            }

            rateLimitStore[key].count += 1;

            if (rateLimitStore[key].count > maxAttempts) {
                return res.status(429).json({
                    message: "Too many requests, please try again later."
                });
            }

            return next();
        };
    };

    // Rate limiter: max 50 attempts per 15-minute window per IP
    const sensitiveEndpointLimiter = createRateLimiter(15 * 60 * 1000, 50);

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

    // GDPR Art. 17 - Right to erasure: allows authenticated users to delete their data
    app.delete("/profile", isLoggedIn, profileHandler.handleProfileDelete);

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
        var url = req.query.url;
        // Validate redirect destination: must be a relative path starting with /
        // and must not be a protocol-relative URL (//evil.com)
        if (typeof url === "string" && url.startsWith("/") && !url.startsWith("//")) {
            return res.redirect(url);
        }
        return res.redirect("/");
    });

    // Research Page
    app.get("/research", isLoggedIn, researchHandler.displayResearch);

    // Mount tutorial router
    app.use("/tutorial", tutorialRouter);

    // Error handling middleware
    app.use(ErrorHandler);
};

module.exports = index;
