var express = require('express');
var router = express.Router();

var constants = require("../../constants.js");

// tags database
router.get('/', function (req, res) {
    res.json(constants.tags);
});

module.exports = router;
