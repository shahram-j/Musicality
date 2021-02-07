app.directive('playlistArt', function () {
    return {
        templateUrl: '/templates/partials/user_playlist/playlist_art.html'
    };
});

app.directive('playlistDetails', function () {
    return {
        templateUrl: '/templates/partials/user_playlist/playlist_details.html'
    };
});

app.directive('playlistSummary', function () {
    return {
        templateUrl: '/templates/partials/user_playlist/playlist_summary.html'
    };
});

app.directive('playlistToolbar', function () {
    return {
        templateUrl: '/templates/partials/user_playlist/playlist_toolbar.html'
    };
});

app.directive('tracks', function () {
    return {
        templateUrl: '/templates/partials/user_playlist/tracks.html'
    };
});

app.directive('tracksEdit', function () {
    return {
        templateUrl: '/templates/partials/user_playlist/tracks_edit.html'
    };
});

app.directive('comments', function () {
    return {
        templateUrl: '/templates/partials/user_playlist/comments.html'
    };
});

app.directive('tagsEdit', function () {
    return {
        templateUrl: '/templates/partials/user_playlist/tags.html'
    };
});

app.directive('authorPlaylists', function () {
    return {
        templateUrl: '/templates/partials/user_playlist/author_playlists.html'
    };
});

app.directive('likes', function () {
    return {
        templateUrl: '/templates/partials/user_playlist/likes.html'
    };
});

app.directive("contenteditable", function (PlaylistsService, $state, FlashService) {
    return {
        require: "ngModel", link: function ($scope, element, attrs, ngModel) {
            function read() {
                ngModel.$setViewValue(element.text());
            }

            ngModel.$render = function () {
                element.text(ngModel.$viewValue || "");
            };

            element.bind("blur keyup change", function () {
                $scope.fieldsChangeMessage = "";

                $scope.$apply(read);
            });

            element.bind("keydown", function (event) {
                $scope.fieldsChangeMessage = "";

                // enter key listener
                if (event.which === 13) {
                    $(element).blur();
                    window.getSelection().removeAllRanges();
                }
            });

            // only when the variable has completely changed (not during the editing stage)
            element.bind("blur", function () {
                // must be name
                if ($(element).hasClass("playlist-edit-name")) {
                    PlaylistsService.updateName($scope.playlist, $scope.changeableAttributes.name).then(function (data) {
                        // same name as before on the same playlist
                        if (data.data.message === "You already have a playlist with that name." && $scope.playlist.name === $scope.changeableAttributes.name) {
                            $scope.changeableAttributes.name = $scope.playlist.name;
                        } else {
                            if (data.data.redirectUrl) {
                                FlashService.fieldsChangeMessage = data.data.message;
                                $state.go('user_playlist', {
                                    username: $scope.playlist.createdBy,
                                    playlistSlug: data.data.redirectUrl
                                });
                            }
                        }
                    });
                }
                // description
                else {
                    if ($scope.changeableAttributes.description !== $scope.playlist.description) {
                        PlaylistsService.updatePlaylistFields($scope.playlist, {description: $scope.changeableAttributes.description}).success(function () {
                            $scope.fieldsChangeMessage = "The description was successfully updated.";
                        })
                    }
                }
            });
        }
    };
});

