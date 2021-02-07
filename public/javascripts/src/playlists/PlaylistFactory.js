app.factory("PlaylistsService", function ($state, $http, AuthService) {
    var playlist = {};

    playlist.getAllPlaylists = function (params) {
        return $http({
            method: "GET", url: "/api/playlists", params: params
        });
    };

    playlist.getRecentPlaylists = function (params) {
        return $http({
            method: "GET", url: "/api/playlists/recent", params: params
        });
    };

    playlist.createNewBlankPlaylist = function () {
        var createBlankPlaylist = {
            method: 'POST', url: '/api/playlists/blank', headers: {
                "Authorization": "Bearer " + AuthService.getToken()
            }
        };

        return $http(createBlankPlaylist);
    };

    playlist.createNewAndRedirect = function () {
        playlist.createNewBlankPlaylist().success(function (playlist) {
            $state.go('user_playlist', {username: playlist.createdBy, playlistSlug: playlist.slug});
        });
    };

    playlist.addView = function (playlist) {
        return $http({
            method: "PUT", url: "/api/playlists/" + playlist._id + "/views"
        });
    };

    playlist.updateName = function (playlist, name) {
        var updatePlaylist = {
            method: 'PUT', url: '/api/playlists/' + playlist._id + "/name", headers: {
                "Authorization": "Bearer " + AuthService.getToken()
            }, data: {name: name}
        };

        return $http(updatePlaylist);
    };

    playlist.updatePlaylistFields = function (playlist, body) {
        var updatePlaylist = {
            method: 'PUT', url: '/api/playlists/' + playlist._id, headers: {
                "Authorization": "Bearer " + AuthService.getToken()
            }, data: body
        };

        return $http(updatePlaylist);
    };

    playlist.addTagToPlaylist = function (playlist, tag) {
        var addPlaylistTag = {
            method: 'PUT', url: '/api/playlists/' + playlist._id + "/tags", headers: {
                "Authorization": "Bearer " + AuthService.getToken()
            }, data: {tag: tag}
        };

        return $http(addPlaylistTag);
    };

    playlist.deleteTagFromPlaylist = function (playlist, tag) {
        var deletePlaylistTag = {
            method: 'DELETE', url: '/api/playlists/' + playlist._id + "/tags", headers: {
                "Authorization": "Bearer " + AuthService.getToken(), "Content-Type": "application/json"
            }, data: {tag: tag}
        };

        return $http(deletePlaylistTag);
    };

    playlist.addPlaylistComment = function (playlist, comment) {
        var addComment = {
            method: 'PUT', url: '/api/playlists/' + playlist._id + "/comments", headers: {
                "Authorization": "Bearer " + AuthService.getToken()
            }, data: {comment: comment, created: Date.now()}
        };

        return $http(addComment);
    };

    playlist.deletePlaylistComment = function (playlist, username, comment) {
        var deleteComment = {
            method: 'DELETE', url: '/api/playlists/' + playlist._id + "/comments", headers: {
                "Authorization": "Bearer " + AuthService.getToken(), "Content-Type": "application/json"
            }, data: {username: username, comment: comment}
        };

        return $http(deleteComment);
    };

    playlist.likePlaylist = function (playlist) {
        var like = {
            method: 'PUT', url: '/api/playlists/' + playlist._id + "/likes", headers: {
                "Authorization": "Bearer " + AuthService.getToken()
            }
        };

        return $http(like);
    };

    playlist.unlikePlaylist = function (playlist) {
        var unlike = {
            method: 'DELETE', url: '/api/playlists/' + playlist._id + "/likes", headers: {
                "Authorization": "Bearer " + AuthService.getToken(), "Content-Type": "application/json"
            }
        };

        return $http(unlike);
    };

    playlist.addTrackToPlaylist = function (playlist, track) {
        var addPlaylistTag = {
            method: 'PUT', url: '/api/playlists/' + playlist._id + "/tracks", headers: {
                "Authorization": "Bearer " + AuthService.getToken()
            }, data: track
        };

        return $http(addPlaylistTag);
    };

    playlist.deleteTrackFromPlaylist = function (playlist, playbackURL) {
        var deletePlaylistTrack = {
            method: 'DELETE', url: '/api/playlists/' + playlist._id + "/tracks", headers: {
                "Authorization": "Bearer " + AuthService.getToken(), "Content-Type": "application/json"
            }, data: {playbackURL: playbackURL}
        };

        return $http(deletePlaylistTrack);
    };

    playlist.deleteAllPlaylistTracks = function (playlist) {
        var deletePlaylistTrack = {
            method: 'DELETE', url: '/api/playlists/' + playlist._id + "/tracks/all", headers: {
                "Authorization": "Bearer " + AuthService.getToken(), "Content-Type": "application/json"
            }
        };

        return $http(deletePlaylistTrack);
    };

    playlist.uploadPlaylistArt = function (playlist, image) {
        var formData = new FormData();
        formData.append('image', image);

        return $http.post('/api/playlists/' + playlist._id + "/image", formData, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined, "Authorization": "Bearer " + AuthService.getToken()}
        });
    };

    return playlist;
});
