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

    // Derive a fixed 32-byte encryption key from config.cryptoKey using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(config.cryptoKey, "nodegoat-fixed-salt", 100000, 32, "sha512");

    // Helper method to encrypt a value; returns hex(iv):hex(ciphertext)
    const encrypt = (toEncrypt) => {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv("aes-256-cbc", derivedKey, iv);
        const encrypted = cipher.update(toEncrypt, "utf8", "hex") + cipher.final("hex");
        return iv.toString("hex") + ":" + encrypted;
    };

    // Helper method to decrypt a value stored as hex(iv):hex(ciphertext)
    const decrypt = (toDecrypt) => {
        const parts = toDecrypt.split(":");
        const iv = Buffer.from(parts[0], "hex");
        const encrypted = parts[1];
        const decipher = crypto.createDecipheriv("aes-256-cbc", derivedKey, iv);
        return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
    };

    this.updateUser = (userId, firstName, lastName, ssn, dob, address, bankAcc, bankRouting, callback) => {

        // Create user document with encrypted sensitive fields for storage
        const user = {};
        if (firstName) {
            user.firstName = firstName;
        }
        if (lastName) {
            user.lastName = lastName;
        }
        if (address) {
            user.address = encrypt(address);
        }
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
                    // Return plaintext values for display, not the encrypted stored values
                    const displayUser = {
                        firstName,
                        lastName,
                        ssn,
                        dob,
                        address,
                        bankAcc,
                        bankRouting
                    };
                    return callback(null, displayUser);
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

                // Decrypt sensitive PII fields before returning to caller
                if (user) {
                    user.ssn = user.ssn ? decrypt(user.ssn) : "";
                    user.dob = user.dob ? decrypt(user.dob) : "";
                    user.bankAcc = user.bankAcc ? decrypt(user.bankAcc) : "";
                    user.bankRouting = user.bankRouting ? decrypt(user.bankRouting) : "";
                    user.address = user.address ? decrypt(user.address) : "";
                }

                callback(null, user);
            }
        );
    };
}

module.exports = { ProfileDAO };
