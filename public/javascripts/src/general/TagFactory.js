app.factory("TagService", function ($http) {
    var tags = {};

    tags.getAllTags = function () {
        return $http.get("/api/tags");
    };

    return tags;
});