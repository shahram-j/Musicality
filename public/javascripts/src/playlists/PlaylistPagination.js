app.factory('PlaylistPagination', function ($http) {
    var PlaylistsPagination = function () {
        this.items = [];
        this.busy = false;
        this.page = 1;
        this.done = false;
    };

    PlaylistsPagination.prototype.nextPage = function () {
        if (!this.done) {
            if (this.busy) {
                return;
            }

            this.busy = true;
            var url = "/api/playlists/page/" + this.page;

            $http.get(url).success(function (data) {
                if (_.isEmpty(data)) {
                    this.done = true;

                    return;
                }

                for (var i = 0; i < data.length; i++) {
                    data[i].featuredTracks = getRandomArrayVals(data[i].tracks, 3);
                    this.items.push(data[i]);
                }

                this.page += 1;
                this.busy = false;
            }.bind(this));
        }
    };

    return PlaylistsPagination;
});