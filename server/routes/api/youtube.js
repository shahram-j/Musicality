var express = require('express');
var router = express.Router();

var Youtube = require("../../helpers/youtube");

// search YouTube
router.get("/search/:query", function (req, res) {
    var query = req.params.query;
    Youtube.search.list({
        "part": "snippet",
        "maxResults": 10,
        "q": query,
        "type": "video",
        "videoEmbeddable": true
    }, function (err, data) {
        if (err) {
            res.send(err)
        } else {
            var items = data.items;
            var videos = [];

            for (var i = 0; i < 10; i++) {
                var item = items[i];

                if (item) {
                    if (item.hasOwnProperty("id") && item.hasOwnProperty("snippet")) {
                        // make sure it's not a live broadcast
                        if (item.snippet.liveBroadcastContent === "none") {
                            videos[i] = {
                                title: item.snippet.title,
                                source: "YouTube",
                                playbackURL: "https://youtube.com/watch?v=" + item.id.videoId
                            };
                        }
                    }
                }
            }

            // remove null references if present
            videos = videos.filter(function (e) {
                return e;
            });

            res.send(videos);
        }
    });
});

module.exports = router;
