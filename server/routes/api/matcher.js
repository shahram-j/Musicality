var express = require('express');
var router = express.Router();

var constants = require("../../constants.js");

var SpotifyWebApi = require('spotify-web-api-node');

var spotifyApi = new SpotifyWebApi({
    clientId: '5fb778da2ef547c2b49fceab0a64678c',
    clientSecret: '86d73a296ff74899ba1296dcb235d3e3'
});

router.get('/', function (req, res, next) {
    spotifyApi.getUserPlaylists('spotify', "7JNPDieyce4ZZTBYlTGa6f")
        .then(function (data) {
            res.status(200).send(data.body);
        }, function (err) {
            console.log('Something went wrong!', err);
        });
});

module.exports = router;
