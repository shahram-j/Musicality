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
