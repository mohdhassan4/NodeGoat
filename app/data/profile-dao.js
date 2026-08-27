const crypto = require("crypto");
const config = require("../../config/config");

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

    // Fix for A6 - Sensitive Data Exposure
    // Use crypto module to save sensitive data such as ssn, dob, bankAcc, bankRouting encrypted
    const IV_LENGTH = 16;
    // Derive a 32-byte key from the configured cryptoKey (sourced from process.env.CRYPTO_KEY)
    const derivedKey = crypto.scryptSync(config.cryptoKey, "nodegoat", 32);

    // Helper methods to encrypt / decrypt
    const encrypt = (toEncrypt) => {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv("aes-256-cbc", derivedKey, iv);
        const encrypted = cipher.update(toEncrypt, "utf8", "hex") + cipher.final("hex");
        // Store IV with ciphertext so decryption is possible across restarts
        return iv.toString("hex") + ":" + encrypted;
    };

    const decrypt = (toDecrypt) => {
        const parts = toDecrypt.split(":");
        // If value does not match encrypted format (iv_hex:ciphertext_hex), return as-is
        // This handles legacy unencrypted data already in the database
        if (parts.length !== 2 || parts[0].length !== IV_LENGTH * 2) {
            return toDecrypt;
        }
        const iv = Buffer.from(parts[0], "hex");
        const encryptedText = parts[1];
        const decipher = crypto.createDecipheriv("aes-256-cbc", derivedKey, iv);
        return decipher.update(encryptedText, "hex", "utf8") + decipher.final("utf8");
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
        // Fix for A6/A7 - Sensitive Data Exposure
        // Store sensitive PII fields encrypted at rest
        if (bankAcc) {
            user.bankAcc = encrypt(bankAcc);
        }
        if (bankRouting) {
            user.bankRouting = encrypt(bankRouting);
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

                // Fix for A6 - Sensitive Data Exposure
                // Decrypt sensitive PII values to display to user
                user.ssn = user.ssn ? decrypt(user.ssn) : "";
                user.dob = user.dob ? decrypt(user.dob) : "";
                user.bankAcc = user.bankAcc ? decrypt(user.bankAcc) : "";
                user.bankRouting = user.bankRouting ? decrypt(user.bankRouting) : "";

                callback(null, user);
            }
        );
    };
}

module.exports = { ProfileDAO };
