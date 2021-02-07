var express = require('express');
var router = express.Router();

var Playlist = require("../../models/playlist");
var constants = require("../../constants.js");
var slug = require('slug');

var multer = require('multer');
var path = require("path");

var _ = require("underscore");

// list all playlists with or without criteria
// most only be used if doing a specific query
router.get('/', function (req, res) {
    Playlist.find(Object.keys(req.query).length > 0 ? req.query : {}, function (err, playlists) {
        if (err) {
            return constants.unexpectedError(res);
        } else {
            res.send(playlists);
        }
    });
});

router.get('/page/:no', function (req, res) {
    Playlist.paginate({"$where": "this.tracks.length > 2"}, {page: req.params.no, limit: 10, sort: {dateCreated: -1}}, function (err, result) {
        if (err) {
            return constants.unexpectedError(res);
        } else {
            res.send(result.docs);
        }
    });
});

router.get('/recent', function (req, res) {
    // only public playlists
    Playlist.find({"$where": "this.tracks.length > 2"}).sort('-dateCreated')
        .limit(4).exec(function (err, playlists) {
            if (err) {
                return constants.unexpectedError(res);
            } else {
                res.send(playlists);
            }
        });
});

// create new blank playlist
router.post('/blank', constants.auth, function (req, res) {
    var finalNumber = 0;

    Playlist.find({createdBy: req.payload.username}, function (err, playlists) {
        playlists.forEach(function (playlist) {
            var name = playlist.name;

            // based on the assumption that 'A new playlist' is not used in playlist names
            // that have been edited by the user so the following block only executes on a
            // playlist name with correct format
            if (name.indexOf("A new playlist") === 0) {
                var nameSplit = name.split(/(\s+)/);

                // check if 6th index is available
                if (nameSplit[6] !== 'undefined') {
                    var hashtag = nameSplit[6];

                    // if there is a hashtag present and a split is possible
                    if (canSplit(hashtag, "#")) {
                        var hashtagSplit = hashtag.split("#");
                        finalNumber = Math.max(finalNumber, hashtagSplit[1]);
                    }
                }
            }
        });

        // provide next number to create a playlist on
        finalNumber++;

        // populate fields for playlist creation
        req.body.name = "A new playlist #" + finalNumber;
        req.body.description = "Just another newly created playlist!";
        createNewPlaylist(req, res);
    });
});

function createNewPlaylist(req, res) {
    // check whether the user already has a playlist with the given name
    Playlist.findOne({name: req.body.name, createdBy: req.payload.username}, function (err, playlist) {
        if (!playlist) {
            var newPlaylist = new Playlist({
                name: req.body.name,
                description: req.body.description,
                createdBy: req.payload.username
            });

            newPlaylist.save(function (err, playlist) {
                if (err) {
                    return res.status(400).json({message: 'Playlist could not be added.'});
                }

                // send the newly created playlist back
                res.status(200).json(playlist);
            });
        } else {
            return res.status(400).json({message: 'Playlist with the name given already exists.'});
        }
    });
}

// views, on every request, add one
// not protected but it doesn't matter as the application is purely conceptual based

// in production, anyone can access this route so there will need to be an algorithm
// that sorts views from legitimate to fake

// a solution would be to use the JWT token to identify a legitimate view but
// what about someone that isn't logged in? won't their views count?

// Google does something similar with YouTube in terms of sorting views
router.put("/:id/views", function (req, res) {
    // add a view to the playlist
    Playlist.findOneAndUpdate({_id: req.params.id}, {$inc: {views: 1}}, function (err) {
        //return err ? constants.unexpectedError(res) : res.status(200).json({message: 'View added to playlist.'});
        return err ? res.send(err) : res.status(200).json({message: 'View added to playlist.'});
    });
});

// update playlist fields
router.put("/:id", [constants.auth, constants.checkPlaylistOwner()], function (req, res) {
    if (req.body.name || req.body.slug) {
        return res.status(400).json({message: 'A playlist\'s name or slug field cannot be edited manually. Use the dedicated name changing API endpoint.'});
    }

    // update the required fields
    req.playlist.update(req.body, function (err) {
        return err ? constants.unexpectedError(res) : res.status(200).json({message: 'Playlist\'s fields updated.'});
    });
});

// name component

