app.factory("UserService", function ($http, AuthService) {
    var user = {};

    user.getAllUsers = function () {
        return $http.get("/api/users");
    };

    user.getUserDetails = function (username) {
        return $http.get("/api/users/" + username);
    };

    user.uploadProfileImg = function (username, image) {
        var formData = new FormData();
        formData.append('image', image);

        return $http.post('/api/users/' + username + "/image", formData, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined, "Authorization": "Bearer " + AuthService.getToken()}
        });
    };

    user.updateUserProfile = function (username, body) {
        var updateUser = {
            method: 'PUT', url: '/api/users/' + username, headers: {
                "Authorization": "Bearer " + AuthService.getToken()
            }, data: body
        };

        return $http(updateUser);
    };

    return user;
});
