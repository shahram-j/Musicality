var youtube = new Bloodhound({
    remote: {
        url: '/api/youtube/search/%QUERY%', wildcard: '%QUERY%'
    }, datumTokenizer: Bloodhound.tokenizers.whitespace('q'), queryTokenizer: Bloodhound.tokenizers.whitespace
});
var soundcloud = new Bloodhound({
    remote: {
        url: '/api/soundcloud/search/%QUERY%', wildcard: '%QUERY%'
    }, datumTokenizer: Bloodhound.tokenizers.whitespace('q'), queryTokenizer: Bloodhound.tokenizers.whitespace
});
function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}
function remove(arr, what) {
    var found = arr.indexOf(what);
    while (found !== -1) {
        arr.splice(found, 1);
        found = arr.indexOf(what);
    }
}
function getVideoId(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : false;
}
function getRandomArrayVals(arr, count) {
    var tmp = arr.slice(arr);
    var ret = [];
    for (var i = 0; i < count; i++) {
        var index = Math.floor(Math.random() * tmp.length);
        var removed = tmp.splice(index, 1);
        ret.push(removed[0]);
    }
    return ret;
}
function clearMainSearch($timeout) {
    $('#search_bar').val("");
    $timeout(function () {
        $('[search-bar]').typeahead('val', '');
    }, 0);
}
var app = angular.module("app", ["ui.router", 'ngFileUpload', 'ngAnimate', 'infinite-scroll']);
angular.module('infinite-scroll').value('THROTTLE_MILLISECONDS', 250);
app.run(function () {
    $.notify.addStyle('below-nav', {
        html: "<div><span data-notify-text/></div>", classes: {
            base: {
                "background-color": "#B80A5F", "color": "white", "padding": "10px"
            }
        }
    });
});
app.config(["$stateProvider", "$urlRouterProvider", "$locationProvider", "$logProvider", function ($stateProvider, $urlRouterProvider, $locationProvider, $logProvider) {
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
    $urlRouterProvider.otherwise("/");
}]);
app.controller('AllProfilesCtrl', ["$scope", "UserPagination", function ($scope, UserPagination) {
    $scope.pagination = new UserPagination();
}]);
app.controller('AuthCtrl', ["$scope", "AuthService", "$rootScope", function ($scope, AuthService, $rootScope) {
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
}]);
app.factory("AuthService", ["$http", "$window", function ($http, $window) {
    var auth = {};
    auth.saveToken = function (token) {
        $window.localStorage["musicality-token"] = token;
    };
    auth.getToken = function () {
        return $window.localStorage["musicality-token"];
    };
    auth.isLoggedIn = function () {
        var token = auth.getToken();
        if (token) {
            var payload = JSON.parse($window.atob(token.split(".")[1]));
            return payload.exp > Date.now() / 1000;
        } else {
            return false;
        }
    };
    auth.currentUser = function () {
        if (auth.isLoggedIn()) {
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split(".")[1]));
            return payload.username;
        } else {
        }
    };
    auth.register = function (user) {
        return $http.post("/api/register", user).success(function (data) {
            auth.saveToken(data.token);
        });
    };
    auth.logIn = function (user) {
        return $http.post("/api/login", user).success(function (data) {
            auth.saveToken(data.token);
        });
    };
    auth.end = function () {
        $window.localStorage.removeItem("musicality-token");
    };
    return auth;
}]);
app.controller('ProfileCtrl', ["$state", "PlaylistsService", "UserService", "$scope", "$stateParams", "AuthService", "$rootScope", "$timeout", function ($state, PlaylistsService, UserService, $scope, $stateParams, AuthService, $rootScope, $timeout) {
    $scope.isLoggedIn = AuthService.isLoggedIn;
    $scope.createNewAndRedirect = PlaylistsService.createNewAndRedirect;
    UserService.getUserDetails($stateParams.username).success(function (user) {
        $scope.exists = true;
        $scope.user = user;
        $scope.refreshAuthor();
        $scope.changeableAttributes = {};
        $scope.changeableAttributes.profileImg = $scope.user.img;
    }).error(function () {
        $scope.exists = false;
    });
    $scope.refreshAuthor = function () {
        if ($scope.exists) {
            if (!$scope.isLoggedIn()) {
                $scope.isAuthor = false;
                return;
            }
            $scope.isAuthor = $stateParams.username === AuthService.currentUser();
        }
    };
    $scope.uploadProfileImg = function (image) {
        var reader = new window.FileReader();
        try {
            reader.readAsDataURL(image);
        } catch (e) {
        }
        reader.onloadend = function () {
            if (image) {
                UserService.uploadProfileImg(AuthService.currentUser(), image).success(function (data) {
                    $scope.changeableAttributes.profileImgNew = reader.result;
                    $scope.changeableAttributes.profileImg = data.user.img;
                    $.notify("You have successfully changed your profile image.", {
                        "style": "below-nav"
                    });
                })
            }
        };
    };
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
}]);
app.factory("UserService", ["$http", "AuthService", function ($http, AuthService) {
    var user = {};
    user.getAllUsers = function () {
        return $http.get("/api/users");
    };
    user.getUserDetails = function (username) {
        return $http.get("/api/users/" + username);
    };
    user.uploadProfileImg = function (username, image) {
        var formData = new FormData();
        formData.append('image', image);
        return $http.post('/api/users/' + username + "/image", formData, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined, "Authorization": "Bearer " + AuthService.getToken()}
        });
    };
    user.updateUserProfile = function (username, body) {
        var updateUser = {
            method: 'PUT', url: '/api/users/' + username, headers: {
                "Authorization": "Bearer " + AuthService.getToken()
            }, data: body
        };
        return $http(updateUser);
    };
    return user;
}]);
app.factory('UserPagination', ["$http", function ($http) {
    var UserPagination = function () {
        this.items = [];
        this.busy = false;
        this.page = 1;
        this.done = false;
    };
    UserPagination.prototype.nextPage = function () {
        if (!this.done) {
            if (this.busy) {
                return;
            }
            this.busy = true;
            var url = "/api/users/page/" + this.page;
            $http.get(url).success(function (data) {
                if (_.isEmpty(data)) {
                    this.done = true;
                    return;
                }
                for (var i = 0; i < data.length; i++) {
                    this.items.push(data[i]);
                }
                this.page += 1;
                this.busy = false;
            }.bind(this));
        }
    };
    return UserPagination;
}]);
app.directive('profileImageEditor', function () {
    return {
        templateUrl: '/templates/partials/user_profile/user_img.html'
    };
});
app.directive('userDetails', function () {
    return {
        templateUrl: '/templates/partials/user_profile/user_details.html'
    };
});
app.factory("FlashService", function () {
    var flash = {};
    flash.fieldsChangeMessage = "";
    return flash;
});
app.controller('HomeCtrl', ["$scope", "PlaylistsService", "NowPlayingService", "$timeout", function ($scope, PlaylistsService, NowPlayingService, $timeout) {
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
}]);
app.directive("searchBar", ["$compile", function ($compile) {
    return {
        restrict: 'A', link: function ($scope, element) {
            $(element).focus(function () {
                $("#hide-for-search").fadeOut("fast", function () {
                    $("#search_results").fadeIn("fast");
                });
            }).blur(function () {
                $("#search_results").fadeOut("fast", function () {
                    $("#hide-for-search").fadeIn("fast");
                });
            });
            $(element).typeahead({
                hint: true, highlight: true, minLength: 1, menu: $("#main-search-results"), classNames: {
                    dataset: "col-md-6"
                }
            }, {
                source: youtube.ttAdapter(), name: 'youtubeSearch', display: 'title', templates: {
                    header: "<h2 class='center'>YouTube</h2>", suggestion: function (data) {
                        return $compile("<a tsource='" + data.source + "' title='" + data.title + "' playback-url='" + data.playbackURL + "' add-to-playlist class='list-group-item'>" + data.title + "</a>")($scope);
                    }
                }
            }, {
                source: soundcloud.ttAdapter(), name: 'soundcloudSearch', display: 'title', templates: {
                    header: "<h2 class='center'>SoundCloud</h2>", suggestion: function (data) {
                        return $compile("<a tsource='" + data.source + "' title='" + data.title + "' playback-url='" + data.playbackURL + "' add-to-playlist class='list-group-item'>" + data.title + "</a>")($scope);
                    }
                }
            });
        }
    };
}]);
app.controller('NavCtrl', ["$window", "$scope", "$rootScope", "$http", "AuthService", "PlaylistsService", "$state", "NowPlayingService", function ($window, $scope, $rootScope, $http, AuthService, PlaylistsService, $state, NowPlayingService) {
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
    $rootScope.$on("yt-ready", function (event, data) {
        data.target.setVolume(100);
        $scope.volume = 100;
        $scope.$apply();
    });
    $scope.playPauseCondition = function () {
        try {
            return $scope.getYTPlayer().getPlayerState() === 3;
        } catch (e) {
        }
    };
    $scope.playCondition = function () {
        try {
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
}]);
app.factory("TagService", ["$http", function ($http) {
    var tags = {};
    tags.getAllTags = function () {
        return $http.get("/api/tags");
    };
    return tags;
}]);
app.factory("NowPlayingService", ["$window", "$rootScope", "PlaylistsService", function ($window, $rootScope, PlaylistsService) {
    var service = {};
    service.nowPlaying = null;
    service.ytPlayer = null;
    service.scPlayer = null;
    service.scState = null;
    service.getNowPlaying = function () {
        return service.nowPlaying;
    };
    service.getYTPlayer = function () {
        return service.ytPlayer;
    };
    service.setYTPlayer = function (player) {
        service.ytPlayer = player;
    };
    service.getSCPlayer = function () {
        return service.scPlayer;
    };
    service.setSCPlayer = function (player) {
        service.scPlayer = player;
    };
    service.getSCState = function () {
        return service.scState;
    };
    service.setSCState = function (state) {
        service.scState = state;
    };
    service.playTrack = function (track, playlist) {
        service.disposeOf();
        if (track.source === "YouTube") {
            service.nowPlaying = {track: track, fromPlaylist: playlist};
            service.playYTTrack(track);
        } else if (track.source === "SoundCloud") {
            service.nowPlaying = {track: track, fromPlaylist: playlist};
            service.playSCTrack(track);
        }
        var sidebar = $(".now-playing-sidebar");
        if (!sidebar.hasClass("sidebar-open")) {
            sidebar.addClass("sidebar-open");
        }
        document.title = "Currently playing: " + track.title;
    };
    service.toggleTrackState = function () {
        if (service.getNowPlaying().track.source === "YouTube") {
            if (service.getYTPlayer().getPlayerState() === YT.PlayerState.PLAYING) {
                service.getYTPlayer().pauseVideo();
            }
            else if (service.getYTPlayer().getPlayerState() === YT.PlayerState.PAUSED || service.getYTPlayer().getPlayerState() === YT.PlayerState.ENDED) {
                service.getYTPlayer().playVideo();
            }
        } else if (service.getNowPlaying().track.source === "SoundCloud") {
            if (service.scState === 1) {
                service.getSCPlayer().pause();
            } else if (service.scState === 2) {
                service.getSCPlayer().play();
            } else if (service.scState === 0) {
                service.getSCPlayer().play();
            }
        }
    };
    service.disposeOf = function () {
        try {
            service.getYTPlayer().stopVideo();
        } catch (e) {
        }
        try {
            service.getSCPlayer().pause();
            $("[sc-player]").css("visibility", "hidden");
        } catch (e) {
        }
        service.nowPlaying = null;
        document.title = "Musicality";
    };
    service.playYTTrack = function (track) {
        service.getYTPlayer().loadVideoById(getVideoId(track.playbackURL));
    };
    service.playSCTrack = function (track) {
        var scPlayer = $("[sc-player]");
        if (!service.getSCPlayer()) {
            scPlayer.attr("src", "https://w.soundcloud.com/player/?url=" + track.playbackURL
                + "&show_artwork=false&liking=false&sharing=false&auto_play=true&buying=false&show_comments=false&show_playcount=false&download=false");
            var widget = SC.Widget(scPlayer[0]);
            widget.setVolume(1);
            $rootScope.$emit("volume-change", 1);
            widget.bind(SC.Widget.Events.PLAY, function () {
                service.setSCState(1);
                $rootScope.$emit("sc-state-change", 1);
            });
            widget.bind(SC.Widget.Events.PAUSE, function () {
                service.setSCState(2);
                $rootScope.$emit("sc-state-change", 2);
            });
            widget.bind(SC.Widget.Events.FINISH, function () {
                if (service.hasNextTrack()) {
                    service.playNextTrack();
                }
                $rootScope.$emit("sc-state-change", 0);
            });
            widget.bind(SC.Widget.Events.PLAY_PROGRESS, function () {
                widget.getDuration(function (dur) {
                    widget.getPosition(function (pos) {
                        $rootScope.$emit("sc-playing", {duration: dur, position: pos});
                    });
                });
            });
            service.setSCPlayer(widget);
        } else {
            service.getSCPlayer().load(track.playbackURL, {
                show_artwork: false,
                liking: false,
                sharing: false,
                auto_play: true,
                buying: false,
                show_comments: false,
                show_playcount: false,
                download: false
            });
        }
        scPlayer.css("visibility", "visible");
    };
    service.endNowPlaying = function () {
        var sidebar = $(".now-playing-sidebar");
        if (sidebar.hasClass("sidebar-open")) {
            sidebar.removeClass("sidebar-open");
        }
        service.disposeOf();
    };
    service.reloadCurrentPlaylist = function () {
        try {
            PlaylistsService.getAllPlaylists({_id: service.nowPlaying.fromPlaylist._id}).success(function (playlist) {
                if (playlist) {
                    service.nowPlaying.fromPlaylist = playlist[0];
                }
            });
        } catch (e) {
        }
    };
    service.findIndex = function (operator) {
        var inPlaylist = _.findIndex(service.getNowPlaying().fromPlaylist.tracks, function (track) {
            return track.playbackURL == service.getNowPlaying().track.playbackURL;
        });
        return inPlaylist + operator;
    };
    service.hasNextTrack = function () {
        return !!service.getNowPlaying().fromPlaylist.tracks[service.findIndex(1)];
    };
    service.playNextTrack = function () {
        service.playTrack(service.getNowPlaying().fromPlaylist.tracks[service.findIndex(1)], service.getNowPlaying().fromPlaylist);
    };
    service.hasPreviousTrack = function () {
        return !!service.getNowPlaying().fromPlaylist.tracks[service.findIndex(-1)];
    };
    service.playPreviousTrack = function () {
        service.playTrack(service.getNowPlaying().fromPlaylist.tracks[service.findIndex(-1)], service.getNowPlaying().fromPlaylist);
    };
    service.volumeUp = function () {
        service.setVolume(100, 1);
    };
    service.volumeDown = function () {
        service.setVolume(50, 0.5);
    };
    service.volumeMute = function () {
        service.setVolume(0, 0);
    };
    service.setVolume = function (yt, sc) {
        if (service.getNowPlaying().track.source === "YouTube") {
            service.getYTPlayer().setVolume(yt);
            $rootScope.$emit("volume-change", yt);
        } else if (service.getNowPlaying().track.source === "SoundCloud") {
            service.getSCPlayer().setVolume(sc);
            $rootScope.$emit("volume-change", sc);
        }
    };
    service.playPlaylist = function (playlist) {
        if (playlist.tracks[0]) {
            service.playTrack(playlist.tracks[0], playlist);
        }
    };
    return service;
}]);
app.directive("ytPlayerInit", ["$window", "$rootScope", "NowPlayingService", function ($window, $rootScope, NowPlayingService) {
    return {
        restrict: 'A', link: function () {
            var yt = document.createElement('script');
            yt.src = "/compiled/iframe_api.js";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(yt, firstScriptTag);
            $window.onYouTubeIframeAPIReady = function () {
                NowPlayingService.setYTPlayer(new YT.Player('yt-player', {
                    height: '390', width: '640', playerVars: {
                        "html5": 1,
                        "autoplay": 1,
                        "showinfo": 0,
                        "controls": 0,
                        "rel": 0,
                        "iv_load_policy": 3,
                    }, events: {
                        onReady: function (event) {
                            $rootScope.$emit("yt-ready", event);
                        }, onStateChange: function (event) {
                            $rootScope.$emit("yt-state-change", event.data);
                        }
                    }
                }));
            };
        }
    };
}]);
var posTimer;
var scListener;
var runScListener = true;
app.directive('playerSlider', ["$rootScope", "NowPlayingService", function ($rootScope, NowPlayingService) {
    return {
        restrict: "A", link: function (scope, element) {
            $(element).slider({
                "id": "playback-slider",
                "min": 0,
                "max": 100,
                "step": 1,
                "orientation": "horizontal",
                "value": 0,
                "enabled": false,
                "handle": "round",
                "tooltip": "hide"
            });
            angular.forEach(["yt-state-change", "sc-state-change"], function (ev) {
                $rootScope.$on(ev, function (event, data) {
                    if (data === 1) {
                        $(element).slider("enable");
                        runScListener = true;
                        startTimer();
                    } else if (data === 0 || data === -1 || !NowPlayingService.getNowPlaying()) {
                        clear();
                        $(element).slider("disable");
                    } else {
                        clear();
                    }
                });
            });
            $(element).slider().on('slideStart', function (ev) {
                clear();
            });
            $(element).slider().on('slide', function (ev) {
                doSlider(ev, false, true);
            });
            $(element).slider().on('slideStop', function (ev) {
                doSlider(ev, true, false);
            });
            $(element).slider().on('change', function (ev) {
                doSlider(ev, true, true);
            });
            function doSlider(ev, doReq, scSlideStop) {
                if (NowPlayingService.getNowPlaying()) {
                    if (NowPlayingService.getNowPlaying().track.source === "YouTube") {
                        var totalTime = NowPlayingService.getYTPlayer().getDuration();
                        if (totalTime !== 0) {
                            var convertToSecs = (ev.value * totalTime) / 100;
                            NowPlayingService.getYTPlayer().seekTo(convertToSecs, doReq);
                        }
                    } else if (NowPlayingService.getNowPlaying().track.source === "SoundCloud") {
                        if (!scSlideStop) {
                            NowPlayingService.getSCPlayer().getDuration(function (dur) {
                                if (dur !== 0) {
                                    NowPlayingService.getSCPlayer().seekTo((ev.value * dur) / 100);
                                }
                            });
                            runScListener = true;
                        }
                    }
                }
            }
            function startTimer() {
                if (NowPlayingService.getNowPlaying().track.source === "YouTube") {
                    posTimer = setInterval(function () {
                        if (typeof NowPlayingService.getYTPlayer().getCurrentTime == 'function') {
                            var currentTime = NowPlayingService.getYTPlayer().getCurrentTime();
                            var totalTime = NowPlayingService.getYTPlayer().getDuration();
                            var newPosition = (currentTime / totalTime) * 100;
                            $(element).slider("setValue", newPosition);
                        }

                    }, 1000);
                } else if (NowPlayingService.getNowPlaying().track.source === "SoundCloud") {
                    scListener = $rootScope.$on("sc-playing", function (event, data) {
                        if (runScListener) {
                            var dur = data.duration;
                            var pos = data.position;
                            var durSecs = dur / 1000;
                            var posSecs = pos / 1000;
                            var newPos = (posSecs / durSecs) * 100;
                            $(element).slider("setValue", newPos);
                        }
                    });
                }
            }
            function clear() {
                clearInterval(posTimer);
                runScListener = false;
            }
        }
    };
}]);
app.controller('AllPlaylistsCtrl', ["$scope", "PlaylistsService", "PlaylistPagination", "NowPlayingService", function ($scope, PlaylistsService, PlaylistPagination, NowPlayingService) {
    $scope.pagination = new PlaylistPagination();
    $scope.playTrack = NowPlayingService.playTrack;
}]);
app.controller('PlaylistCtrl', ["$scope", "$stateParams", "AuthService", "PlaylistsService", "NowPlayingService", "$rootScope", "$timeout", "FlashService", "UserService", function ($scope, $stateParams, AuthService, PlaylistsService, NowPlayingService, $rootScope, $timeout, FlashService, UserService) {
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
        if ($scope.playlist) {
            $scope.exists = true;
            $scope.refreshLiked();
            $scope.refreshAuthor();
            if (FlashService.fieldsChangeMessage !== "") {
                $scope.fieldsChangeMessage = FlashService.fieldsChangeMessage;
                NowPlayingService.reloadCurrentPlaylist();
                FlashService.fieldsChangeMessage = "";
            }
            $scope.tracksToBeAdded = [];
            $scope.changeableAttributes = {};
            $scope.changeableAttributes.name = $scope.playlist.name;
            $scope.changeableAttributes.description = $scope.playlist.description;
            $scope.changeableAttributes.playlistArt = $scope.playlist.art;
            $scope.changeableAttributes.comment = "";
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
            $scope.allAuthorPlaylists = _.filter(userPlaylists, function (each) {
                return each.name !== $scope.playlist.name;
            });
            $scope.above3AuthorPlaylists = _.reject($scope.allAuthorPlaylists, function (each) {
                return each.tracks.length < 3;
            });
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
            $scope.tracksToBeAdded.newTrack = "";
            $('#quick-add-search').typeahead('val', "");
        } else {
            $scope.message = "That track is already in the to-be-added queue!";
        }
    };
    $scope.addTracksInQueueToPlaylist = function () {
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
    $scope.refreshAuthor = function () {
        if ($scope.exists) {
            if (!$scope.isLoggedIn()) {
                $scope.isAuthor = false;
                return;
            }
            $scope.isAuthor = $scope.playlist.createdBy === AuthService.currentUser();
        }
    };
    $scope.addComment = function () {
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
                return (each.username === data.delComment.username) && (each.created === data.delComment.created) && (each.comment === data.delComment.comment);
            });
        }).error(function (err) {
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
}]);
app.factory("PlaylistsService", ["$state", "$http", "AuthService", function ($state, $http, AuthService) {
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
}]);
app.factory('PlaylistPagination', ["$http", function ($http) {
    var PlaylistsPagination = function () {
        this.items = [];
        this.busy = false;
        this.page = 1;
        this.done = false;
    };
    PlaylistsPagination.prototype.nextPage = function () {
        if (!this.done) {
            if (this.busy) {
                return;
            }
            this.busy = true;
            var url = "/api/playlists/page/" + this.page;
            $http.get(url).success(function (data) {
                if (_.isEmpty(data)) {
                    this.done = true;
                    return;
                }
                for (var i = 0; i < data.length; i++) {
                    data[i].featuredTracks = getRandomArrayVals(data[i].tracks, 3);
                    this.items.push(data[i]);
                }
                this.page += 1;
                this.busy = false;
            }.bind(this));
        }
    };
    return PlaylistsPagination;
}]);
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
app.directive("contenteditable", ["PlaylistsService", "$state", "FlashService", function (PlaylistsService, $state, FlashService) {
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
                if (event.which === 13) {
                    $(element).blur();
                    window.getSelection().removeAllRanges();
                }
            });
            element.bind("blur", function () {
                if ($(element).hasClass("playlist-edit-name")) {
                    PlaylistsService.updateName($scope.playlist, $scope.changeableAttributes.name).then(function (data) {
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
}]);
app.run(["$rootScope", "$timeout", function ($rootScope, $timeout) {
    $rootScope.$on('auth:logged-in', function () {
        $.contextMenu('destroy');
        clearMainSearch($timeout);
    });
    $rootScope.$on("auth:logged-out", function () {
        $.contextMenu('destroy');
        clearMainSearch($timeout);
    });
}]);
app.directive("playlistArtMenu", ["PlaylistsService", function (PlaylistsService) {
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
                    if (!_.isEmpty(items)) {
                        $.contextMenu({
                            selector: ".playlist-art-menu", items: items, trigger: "hover", autoHide: true
                        });
                    }
                }
            });
        }
    };
}]);
app.directive("profileImage", ["UserService", "AuthService", function (UserService, AuthService) {
    return {
        link: function ($scope, element) {
            $scope.$watch('isAuthor', function (newVal) {
                if (newVal !== undefined) {
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
}]);
app.directive("addToPlaylist", ["$state", "PlaylistsService", "AuthService", "$compile", "$rootScope", "$timeout", function ($state, PlaylistsService, AuthService, $compile, $rootScope, $timeout) {
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
}]);
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
app.directive("bootstrapTooltip", ["$timeout", function ($timeout) {
    return {
        restrict: 'A', link: function ($scope, element) {
            $timeout(function () {
                $(element).tooltip({trigger: "hover"});
            });
        }
    };
}]);
app.directive("tagsTypeahead", ["$timeout", "TagService", function ($timeout, TagService) {
    return {
        restrict: 'A', link: function ($scope, element) {
            TagService.getAllTags().success(function (data) {
                $timeout(function () {
                    $(element).typeahead({
                        hint: true, highlight: true, minLength: 1
                    }, {
                        name: 'tags', source: new Bloodhound({
                            datumTokenizer: Bloodhound.tokenizers.whitespace,
                            queryTokenizer: Bloodhound.tokenizers.whitespace,
                            local: data
                        }), templates: {
                            header: "<div class='list-group'>", suggestion: function (data) {
                                return "<div class='list-group-item tags-list-item'>" + data + "</div>";
                            }
                        }
                    });
                    $(element).bind('typeahead:select', function (ev, suggestion) {
                        $scope.tags.newTag = suggestion;
                    });
                }, 0, false);
            });
        }
    };
}]);
app.directive("quickAddTypeahead", ["$timeout", function ($timeout) {
    return {
        restrict: 'A', link: function ($scope, element) {
            $timeout(function () {
                $(element).typeahead({
                    hint: true, highlight: true, minLength: 1
                }, {
                    name: 'quickAddYouTubeSearch', source: youtube, display: 'title', templates: {
                        suggestion: function (data) {
                            return "<div class='list-group-item tags-list-item'>" + data.title + "<div style='padding-top: 5px;'><small>" + data.source + "</small></div></div>";
                        }
                    }
                }, {
                    name: 'quickAddSoundCloudSearch', source: soundcloud, display: 'title', templates: {
                        suggestion: function (data) {
                            return "<div class='list-group-item tags-list-item'>" + data.title + "<div style='padding-top: 5px;'><small>" + data.source + "</small></div></div>";
                        }
                    }
                });
                $(element).bind('typeahead:select', function (ev, suggestion) {
                    $scope.$apply(function () {
                        $scope.addTrackToBeAdded(suggestion);
                    });
                });
            }, 0, false);
        }
    };
}]);
