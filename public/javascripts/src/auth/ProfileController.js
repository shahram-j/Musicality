app.controller('ProfileCtrl', function ($state, PlaylistsService, UserService, $scope, $stateParams, AuthService, $rootScope, $timeout) {
    $scope.isLoggedIn = AuthService.isLoggedIn;
    $scope.createNewAndRedirect = PlaylistsService.createNewAndRedirect;

    UserService.getUserDetails($stateParams.username).success(function (user) {
        $scope.exists = true;
        $scope.user = user;

        $scope.refreshAuthor();

        $scope.changeableAttributes = {};
        $scope.changeableAttributes.profileImg = $scope.user.img;
    }).error(function () {
        $scope.exists = false;
    });

    $scope.refreshAuthor = function () {
        if ($scope.exists) {
            if (!$scope.isLoggedIn()) {
                $scope.isAuthor = false;
                return;
            }
            $scope.isAuthor = $stateParams.username === AuthService.currentUser();
        }
    };

    $scope.uploadProfileImg = function (image) {
        var reader = new window.FileReader();
        try {
            reader.readAsDataURL(image);
        } catch (e) {
        }
        reader.onloadend = function () {
            if (image) {
                UserService.uploadProfileImg(AuthService.currentUser(), image).success(function (data) {
                    $scope.changeableAttributes.profileImgNew = reader.result;
                    $scope.changeableAttributes.profileImg = data.user.img;

                    $.notify("You have successfully changed your profile image.", {
                        "style": "below-nav"
                    });
                })
            }
        };
    };

    $rootScope.$on('auth:logged-in', function () {
        $timeout(function () {
            $scope.refreshAuthor();
        }, 0);
    });

    $rootScope.$on("auth:logged-out", function () {
        $timeout(function () {
            $scope.refreshAuthor();
        }, 0);
    });
});

