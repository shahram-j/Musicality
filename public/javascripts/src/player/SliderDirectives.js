var posTimer;
var scListener;
var runScListener = true;

app.directive('playerSlider', function ($rootScope, NowPlayingService) {
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

                            // to duration of 100
                            var newPosition = (currentTime / totalTime) * 100;

                            $(element).slider("setValue", newPosition);
                        }
                        // every second
                    }, 1000);
                } else if (NowPlayingService.getNowPlaying().track.source === "SoundCloud") {
                    scListener = $rootScope.$on("sc-playing", function (event, data) {
                        if (runScListener) {
                            var dur = data.duration;
                            var pos = data.position;

                            // seconds conversion, make these values easier to use
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
});
