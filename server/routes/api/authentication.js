var express = require('express');
var router = express.Router();

var passport = require("passport");

var User = require("../../models/user.js");

var constants = require("../../constants.js");

// register a new user
router.post('/register', checkRegistrationParameters, function (req, res, next) {
    User.findOne({username: req.body.username}, function (err, user) {
        if (err) {
            return res.status(400);
        }

        // username not taken
        if (!user) {
            var newUser = new User();
            var username = req.body.username;

            // validation checks

            // these usernames are reserved as they collide with routes on the frontend
            if (username === "profile" || username === "playlists") {
                return res.status(400).json({message: 'You may not use a reserved username!'});
            } else if (!isValid(username) || hasWhitespace(username)) {
                return res.status(400).json({message: 'Your chosen username contains illegal characters. Please remove these.'});
            } else if (req.body.password.length < 6) {
                return res.status(400).json({message: 'Your password must be at least 6 characters long.'});
            } else if (!validEmail(req.body.email)) {
                return res.status(400).json({message: 'Not a valid email address.'});
            } else if (req.body.password !== req.body.confirm_password) {
                return res.status(400).json({message: 'Your passwords do not match.'});
            }
            else if (req.body.email !== req.body.confirm_email) {
                return res.status(400).json({message: 'Your email addresses do not match.'});
            }
            // passed all checks, create the user
            else {
                newUser.username = username;
                newUser.firstName = req.body.first_name;
                newUser.lastName = req.body.last_name;
                newUser.email = req.body.email;

                newUser.setPassword(req.body.password);

                newUser.save(function (err) {
                    if (err) {
                        return next(err);
                    }

                    return res.json({token: newUser.generateJWT()});
                });
            }
        } else {
            return res.status(400).json({message: 'Username is already taken by another user.'});
        }
    });
});

// authenticate and return a JWT token
router.post('/login', checkLoginParameters, function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        if (err) {
            return next(err);
        }

        if (user) {
            return res.json({token: user.generateJWT()});
        } else {
            return res.status(401).json(info);
        }
    })(req, res, next);
});

function checkLoginParameters(req, res, next) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({message: 'Please fill out all the parameter fields.'});
    }

    next();
}

function checkRegistrationParameters(req, res, next) {
    if (!req.body.username || !req.body.password || !req.body.first_name || !req.body.last_name) {
        return res.status(400).json({message: 'Please fill out all the parameter fields.'});
    }

    next();
}

function hasWhitespace(s) {
    return /\s/.test(s);
}

// only _ and - allowed
var notAllowedChars = "<>@!#$%^&*()+[]{}?:;|'\"\\,./~`=";

function isValid(string) {
    for (var i = 0; i < notAllowedChars.length; i++) {
        // does have illegal character
        if (string.indexOf(notAllowedChars[i]) > -1) return false;
    }

    // no illegal character, safe expression
    return true;
}

function validEmail(email) {
    // http://emailregex.com/
    var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(email);
}

module.exports = router;
