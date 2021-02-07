app.directive("searchBar", function ($compile) {
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
});
