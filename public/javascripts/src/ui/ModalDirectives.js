app.directive("openLogin", function () {
    return {
        link: function ($scope, element) {
            $(element).click(function (e) {
                e.stopPropagation();
                $("#login-navbar-link").dropdown('toggle');
            });
        }
    };
});

app.directive("closeRegister", function () {
    return {
        link: function ($scope, element) {
            $(element).click(function (e) {
                e.stopPropagation();
                $("#register-modal").modal('toggle');
            });
        }
    };
});

app.directive('login', function () {
    return {
        replace: true, templateUrl: '/templates/partials/navbar/login.html'
    };
});

app.directive('areYouSureDeleteTracks', function () {
    return {
        replace: true, templateUrl: '/templates/partials/user_playlist/are_you_sure_tracks_delete.html'
    };
});

app.directive('userDrop', function () {
    return {
        replace: true, templateUrl: '/templates/partials/navbar/user_dropdown.html'
    };
});

app.directive("stopProp", function () {
    return {
        link: function ($scope, element) {
            $(element).on('click', function (event) {
                if (!$(event.target).is('a, a *')) {
                    event.stopPropagation();
                }
            });
        }
    };
});
