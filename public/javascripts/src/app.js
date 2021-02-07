var app = angular.module("app", ["ui.router", 'ngFileUpload', 'ngAnimate', 'infinite-scroll']);

angular.module('infinite-scroll').value('THROTTLE_MILLISECONDS', 250);

// initialization
app.run(function () {
    $.notify.addStyle('below-nav', {
        html: "<div><span data-notify-text/></div>", classes: {
            base: {
                "background-color": "#B80A5F", "color": "white", "padding": "10px"
            }
        }
    });
});

app.config(function ($stateProvider, $urlRouterProvider, $locationProvider, $logProvider) {
    $locationProvider.html5Mode(({enabled: true, requireBase: false}));
    $logProvider.debugEnabled(true);

    $stateProvider.state("home", {
        url: "/", templateUrl: "/templates/home.html", controller: "HomeCtrl"
    }).state("all_playlists", {
        url: "/playlists", templateUrl: "/templates/all_playlists.html", controller: "AllPlaylistsCtrl"
    }).state('profile', {
        url: "/profile/:username", templateUrl: '/templates/user_profile.html', controller: "ProfileCtrl"
    }).state('user_playlist', {
        url: "/:username/:playlistSlug", templateUrl: '/templates/user_playlist.html', controller: "PlaylistCtrl"
    }).state('all_profiles', {
        url: "/profiles", templateUrl: '/templates/all_profiles.html', controller: "AllProfilesCtrl"
    });

    // if app receives an undefined URL, go to index
    $urlRouterProvider.otherwise("/");
});
