var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

var constants = require('./constants');

// API routes
var authentication = require('./routes/api/authentication');
var playlists = require('./routes/api/playlists');
var youtube = require('./routes/api/youtube');
var soundcloud = require('./routes/api/soundcloud');
var users = require('./routes/api/users');
var tags = require('./routes/api/tags');
var matcher = require('./routes/api/matcher');

var app = express();

var mongoose = require("mongoose");
var passport = require('passport');

var cors = require("cors");

require("./helpers/authentication.js")(passport);

mongoose.connect(constants.dbUrl, constants.dbOptions);

app.use(passport.initialize());
app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/tags', tags);

app.use('/api/matcher', matcher);

app.use('/api/youtube', youtube);
app.use('/api/soundcloud', soundcloud);

app.use('/api/playlists', playlists);
app.use('/api/users', users);

app.use('/api', authentication);

app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, "../public", "templates", "index.html"));
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
