/* The ProfileDAO must be constructed with a connected database object */
function ProfileDAO(db) {

    "use strict";

    /* If this constructor is called without the "new" operator, "this" points
     * to the global object. Log a warning and call it correctly. */
    if (false === (this instanceof ProfileDAO)) {
        console.log("Warning: ProfileDAO constructor called without 'new' operator");
        return new ProfileDAO(db);
    }

    const users = db.collection("users");

    // Use crypto module to save sensitive data such as ssn, dob in encrypted format
    const crypto = require("crypto");
    const config = require("../../config/config");

    // Derive a 32-byte key for AES-256 from the configured cryptoKey
    const derivedKey = crypto.createHash("sha256").update(config.cryptoKey).digest();

    // Helper method to encrypt sensitive data using AES-256
    const encrypt = (toEncrypt) => {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(config.cryptoAlgo, derivedKey, iv);
        let encrypted = cipher.update(toEncrypt, "utf8", "hex");
        encrypted += cipher.final("hex");
        return iv.toString("hex") + ":" + encrypted;
    };

    // Helper method to decrypt sensitive data
    const decrypt = (toDecrypt) => {
        const parts = toDecrypt.split(":");
        const iv = Buffer.from(parts[0], "hex");
        const decipher = crypto.createDecipheriv(config.cryptoAlgo, derivedKey, iv);
        let decrypted = decipher.update(parts[1], "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    };

    this.updateUser = (userId, firstName, lastName, ssn, dob, address, bankAcc, bankRouting, callback) => {

        // Create user document
        const user = {};
        if (firstName) {
            user.firstName = firstName;
        }
        if (lastName) {
            user.lastName = lastName;
        }
        if (address) {
            user.address = address;
        }
        if (bankAcc) {
            user.bankAcc = bankAcc;
        }
        if (bankRouting) {
            user.bankRouting = bankRouting;
        }
        if (ssn) {
            user.ssn = encrypt(ssn);
        }
        if (dob) {
            user.dob = encrypt(dob);
        }

        users.update({
                _id: parseInt(userId)
            }, {
                $set: user
            },
            err => {
                if (!err) {
                    console.log("Updated user profile");
                    return callback(null, user);
                }

                return callback(err, null);
            }
        );
    };

    this.getByUserId = (userId, callback) => {
        users.findOne({
                _id: parseInt(userId)
            },
            (err, user) => {
                if (err) return callback(err, null);
                // Decrypt ssn and DOB values to display to user
                user.ssn = user.ssn ? decrypt(user.ssn) : "";
                user.dob = user.dob ? decrypt(user.dob) : "";

                callback(null, user);
            }
        );
    };
}

module.exports = { ProfileDAO };
