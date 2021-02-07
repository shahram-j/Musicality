app.controller('NavCtrl', function ($window, $scope, $rootScope, $http, AuthService, PlaylistsService, $state, NowPlayingService) {
    $scope.isLoggedIn = AuthService.isLoggedIn;
    $scope.currentUser = AuthService.currentUser;

    $scope.endNowPlaying = NowPlayingService.endNowPlaying;
    $scope.reloadCurrentPlaylist = NowPlayingService.reloadCurrentPlaylist;
    $scope.getSCState = NowPlayingService.getSCState;
    $scope.setSCState = NowPlayingService.setSCState;
    $scope.playTrack = NowPlayingService.playTrack;
    $scope.getNowPlaying = NowPlayingService.getNowPlaying;
    $scope.toggleTrackState = NowPlayingService.toggleTrackState;
    $scope.getPlayerState = NowPlayingService.getPlayerState;
    $scope.playNextTrack = NowPlayingService.playNextTrack;
    $scope.hasNextTrack = NowPlayingService.hasNextTrack;
    $scope.playPreviousTrack = NowPlayingService.playPreviousTrack;
    $scope.hasPreviousTrack = NowPlayingService.hasPreviousTrack;
    $scope.volumeUp = NowPlayingService.volumeUp;
    $scope.volumeDown = NowPlayingService.volumeDown;
    $scope.volumeMute = NowPlayingService.volumeMute;
    $scope.getYTPlayer = NowPlayingService.getYTPlayer;
    $scope.getSCPlayer = NowPlayingService.getSCPlayer;

    $scope.logOut = function () {
        $rootScope.$emit("auth:logged-out", "");
        AuthService.end();
    };

    $scope.createNewBlankPlaylist = PlaylistsService.createNewAndRedirect;

    $rootScope.$on("yt-state-change", function (event, data) {
        if (data === YT.PlayerState.ENDED) {
            if ($scope.hasNextTrack()) {
                $scope.playNextTrack();
            }
        }

        $scope.$apply();
    });

    $rootScope.$on("sc-state-change", function (event, data) {
        $scope.scState = data;

        // we get those pesky '$apply in progress' errors if we
        // don't wrap this in a delayed task
        setTimeout(function () {
            $scope.$apply();
        }, 100);
    });

    $rootScope.$on("volume-change", function (event, data) {
        setTimeout(function () {
            $scope.volume = data;

            $scope.$apply();
        }, 100);
    });

    // on player ready
    $rootScope.$on("yt-ready", function (event, data) {
        data.target.setVolume(100);
        $scope.volume = 100;

        $scope.$apply();
    });

    // disable check for play/pause buttons
    $scope.playPauseCondition = function () {
        try {
            return $scope.getYTPlayer().getPlayerState() === 3;
        } catch (e) {
        }
    };

    // whether play button should show
    $scope.playCondition = function () {
        try {
            // prevent errors on each digest cycle
            if ($scope.getNowPlaying()) {
                if ($scope.getNowPlaying().track.source === "YouTube") {
                    return $scope.getYTPlayer().getPlayerState() === 2 || $scope.getYTPlayer().getPlayerState() === 3 || $scope.getYTPlayer().getPlayerState() === 0;
                } else if ($scope.getNowPlaying().track.source === "SoundCloud") {
                    return $scope.getSCState() === 2 || $scope.getSCState() === 0;
                }
            }
        } catch (ex) {
        }
        return !$scope.getNowPlaying();
    };

    // whether pause button should show
    $scope.pauseCondition = function () {
        try {
            if ($scope.getNowPlaying()) {
                if ($scope.getNowPlaying().track.source === "YouTube") {
                    return $scope.getYTPlayer().getPlayerState() === 1;
                } else if ($scope.getNowPlaying().track.source === "SoundCloud") {
                    return $scope.getSCState() === 1;
                }
            }
        } catch (ex) {
        }
        return !$scope.getNowPlaying();
    };
});