// update playlist name and in turn, the slug
router.put("/:id/name", [constants.auth, constants.checkPlaylistOwner()], function (req, res) {
    // fetch all the playlists the user given to us has created
    Playlist.find({createdBy: req.payload.username}, function (err, playlists) {
        if (err) return constants.unexpectedError(res);

        // without the current playlist
        var withoutCurrent = playlists.filter(function (each) {
            return !(each._id.equals(req.playlist._id));
        });

        // initial duplicate name check
        var duplicateName = _.findWhere(playlists, {name: req.body.name});
        if (duplicateName) {
            return res.status(200).json({message: 'You already have a playlist with that name.'});
        } else {
            var newNameSlug = slug(req.body.name);
            var duplicateSlug = _.where(withoutCurrent, {slug: newNameSlug});

            if (duplicateSlug) {
                var duplicateSlugCount = duplicateSlug.length;

                // if there's no other playlists with the same slug
                // completely different name
                if (duplicateSlugCount === 0) {
                    // go ahead and change the name since it is the only playlist with the slug the new name gives us
                    // will also continue to this if the same name is given
                    req.playlist.update({name: req.body.name, slug: newNameSlug}, function (err) {
                        return err ? constants.unexpectedError(res) : res.status(200).json({message: "Playlist's name updated.", redirectUrl: newNameSlug});
                    });
                } else {
                    // increment the count to give us the integer we need to add to the end
                    duplicateSlugCount++;

                    newNameSlug += "-" + duplicateSlugCount;

                    req.playlist.update({name: req.body.name, slug: newNameSlug}, function (err) {
                        return err ? constants.unexpectedError(res) : res.status(200).json({message: "Playlist's name updated and appended appropriate duplicate string.", redirectUrl: newNameSlug});
                    });
                }
            }
        }
    });
});

// tags component

// add a playlist tag
router.put("/:id/tags", [constants.auth, constants.checkPlaylistOwner()], function (req, res) {
    var tagToPush = req.body.tag;

    if (req.playlist.tags.indexOf(tagToPush) > -1) {
        return res.status(400).json({message: 'Tag already exists in playlist.'});
    }

    req.playlist.tags.push(tagToPush);

    req.playlist.save(function (err) {
        return err ? constants.unexpectedError(res) : res.status(200).json({message: "Playlist's tags updated."});
    });
});

// delete a tag from a playlist
router.delete("/:id/tags", [constants.auth, constants.checkPlaylistOwner()], function (req, res) {
    var tagToDelete = req.body.tag;
    var index = req.playlist.tags.indexOf(tagToDelete);

    if (index > -1) {
        req.playlist.tags.splice(index, 1);
    }

    req.playlist.save(function (err) {
        return err ? constants.unexpectedError(res) : res.status(200).json({message: "Playlist's tags updated."});
    });
});

// comments component

// add a comment to the playlist
router.put("/:id/comments", constants.auth, function (req, res) {
    var comment = req.body.comment;
    var id = req.params.id;
    var username = req.payload.username;
    var created = req.body.created;

    Playlist.findOne({_id: id}, function (err, playlist) {
        if (err || !playlist) {
            return res.status(400).json({message: 'Playlist does not exist.'});
        }

        var allComments = playlist.comments;
        var userComments = _.where(allComments, {username: username});
        var duplicateComments = _.where(userComments, {comment: comment});

        if (duplicateComments.length > 0) {
            return res.status(400).json({message: 'You\'ve already commented this before.'});
        } else {
            var pushedComment = {username: username, comment: comment, created: created};
            playlist.comments.push(pushedComment);

            playlist.save(function (err) {
                return err ? constants.unexpectedError(res) : res.status(200).json({
                    message: "Your comment was added to the playlist. Feel free to delete it or write another.",
                    addedComment: pushedComment
                });
            });
        }
    });
});

// delete a comment from the playlist
router.delete("/:id/comments", [constants.auth], function (req, res) {
    var username = req.payload.username;

    var usernameOfComment = req.body.username;
    var comment = req.body.comment;
    var id = req.params.id;

    Playlist.findOne({_id: id}, function (err, playlist) {
        if (err || !playlist) {
            return res.status(400).json({message: 'Playlist does not exist.'});
        }

        var allComments = playlist.comments;
        var commentInQuery = _.findWhere(allComments, {username: usernameOfComment, comment: comment});

        // comment found
        if (commentInQuery) {
            // is author
            if (username === usernameOfComment) {
                playlist.comments = _.filter(allComments, function (obj) {
                    return obj !== commentInQuery;
                });

                playlist.save(function (err) {
                    return err ? constants.unexpectedError(res) : res.status(200).json({message: "Your comment was successfully deleted.", delComment: commentInQuery});
                });
            } else {
                return err ? constants.unexpectedError(res) : res.status(400).json({message: "You are not the author of that comment."});
            }
        }
    });
});

