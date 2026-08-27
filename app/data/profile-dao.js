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

    // Encrypt sensitive PII at rest (A6 - Sensitive Data Exposure)
    const crypto = require("crypto");
    const config = require("../../config/config");

    // Derive a 32-byte key from config.cryptoKey for AES-256-CBC
    const derivedKey = crypto.createHash("sha256")
        .update(config.cryptoKey)
        .digest();

    // Encrypt a plaintext string; returns "iv_hex:ciphertext_hex"
    const encrypt = (plaintext) => {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            "aes-256-cbc", derivedKey, iv
        );
        let encrypted = cipher.update(plaintext, "utf8", "hex");
        encrypted += cipher.final("hex");
        return iv.toString("hex") + ":" + encrypted;
    };

    // Decrypt a stored value of the form "iv_hex:ciphertext_hex"
    const decrypt = (stored) => {
        if (!stored || stored.indexOf(":") === -1) {
            return stored || "";
        }
        const parts = stored.split(":");
        const iv = Buffer.from(parts[0], "hex");
        const encryptedText = parts[1];
        const decipher = crypto.createDecipheriv(
            "aes-256-cbc", derivedKey, iv
        );
        let decrypted = decipher.update(encryptedText, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    };

    this.updateUser = (userId, firstName, lastName, ssn, dob, address, bankAcc, bankRouting, website, callback) => {

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
        // Encrypt sensitive PII before storing
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
        // Only store website if it has a safe scheme (validated by caller)
        if (website) {
            user.website = website;
        }

        // Keep plaintext values for the response rendered back to the user
        const responseUser = {
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            address: address || undefined,
            bankAcc: bankAcc || undefined,
            bankRouting: bankRouting || undefined,
            ssn: ssn || undefined,
            dob: dob || undefined,
            website: website || undefined
        };

        users.update({
                _id: parseInt(userId)
            }, {
                $set: user
            },
            err => {
                if (!err) {
                    console.log("Updated user profile");
                    return callback(null, responseUser);
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
                if (user) {
                    // Decrypt sensitive PII fields for display
                    user.ssn = user.ssn ? decrypt(user.ssn) : "";
                    user.dob = user.dob ? decrypt(user.dob) : "";
                    user.bankAcc = user.bankAcc ?
                        decrypt(user.bankAcc) : "";
                    user.bankRouting = user.bankRouting ?
                        decrypt(user.bankRouting) : "";
                }
                callback(null, user);
            }
        );
    };
}

module.exports = { ProfileDAO };
