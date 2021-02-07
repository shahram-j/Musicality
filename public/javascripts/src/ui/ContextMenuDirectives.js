app.run(function ($rootScope, $timeout) {
    // destroy all existing context menus
    $rootScope.$on('auth:logged-in', function () {
        $.contextMenu('destroy');
        clearMainSearch($timeout);
    });
    $rootScope.$on("auth:logged-out", function () {
        $.contextMenu('destroy');
        clearMainSearch($timeout);
    });
});

app.directive("playlistArtMenu", function (PlaylistsService) {
    return {
        link: function ($scope, element) {
            $scope.$watch('isAuthor', function (newVal) {
                if (newVal !== undefined) {
                    var items = {};

                    if (newVal === true) {
                        items.changeArt = {
                            name: "Change playlist art", callback: function () {
                                $(element).trigger('click');
                            }
                        };

                        items.deleteArt = {
                            name: "Remove playlist art", callback: function () {
                                PlaylistsService.updatePlaylistFields($scope.playlist, {art: 'generated'}).success(function () {
                                    $scope.changeableAttributes.playlistArt = 'generated';
                                });
                            }
                        }
                    }

                    if ($scope.changeableAttributes.playlistArt !== "generated") {
                        items.getDirectLink = {
                            name: "Get direct link to art", callback: function () {
                                window.location.href = $scope.changeableAttributes.playlistArt;
                            }
                        };
                    }

                    // make sure there's actually items present
                    if (!_.isEmpty(items)) {
                        $.contextMenu({
                            selector: ".playlist-art-menu", items: items, trigger: "hover", autoHide: true
                        });
                    }
                }
            });
        }
    };
});

app.directive("profileImage", function (UserService, AuthService) {
    return {
        link: function ($scope, element) {
            $scope.$watch('isAuthor', function (newVal) {
                if (newVal !== undefined) {
                    // to be sure
                    $.contextMenu('destroy', ".profile-img-menu");

                    var items = {};

                    if (newVal === true) {
                        items.changeArt = {
                            name: "Change profile art", callback: function () {
                                $(element).trigger('click');
                            }
                        };

                        items.deleteArt = {
                            name: "Remove profile image", callback: function (key, opt) {
                                UserService.updateUserProfile(AuthService.currentUser(), {img: 'generated'}).success(function () {
                                    $scope.changeableAttributes.profileImg = 'generated';
                                });
                            }
                        }
                    }

                    if ($scope.changeableAttributes.profileImg !== "generated") {
                        items.getDirectLink = {
                            name: "Get direct link to profile image", callback: function () {
                                window.location.href = $scope.changeableAttributes.profileImg;
                            }
                        };
                    }

                    if (!_.isEmpty(items)) {
                        $.contextMenu({
                            selector: ".profile-img-menu", items: items, trigger: "hover", autoHide: true
                        });
                    }
                }
            });
        }
    };
});

app.directive("addToPlaylist", function ($state, PlaylistsService, AuthService, $compile, $rootScope, $timeout) {
    return {
        link: function ($scope, element) {
            $("td.not-td-link").click(function (e) {
                e.stopPropagation();
            });

            $rootScope.$on("auth:logged-in", function () {
                preRunDirective();
            });

            $rootScope.$on("auth:logged-out", function () {
                preRunDirective();
            });

            preRunDirective();

            function preRunDirective() {
                $timeout(function () {
                    runDirective();
                });
            }

            function runDirective() {
                var items = {};

                if (AuthService.isLoggedIn()) {
                    PlaylistsService.getAllPlaylists({createdBy: AuthService.currentUser()}).success(function (playlists) {
                        items["track-to-add"] = {
                            isHtmlName: true,
                            name: "Choose a playlist to add '<strong>" +
                            $(element).attr("title") + "</strong>' from <strong>" + $(element).attr("tsource") +
                            "</strong> to...",
                            className: "track-to-add"
                        };

                        items["new-playlist"] = {
                            isHtmlName: true,
                            name: '<span class="middle-align"><i class="material-icons" style="display: inline;">add</i> ' +
                            '<span>create a new playlist</span></span>',
                            callback: function () {
                                PlaylistsService.createNewAndRedirect();
                            }
                        };

                        playlists.forEach(function (playlist) {
                            items[playlist._id] = {
                                name: playlist.name, callback: function () {
                                    PlaylistsService.addTrackToPlaylist(playlist, {
                                        title: $(element).attr("title"),
                                        source: $(element).attr("tsource"),
                                        playbackURL: $(element).attr("playback-url")
                                    }).success(function () {
                                        $.notify("Track added successfully.", {
                                            "style": "below-nav"
                                        });
                                    }).error(function (err) {
                                        $.notify(err.message, {
                                            "style": "below-nav"
                                        });
                                    });
                                }
                            };
                        });

                        var randomId = Math.random().toString(36).slice(2);
                        $(element).addClass("main-search-item-" + randomId);

                        var selector = ".main-search-item-" + randomId;

                        $.contextMenu({
                            className: 'css-title main-search-context-menu-' + randomId,
                            selector: selector,
                            items: items,
                            trigger: "left",
                            autoHide: true
                        });
                    });
                }
                // if not logged in
                else {
                    var randomId = Math.random().toString(36).slice(2);
                    var compiledLogInLink = $compile("<a open-login href='#'>Log in</a>")($scope);
                    $timeout(function () {
                        $scope.$digest();
                    }, 100);

                    items["not-logged-in"] = {
                        isHtmlName: true,
                        name: "It seems likes you aren't logged in. <span replace-me-login-link></span> " +
                        " or <a href='#' data-toggle='modal' data-target='#register-modal'>sign up</a> to add <strong>"
                        + $(element).attr("title") + "</strong>' from <strong>" + $(element).attr("tsource") +
                        "</strong> to a new playlist.",

                        className: "context-not-logged-in-addplaylist"
                    };

                    $(element).addClass("main-search-item-" + randomId);

                    $.contextMenu({
                        className: 'css-title main-search-context-menu-' + randomId,
                        selector: ".main-search-item-" + randomId,
                        items: items,
                        trigger: "left",
                        autoHide: true
                    });

                    $("[replace-me-login-link]").replaceWith($(compiledLogInLink));
                }
            }
        }
    };
});
