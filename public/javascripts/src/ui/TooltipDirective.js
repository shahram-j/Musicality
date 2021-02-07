app.directive("bootstrapTooltip", function ($timeout) {
    return {
        restrict: 'A', link: function ($scope, element) {
            $timeout(function () {
                $(element).tooltip({trigger: "hover"});
            });
        }
    };
});