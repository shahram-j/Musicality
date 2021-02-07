var Youtube = require("youtube-api");

Youtube.authenticate({
    type: "key",
    key: "AIzaSyBqg3-uVe0RtlpZ7cAhwUOhZJU18NPT9SU"
});

module.exports = Youtube;