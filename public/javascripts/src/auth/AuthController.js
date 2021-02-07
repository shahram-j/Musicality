app.controller('AuthCtrl', function ($scope, AuthService, $rootScope) {
    $scope.user = {};

    $scope.register = function () {
        $('#submit-register').prop('disabled', true);

        AuthService.register($scope.user).error(function (error) {
            $scope.registerError = error;
        }).success(function () {
            $('#register-modal').modal('hide');
            $scope.user = {};
        }).finally(function () {
            $('#submit-register').prop('disabled', false);
        });
    };

    $scope.logIn = function () {
        $('#submit-login').prop('disabled', true);

        AuthService.logIn($scope.user).error(function (error) {
            $scope.loginError = error;
        }).success(function () {
            $rootScope.$emit('auth:logged-in', $scope.user.username);
            $scope.user = {};
        }).finally(function () {
            $('#submit-login').prop('disabled', false);
        });
    };
});
