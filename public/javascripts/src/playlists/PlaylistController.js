app.controller('PlaylistCtrl', function ($scope, $stateParams, AuthService, PlaylistsService, NowPlayingService, $rootScope, $timeout, FlashService, UserService) {
    $scope.currentUser = AuthService.currentUser;
    $scope.isLoggedIn = AuthService.isLoggedIn;
    $scope.getUserDetails = UserService.getUserDetails;

    $scope.playTrack = function (track) {
        NowPlayingService.playTrack(track, $scope.playlist);
    };
    $scope.playPlaylist = function () {
        NowPlayingService.playPlaylist($scope.playlist);
    };

    PlaylistsService.getAllPlaylists({createdBy: $stateParams.username}).success(function (userPlaylists) {
        $scope.playlist = _.findWhere(userPlaylists, {slug: $stateParams.playlistSlug});

        // only do the rest of the initialization if there is a playlist present
        if ($scope.playlist) {
            // preconditions for the template
            $scope.exists = true;
            $scope.refreshLiked();
            $scope.refreshAuthor();

            // see if the user edited any fields before to get onto this page
            if (FlashService.fieldsChangeMessage !== "") {
                $scope.fieldsChangeMessage = FlashService.fieldsChangeMessage;

                NowPlayingService.reloadCurrentPlaylist();

                // reset the flash name/description field
                FlashService.fieldsChangeMessage = "";
            }

            // queue for track adding
            $scope.tracksToBeAdded = [];

            // contenteditable elements
            $scope.changeableAttributes = {};
            $scope.changeableAttributes.name = $scope.playlist.name;
            $scope.changeableAttributes.description = $scope.playlist.description;
            $scope.changeableAttributes.playlistArt = $scope.playlist.art;
            $scope.changeableAttributes.comment = "";

            // syntactic sugar
            $scope.tags = $scope.playlist.tags;
            $scope.comments = $scope.playlist.comments;
            $scope.comments.forEach(function (comment) {
                $scope.getProfileImgFromObj(comment).success(function (user) {
                    comment.img = user.img;
                });
            });
            $scope.likes = $scope.playlist.likes;
            $scope.likes.forEach(function (like) {
                $scope.getProfileImgFromObj(like).success(function (user) {
                    like.img = user.img;
                });
            });
            $scope.tracks = $scope.playlist.tracks;

            // remove current playlist
            $scope.allAuthorPlaylists = _.filter(userPlaylists, function (each) {
                return each.name !== $scope.playlist.name;
            });
            // remove any below 3 tracks
            $scope.above3AuthorPlaylists = _.reject($scope.allAuthorPlaylists, function (each) {
                return each.tracks.length < 3;
            });

            // increment views
            PlaylistsService.addView($scope.playlist);
        } else {
            $scope.exists = false;
        }
    });

    $scope.addTag = function () {
        var newTag = $scope.tags.newTag;

        if (newTag) {
            if ($scope.tags.indexOf(newTag) > -1) {
                $scope.error = "Your playlist already contains that tag.";

                $scope.tags.newTag = '';
            } else {
                $scope.playlist.tags.push(newTag);
                $scope.error = "";

                $scope.tags.newTag = '';
                $('#tags-search').typeahead('val', "");

                PlaylistsService.addTagToPlaylist($scope.playlist, newTag);
            }
        }
    };

    $scope.deleteTag = function (playlist, tag) {
        PlaylistsService.deleteTagFromPlaylist($scope.playlist, tag);

        remove($scope.tags, tag);
        $scope.error = "";
    };

    $scope.addTrackToBeAdded = function (suggestion) {
        var duplicateQueue = _.findWhere($scope.tracksToBeAdded, {playbackURL: suggestion.playbackURL});
        if (!duplicateQueue) {
            $scope.message = "";

            $scope.tracksToBeAdded.push(suggestion);
            // get rid of input in model
            $scope.tracksToBeAdded.newTrack = "";
            $('#quick-add-search').typeahead('val', "");
        } else {
            $scope.message = "That track is already in the to-be-added queue!";
        }
    };

    $scope.addTracksInQueueToPlaylist = function () {
        // there must be tracks in the queue before any addition is carried out
        if (!_.isEmpty($scope.tracksToBeAdded)) {
            var duplicateFound = false;

            $scope.tracksToBeAdded.forEach(function (track) {
                var duplicateExistingTracks = _.findWhere($scope.tracks, {playbackURL: track.playbackURL});
                if (!duplicateExistingTracks) {
                    $scope.addTrackToPlaylist(track);
                } else {
                    duplicateFound = true;
                }
            });

            $scope.tracksToBeAdded = [];

            if (duplicateFound) {
                $scope.message = "Duplicates were found so some tracks may not have been added.";
            } else {
                $scope.message = "Tracks successfully added. Perhaps you'd want to add a few more?";
            }
        }
    };

    $scope.removeTrackFromAddQueue = function (title, playbackURL) {
        $scope.tracksToBeAdded.forEach(function (each) {
            if (each.title === title) {
                if (each.playbackURL === playbackURL) {
                    remove($scope.tracksToBeAdded, each);
                }
            }
        });
    };

    $scope.addTrackToPlaylist = function (track) {
        PlaylistsService.addTrackToPlaylist($scope.playlist, track).success(function () {
            $scope.tracks.push(track);
            NowPlayingService.reloadCurrentPlaylist();
        });
    };

    $scope.deleteTrackFromPlaylist = function (playbackURL) {
        for (var i = 0; i < $scope.tracks.length; i++) {
            var track = $scope.tracks[i];

            if (track.playbackURL === playbackURL) {
                $scope.tracks.splice(i, 1);
                break;
            }
        }

        PlaylistsService.deleteTrackFromPlaylist($scope.playlist, playbackURL);
    };

    $scope.deleteAllTracks = function () {
        PlaylistsService.deleteAllPlaylistTracks($scope.playlist).success(function () {
            $.notify("Finished deleting all tracks from the playlist.", {
                "style": "below-nav"
            });

            $scope.tracks = [];

            $scope.hideDeleteModal();
        });
    };

    $scope.hideDeleteModal = function () {
        $('#tracks-delete-modal').modal('hide');
    };

    $scope.uploadArt = function (image) {
        var reader = new window.FileReader();

        reader.readAsDataURL(image);
        reader.onloadend = function () {
            // only if an image is available
            if (image) {
                PlaylistsService.uploadPlaylistArt($scope.playlist, image).success(function (data) {
                    $scope.changeableAttributes.playlistArtNew = reader.result;
                    $scope.changeableAttributes.playlistArt = data.playlist.art;

                    $.notify("Playlist art changed successfully.", {
                        "style": "below-nav"
                    });
                });
            }
        };
    };

    // playlist author check
    $scope.refreshAuthor = function () {
        // only refresh if playlist exists
        if ($scope.exists) {
            if (!$scope.isLoggedIn()) {
                $scope.isAuthor = false;

                return;
            }

            $scope.isAuthor = $scope.playlist.createdBy === AuthService.currentUser();
        }
    };

    $scope.addComment = function () {
        // get rid of the previous message if there is one
        $scope.commentActionMsg = "";

        var comment = $scope.changeableAttributes.comment;

        if (comment) {
            PlaylistsService.addPlaylistComment($scope.playlist, $scope.changeableAttributes.comment).success(function (data) {
                $scope.commentActionMsg = data.message;

                $scope.getProfileImgFromObj(data.addedComment).success(function (res) {
                    data.addedComment.img = res.img;
                    $scope.comments.push(data.addedComment);
                });
            }).error(function (err) {
                $scope.commentActionMsg = err.message;
                $scope.changeableAttributes.comment = "";
            });
        }
    };

    $scope.deleteComment = function (username, comment) {
        $scope.commentActionMsg = "";

        PlaylistsService.deletePlaylistComment($scope.playlist, username, comment).success(function (data) {
            $scope.commentActionMsg = data.message;
            $scope.comments = _.reject($scope.comments, function (each) {
                // $$hashkey (by the angular library) and other attributes are added so we
                // have to manually check the main properties ourselves
                return (each.username === data.delComment.username) && (each.created === data.delComment.created) && (each.comment === data.delComment.comment);
            });
        }).error(function (err) {
            // precaution if the user does have the 'delete comment' button shown by some means
            $scope.commentActionMsg = err.message;
        });
    };

    $scope.clearComments = function () {
        $scope.changeableAttributes.comment = "";
    };

    $scope.like = function () {
        PlaylistsService.likePlaylist($scope.playlist).success(function (data) {
            $scope.getProfileImgFromObj(data.addedLike).success(function (res) {
                data.addedLike.img = res.img;
                $scope.playlist.likes.push(data.addedLike);
                $scope.refreshLiked();
            });
        });
    };

    $scope.refreshLiked = function () {
        if ($scope.exists) {
            if ($scope.isLoggedIn()) {
                var liked = _.findWhere($scope.playlist.likes, {username: $scope.currentUser()});
                $scope.liked = !!liked;

                return;
            }
        }

        $scope.liked = true;
    };

    $scope.unlike = function () {
        PlaylistsService.unlikePlaylist($scope.playlist).success(function (data) {
            $scope.playlist.likes.splice($scope.playlist.likes.indexOf(data.delLike), 1);
            $scope.refreshLiked();
        });
    };

    $scope.getProfileImgFromObj = function (obj) {
        return $scope.getUserDetails(obj.username);
    };

    // event listeners, react to log in and log out, updates view accordingly

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
