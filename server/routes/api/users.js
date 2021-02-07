var express = require('express');
var router = express.Router();
var request = require('request');

var User = require("../../models/user");
var Playlist = require("../../models/playlist");

var constants = require("../../constants.js");
var multer = require('multer');
var path = require("path");

var _ = require("underscore");

// list all users with or without criteria
router.get('/', function (req, res) {
    User.find(Object.keys(req.query).length > 0 ? req.query : {}, {password: false}, function (err, users) {
        if (err) res.status(400).send(err);

        res.send(users);
    });
});

// for use in all profiles page
router.get('/page/:no', function (req, res) {
    User.paginate({}, {select: '-password', page: req.params.no, limit: 10, lean: true}, function (err, result) {
        if (err) {
            return constants.unexpectedError(res);
        } else {
            if (_.isEmpty(result.docs)) {
                res.send(result.docs);
            } else {
                var i = 0;

                result.docs.forEach(function (user) {
                    Playlist.find({createdBy: user.username}).lean().select("-tracks -comments -createdBy -tags").sort("-dateCreated").exec(function (err, playlists) {
                        i++;
                        populateFields(user, playlists);

                        if (err) {
                            constants.unexpectedError(res);
                        } else {
                            if (i === result.docs.length) {
                                res.send(result.docs);
                            }
                        }
                    });
                });
            }
        }
    });
});

// get details about a user
router.get("/:username", function (req, res) {
    var username = req.params.username;

    // should only return a single result
    User.findOne({username: username}).select("-password").lean().exec(function (err, user) {
        if (err || !user) {
            return res.status(400).json({message: 'Could not find user.'});
        }

        Playlist.find({createdBy: user.username}).lean().select("-comments").sort("-dateCreated").exec(function (err, playlists) {
            if (err) {
                constants.unexpectedError(res);
            } else {
                populateFields(user, playlists);
                res.send(user);
            }
        });
    });
});

function populateFields(user, playlists) {
    user.playlists = playlists;

    var views = _.pluck(playlists, "views");
    var totalViews = 0;

    for (var index in views) {
        totalViews += views[index];
    }

    user.countPlaylists = playlists.length;
    user.totalViews = totalViews;
}

// update user profile fields
router.put("/:username", [constants.auth, constants.checkUserEditableResource()], function (req, res) {
    if (req.body.username || req.body.email) {
        return res.status(400).json({message: 'These fields are protected and therefore uneditable.'});
    }

    // update the required fields
    req.editingUser.update(req.body, function (err) {
        return err ? constants.unexpectedError(res) : res.status(200).json({message: 'User\'s profile updated.'});
    });
});

// upload profile image
router.post("/:username/image", [constants.auth, constants.checkUserEditableResource()], function (req, res) {
    var username = req.editingUser.username;
    var finalFileName = "";
    var storage = multer.diskStorage({
        destination: './public/images/profile_img/',
        filename: function (req, file, cb) {
            finalFileName = username + path.extname(file.originalname);
            cb(null, username + path.extname(file.originalname))
        }
    });

    var upload = multer({storage: storage});
    upload.single("image")(req, res, function (err) {
        if (err) {
            return res.status(400).json({message: 'Unable to change user\'s profile image.'});
        }

        req.editingUser.img = "/images/profile_img/" + finalFileName;
        req.editingUser.save(function (err, user) {
            return err ? constants.unexpectedError(res) : res.status(200).json({message: "Your profile image was changed.", user: user});
        });
    });
});

module.exports = router;
