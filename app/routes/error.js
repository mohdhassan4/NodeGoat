// Error handling middleware

const errorHandler = (err, req, res, next) => {

    "use strict";

    console.error(err.message);
    console.error(err.stack);
    res.status(500);

    var errorMessage = "An internal error occurred. Please try again later.";
    if (process.env.NODE_ENV !== "production") {
        errorMessage = err.message || errorMessage;
    }

    res.render("error-template", {
        error: errorMessage
    });
};

module.exports = { errorHandler };
