app.controller('AllPlaylistsCtrl', function ($scope, PlaylistsService, PlaylistPagination, NowPlayingService) {
    $scope.pagination = new PlaylistPagination();

    $scope.playTrack = NowPlayingService.playTrack;
});
