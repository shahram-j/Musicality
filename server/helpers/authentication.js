var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user.js');

module.exports = function (passport) {
    passport.use(new LocalStrategy(
        function (username, password, done) {
            User.findOne({username: username}, function (err, user) {
                if (err) {
                    return done(err);
                }

                // we do not want to let the user know which parameter is wrong for security reasons
                // so a generic reason is given

                if (!user) {
                    return done(null, false, {message: 'Your login details are incorrect.'});
                }

                if (!user.validPassword(password)) {
                    return done(null, false, {message: 'Your login details are incorrect.'});
                }

                return done(null, user);
            });
        }
    ));
};
