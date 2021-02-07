app.controller('HomeCtrl', function ($scope, PlaylistsService, NowPlayingService, $timeout) {
    $scope.playTrack = NowPlayingService.playTrack;

    $scope.clear = function () {
        clearMainSearch($timeout);
    };

    PlaylistsService.getRecentPlaylists().success(function (recents) {
        $scope.recentPlaylists = recents;

        $scope.recentPlaylists.forEach(function (playlist) {
            playlist.featuredTracks = getRandomArrayVals(playlist.tracks, 3);
        });
    });
});

