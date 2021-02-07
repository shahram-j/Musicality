app.factory("NowPlayingService", function ($window, $rootScope, PlaylistsService) {
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
        // open the sidebar to show the track playing
        if (!sidebar.hasClass("sidebar-open")) {
            sidebar.addClass("sidebar-open");
        }

        document.title = "Currently playing: " + track.title;
    };

    service.toggleTrackState = function () {
        if (service.getNowPlaying().track.source === "YouTube") {
            // if currently playing
            if (service.getYTPlayer().getPlayerState() === YT.PlayerState.PLAYING) {
                service.getYTPlayer().pauseVideo();
            }
            // if paused or ended, restart the video
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

        // null the object
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

            // initial change in volume to alert $scope on the frontend
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
                service.setSCState(0); // ended
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
        // close the sidebar since we're ending the playlist play
        if (sidebar.hasClass("sidebar-open")) {
            sidebar.removeClass("sidebar-open");
        }

        service.disposeOf();
    };

    // to update the playlist object in nowPlaying when
    // the user updates a playlist attribute
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
});
