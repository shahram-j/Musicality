app.factory('UserPagination', function ($http) {
    var UserPagination = function () {
        this.items = [];
        this.busy = false;
        this.page = 1;
        this.done = false;
    };

    UserPagination.prototype.nextPage = function () {
        if (!this.done) {
            if (this.busy) {
                return;
            }

            this.busy = true;
            var url = "/api/users/page/" + this.page;

            $http.get(url).success(function (data) {
                if (_.isEmpty(data)) {
                    this.done = true;

                    return;
                }

                for (var i = 0; i < data.length; i++) {
                    this.items.push(data[i]);
                }

                this.page += 1;
                this.busy = false;
            }.bind(this));
        }
    };

    return UserPagination;
});