app.factory("AuthService", ["$http", "$window", function ($http, $window) {
    var auth = {};

    auth.saveToken = function (token) {
        $window.localStorage["musicality-token"] = token;
    };

    auth.getToken = function () {
        return $window.localStorage["musicality-token"];
    };

    auth.isLoggedIn = function () {
        var token = auth.getToken();

        if (token) {
            var payload = JSON.parse($window.atob(token.split(".")[1]));

            return payload.exp > Date.now() / 1000;
        } else {
            return false;
        }
    };

    auth.currentUser = function () {
        if (auth.isLoggedIn()) {
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split(".")[1]));

            return payload.username;
        } else {
            return ""; // should constitute to reliable equality measures since it is an empty string
        }
    };

    auth.register = function (user) {
        return $http.post("/api/register", user).success(function (data) {
            auth.saveToken(data.token);
        });
    };

    auth.logIn = function (user) {
        return $http.post("/api/login", user).success(function (data) {
            auth.saveToken(data.token);
        });
    };

    auth.end = function () {
        $window.localStorage.removeItem("musicality-token");
    };

    return auth;
}]);