var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');
var slug = require('slug');

var PlaylistSchema = new Schema({
    name: String,
    description: String,

    tags: [String],
    views: {type: Number, default: 1},
    dateCreated: {type: Date, default: Date.now},

    // username
    createdBy: String,

    tracks: [{}],

    slug: String,

    // generated refers to using a placeholder/other means
    art: {type: String, default: "generated"},
    // array of usernames who liked
    likes: [{}],

    comments: [{}]
}, {
    collection: 'playlists'
});

// before initial save, adjust fields
PlaylistSchema.pre('save', function (next) {
    if (this.isModified()) {
        if (this.isModified("name")) {
            this.slug = slug(this.name);
        }
    }

    if (this.art.indexOf("?") > -1) {
        var original = this.art.substring(0, this.art.indexOf('?'));
        this.art = original + "?" + new Date().getTime();
    } else if (this.art === "generated") {
    } else {
        this.art += "?" + new Date().getTime();
    }

    next();
});

PlaylistSchema.plugin(mongoosePaginate);

var PlaylistModel = mongoose.model('Playlist', PlaylistSchema);

module.exports = PlaylistModel;