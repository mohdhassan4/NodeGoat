#!/usr/bin/env nodejs

"use strict";

// This script initializes the database. You can set the environment variable
// before running it (default: development). ie:
// NODE_ENV=production node artifacts/db-reset.js
//
// Seed passwords are read from environment variables. If not set, secure
// random passwords are generated and logged so the operator can retrieve them.
//   SEED_ADMIN_PASSWORD - password for the "admin" account
//   SEED_USER1_PASSWORD - password for the "user1" account
//   SEED_USER2_PASSWORD - password for the "user2" account

const crypto = require("crypto");
const bcrypt = require("bcrypt-nodejs");
const { MongoClient } = require("mongodb");
const { db } = require("../config/config");

const generateSecurePassword = () => crypto.randomBytes(16).toString("hex");

const resolvePassword = (envVar, label) => {
    const fromEnv = process.env[envVar];
    if (fromEnv) {
        return fromEnv;
    }
    const generated = generateSecurePassword();
    console.warn(
        `WARNING: No ${envVar} set. Generated random password for ${label}: ${generated}`
    );
    console.warn(
        "Set the environment variable to use a specific password on next seed."
    );
    return generated;
};

const adminPassword = resolvePassword("SEED_ADMIN_PASSWORD", "admin");
const user1Password = resolvePassword("SEED_USER1_PASSWORD", "user1");
const user2Password = resolvePassword("SEED_USER2_PASSWORD", "user2");

const hashPassword = (plain) => bcrypt.hashSync(plain, bcrypt.genSaltSync());

const USERS_TO_INSERT = [
    {
        "_id": 1,
        "userName": "admin",
        "firstName": "Node Goat",
        "lastName": "Admin",
        "password": hashPassword(adminPassword),
        "isAdmin": true
    }, {
        "_id": 2,
        "userName": "user1",
        "firstName": "John",
        "lastName": "Doe",
        "benefitStartDate": "2030-01-10",
        "password": hashPassword(user1Password)
    }, {
        "_id": 3,
        "userName": "user2",
        "firstName": "Will",
        "lastName": "Smith",
        "benefitStartDate": "2025-11-30",
        "password": hashPassword(user2Password)
    }];

const tryDropCollection = (db, name) => {
    return new Promise((resolve, reject) => {
        db.dropCollection(name, (err, data) => {
            if (!err) {
                console.log(`Dropped collection: ${name}`);
            }
            resolve(undefined);
        });
    });
};

const parseResponse = (err, res, comm) => {
    if (err) {
        console.log("ERROR:");
        console.log(comm);
        console.log(JSON.stringify(err));
        process.exit(1);
    }
    console.log(comm);
    console.log(JSON.stringify(res));
};


// Starting here
MongoClient.connect(db, { useUnifiedTopology: true }, (err, client) =>  {
    if (err) {
        console.log("ERROR: connect");
        console.log(JSON.stringify(err));
        process.exit(1);
    }
    const database = client.db();
    console.log("Connected to the database");

    const collectionNames = [
        "users",
        "allocations",
        "contributions",
        "memos",
        "counters"
    ];

    // remove existing data (if any), we don't want to look for errors here
    console.log("Dropping existing collections");
    const dropPromises = collectionNames.map((name) => tryDropCollection(database, name));

    // Wait for all drops to finish (or fail) before continuing
    Promise.all(dropPromises).then(() => {
        const usersCol = database.collection("users");
        const allocationsCol = database.collection("allocations");
        const countersCol = database.collection("counters");

        // reset unique id counter
        countersCol.insert({
            _id: "userId",
            seq: 3
        }, (err, data) => {
            parseResponse(err, data, "countersCol.insert");
        });

        // insert admin and test users
        console.log("Users to insert:");
        USERS_TO_INSERT.forEach((user) => console.log(JSON.stringify(user)));

        usersCol.insertMany(USERS_TO_INSERT, (err, data) => {
            const finalAllocations = [];

            // We can't continue if error here
            if (err) {
                console.log("ERROR: insertMany");
                console.log(JSON.stringify(err));
                process.exit(1);
            }
            parseResponse(err, data, "users.insertMany");

            data.ops.forEach((user) => {
                const stocks = Math.floor((Math.random() * 40) + 1);
                const funds = Math.floor((Math.random() * 40) + 1);

                finalAllocations.push({
                    userId: user._id,
                    stocks: stocks,
                    funds: funds,
                    bonds: 100 - (stocks + funds)
                });
            });

            console.log("Allocations to insert:");
            finalAllocations.forEach(allocation => console.log(JSON.stringify(allocation)));

            allocationsCol.insertMany(finalAllocations, (err, data) => {
                parseResponse(err, data, "allocations.insertMany");
                console.log("Database reset performed successfully");
                process.exit(0);
            });

        });
    });
});
