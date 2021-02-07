app.directive("tagsTypeahead", function ($timeout, TagService) {
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
});

app.directive("quickAddTypeahead", function ($timeout) {
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
});