// likes component

// like a playlist
router.put("/:id/likes", constants.auth, function (req, res) {
    var id = req.params.id;
    var username = req.payload.username; // user liking the playlist

    Playlist.findOne({_id: id}, function (err, playlist) {
        if (err || !playlist) {
            return res.status(400).json({message: 'Playlist does not exist.'});
        }

        // users liked (usernames)
        var likes = playlist.likes;
        var alreadyLiked = _.findWhere(likes, {username: username});

        if (alreadyLiked) {
            return res.status(400).json({message: 'You\'ve already liked this playlist before.'});
        } else {
            playlist.likes.push({username: username});

            playlist.save(function (err) {
                return err ? constants.unexpectedError(res) : res.status(200).json({
                    message: "Your like was added.",
                    addedLike: {username: username}
                });
            });
        }
    });
});

// unlike a playlist
router.delete("/:id/likes", constants.auth, function (req, res) {
    var id = req.params.id;
    // this is the user unliking the playlist
    var username = req.payload.username;

    Playlist.findOne({_id: id}, function (err, playlist) {
        if (err || !playlist) {
            return res.status(400).json({message: 'Playlist does not exist.'});
        }

        var likes = playlist.likes;
        var alreadyLiked = _.findWhere(likes, {username: username});

        if (alreadyLiked) {
            // remove the like
            playlist.likes = _.reject(likes, alreadyLiked);

            playlist.save(function (err) {
                return err ? constants.unexpectedError(res) : res.status(200).json({message: "You've unliked this playlist.", delLike: {username: username}});
            });
        } else {
            return res.status(400).json({message: 'You haven\'t liked this playlist before.'});
        }
    });
});

// tracks component

// 'source' will be the way of interpreting how to read the track object
// which in turn will mean that we can extract playable audio from the playback URL

// add playlist track
router.put("/:id/tracks", [constants.auth, constants.checkPlaylistOwner()], function (req, res) {
    var playbackUrl = req.body.playbackURL;

    var trackExists = false;

    for (var i = 0; i < req.playlist.tracks.length; i++) {
        var track = req.playlist.tracks[i];

        // check whether or not the track specified in the request body exists
        if (track.playbackURL === playbackUrl) {
            trackExists = true;
            break;
        }
    }

    if (trackExists) {
        return res.status(400).json({message: 'Track already exists in the playlist.'});
    } else {
        req.playlist.tracks.push(req.body);
        req.playlist.save(function (err) {
            return err ? constants.unexpectedError(res) : res.status(200).json({message: "Added track to playlist."});
        });
    }
});

// delete playlist track
router.delete("/:id/tracks", [constants.auth, constants.checkPlaylistOwner()], function (req, res) {
    // referenced by playback URL
    var trackToDelete = req.body.playbackURL;

    for (var i = 0; i < req.playlist.tracks.length; i++) {
        var track = req.playlist.tracks[i];

        if (track.playbackURL === trackToDelete) {
            req.playlist.tracks.splice(i, 1);
            break;
        }
    }

    // will continue to this block even if track does not exist
    req.playlist.save(function (err) {
        return err ? constants.unexpectedError(res) : res.status(200).json({message: "Deleted track from playlist."});
    });
});

// delete playlist track
router.delete("/:id/tracks/all", [constants.auth, constants.checkPlaylistOwner()], function (req, res) {
    req.playlist.tracks = [];

    req.playlist.save(function (err) {
        return err ? constants.unexpectedError(res) : res.status(200).json({message: "All tracks from given playlist deleted."});
    });
});

// art component

// upload image art to directory
router.post("/:id/image", [constants.auth, constants.checkPlaylistOwner()], function (req, res) {
    var id = req.playlist.id;

    var finalFileName = "";

    var storage = multer.diskStorage({
        destination: './public/images/playlist_art',
        filename: function (req, file, cb) {
            finalFileName = id + path.extname(file.originalname);

            cb(null, id + path.extname(file.originalname))
        }
    });

    var upload = multer({storage: storage});

    upload.single("image")(req, res, function (err) {
        if (err) {
            return res.status(400).json({message: 'Error uploading playlist art.'});
        }

        // how the image is viewed within the browser
        req.playlist.art = "/images/playlist_art/" + finalFileName;

        req.playlist.save(function (err, playlist) {
            return err ? constants.unexpectedError(res) : res.status(200).json({message: "Playlist's art updated.", playlist: playlist});
        });
    });
});

function canSplit(str, token) {
    return (str || '').split(token).length > 1;
}

module.exports = router;
