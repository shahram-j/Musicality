app.directive("ytPlayerInit", function ($window, $rootScope, NowPlayingService) {
    return {
        restrict: 'A', link: function () {
            // insert YouTube script
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
                        "disablekb": 1 // disable keyboard controls
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
});
