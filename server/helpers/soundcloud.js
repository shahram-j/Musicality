var SC = require('node-soundcloud');

SC.CLIENT_ID = "587aa2d384f7333a886010d5f52f302a";

SC.init({
    id: SC.CLIENT_ID
});

module.exports = SC;