const SessionHandler = require("./session");
const ProfileHandler = require("./profile");
const BenefitsHandler = require("./benefits");
const ContributionsHandler = require("./contributions");
const AllocationsHandler = require("./allocations");
const MemosHandler = require("./memos");
const ResearchHandler = require("./research");
const tutorialRouter = require("./tutorial");
const ErrorHandler = require("./error").errorHandler;

// Fix for CWE-307: In-memory login rate limiter to prevent brute-force attacks
const loginAttempts = new Map();
const LOGIN_RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_RATE_MAX_ATTEMPTS = 5; // max attempts per window per IP

const loginRateLimiter = (req, res, next) => {
    "use strict";

    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    let record = loginAttempts.get(ip);

    if (!record || (now - record.windowStart) > LOGIN_RATE_WINDOW_MS) {
        record = { windowStart: now, count: 0 };
        loginAttempts.set(ip, record);
    }

    record.count += 1;

    if (record.count > LOGIN_RATE_MAX_ATTEMPTS) {
        return res.status(429).render("login", {
            userName: "",
            password: "",
            loginError: "Too many login attempts. Please try again after 15 minutes.",
            environmentalScripts: require("../../config/config").environmentalScripts
        });
    }

    return next();
};

// Periodically clean up expired entries to prevent memory leaks
setInterval(() => {
    "use strict";

    const now = Date.now();
    loginAttempts.forEach((record, ip) => {
        if ((now - record.windowStart) > LOGIN_RATE_WINDOW_MS) {
            loginAttempts.delete(ip);
        }
    });
}, LOGIN_RATE_WINDOW_MS);

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

    // The main page of the app
    app.get("/", sessionHandler.displayWelcomePage);

    // Login form
    app.get("/login", sessionHandler.displayLoginPage);
    app.post("/login", loginRateLimiter, sessionHandler.handleLoginRequest);

    // Signup form
    app.get("/signup", sessionHandler.displaySignupPage);
    app.post("/signup", sessionHandler.handleSignup);

    // Logout page
    app.get("/logout", sessionHandler.displayLogoutPage);

    // The main page of the app
    app.get("/dashboard", isLoggedIn, sessionHandler.displayWelcomePage);

    // Profile page
    app.get("/profile", isLoggedIn, profileHandler.displayProfile);
    app.post("/profile", isLoggedIn, profileHandler.handleProfileUpdate);

    // Contributions Page
    app.get("/contributions", isLoggedIn, contributionsHandler.displayContributions);
    app.post("/contributions", isLoggedIn, contributionsHandler.handleContributionsUpdate);

    // Benefits Page
    // Fix for A7 - checks user role to implement Function Level Access Control
    app.get("/benefits", isLoggedIn, isAdmin, benefitsHandler.displayBenefits);
    app.post("/benefits", isLoggedIn, isAdmin, benefitsHandler.updateBenefits);

    // Allocations Page
    app.get("/allocations/:userId", isLoggedIn, allocationsHandler.displayAllocations);

    // Memos Page
    app.get("/memos", isLoggedIn, memosHandler.displayMemos);
    app.post("/memos", isLoggedIn, memosHandler.addMemos);

    // Handle redirect for learning resources link
    app.get("/learn", isLoggedIn, (req, res) => {
        "use strict";

        const url = req.query.url;

        // Validate redirect URL: allow only relative paths (starting with /)
        // Block protocol-relative URLs (//), absolute URLs, and javascript: schemes
        if (!url || typeof url !== "string" || !url.startsWith("/") || url.startsWith("//")) {
            return res.redirect("/");
        }

        return res.redirect(url);
    });

    // Research Page
    app.get("/research", isLoggedIn, researchHandler.displayResearch);

    // Mount tutorial router
    app.use("/tutorial", tutorialRouter);

    // Error handling middleware
    app.use(ErrorHandler);
};

module.exports = index;
