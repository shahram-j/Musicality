var express = require('express');
var router = express.Router();

var SC = require("../../helpers/soundcloud");

// query SoundCloud's search API
router.get("/search/:query", function (req, res) {
    SC.get('/tracks', {
        q: req.params.query
    }, function (err, tracks) {
        var withSource = [];
        tracks.forEach(function (track) {
            var newTrack = {};

            newTrack.title = track.title;
            newTrack.source = "SoundCloud";
            newTrack.playbackURL = track.permalink_url;

            withSource.push(newTrack);
        });

        res.send(withSource);
    });
});

module.exports = router;
