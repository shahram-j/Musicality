var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bCrypt = require('bcrypt-nodejs');
var jwt = require('jsonwebtoken');
var mongoosePaginate = require('mongoose-paginate');
var constants = require("../constants.js");

var UserSchema = new Schema({
    username: String,
    password: String,

    firstName: String,
    lastName: String,

    email: String,

    img: {type: String, default: "generated"}
}, {
    collection: 'users'
});

UserSchema.methods.setPassword = function (password) {
    this.password = createHash(password);
};

UserSchema.methods.validPassword = function (password) {
    return checkHashedEquality(this.password, password)
};

UserSchema.methods.generateJWT = function () {
    // 60 day expiration
    var today = new Date();
    var exp = new Date(today);

    exp.setDate(today.getDate() + 60);

    return jwt.sign({
        _id: this._id,
        username: this.username,
        exp: parseInt(exp.getTime() / 1000)
    }, constants.secret);
};

UserSchema.pre('save', function (next) {
    if (this.img.indexOf("?") > -1) {
        var original = this.img.substring(0, this.img.indexOf('?'));
        this.img = original + "?" + new Date().getTime();
    } else if (this.img === "generated") {
    } else {
        this.img += "?" + new Date().getTime();
    }

    next();
});

UserSchema.plugin(mongoosePaginate);

var UserModel = mongoose.model('User', UserSchema);

var createHash = function (password) {
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};

var checkHashedEquality = function (str1, str2) {
    return bCrypt.compareSync(str2, str1);
};

module.exports = UserModel;