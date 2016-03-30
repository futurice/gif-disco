var LATEST_TWEETS_COUNT = 5;
var TWEET_ANIMATION_TIME = 20 * 1000;
var PAUSE_BETWEEN_TWEETS = 20 * 1000;

// Sends debug data to server, useful when debugging device without console.
function debug(data) {
    $.ajax({
        url: "/debug",
        type: "POST",
        data: {data: JSON.stringify(data)},
        dataType: "json",
        async: false
    });
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function isControl() {
    return endsWith(window.location.href, 'control.html');
}

function unixtime() {
    return Math.floor((new Date()).getTime() / 1000);
}


function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Get settings from server in JSON format
function getSettings() {
    var settings;
    $.ajax({
        url: "/settings",
        type: "GET",
        success: function(response) {
            settings = response;
        },
        async: false
    });
    return settings;
}

// Returns latest tweets from Twitter's search API. Max count is 100.
  function fetchTweets(tweetIndex) {
    $.ajax({
      url: "/tweets",
      dataType: "json",
      success: function(tweets) {
            var tweet,
                text,
                signature;

            if (tweets.length === 0) {
                return;
            }

            if (tweetIndex > tweets.length - 1) {
                tweet = randomChoice(tweets);
            } else {
                tweet = tweets[tweetIndex];
            }

            signature = ' <span class="twitter-name">-@' + tweet.user.screen_name +
                        "</span>";

            text = linkify_entities(tweet) + signature;

            animateTweet(text);

            setTimeout(function() {
              var newTweetIndex = tweetIndex + 1;
              if (newTweetIndex > LATEST_TWEETS_COUNT - 1) {
                newTweetIndex = 0;
              }
              fetchTweets(newTweetIndex);
            }, PAUSE_BETWEEN_TWEETS + TWEET_ANIMATION_TIME);
      },
      error: function() {
      }
    });
}

function animateTweet(tweet) {
    $('.tweet').css('left', '100%');
    $('#tweet').html(tweet);
    var width = $('.tweet').width();
    $('.tweet').animate({left: '-' + width + 'px'}, 15000, "linear");
}

function resizeDisco(event, move) {
    move = move || true;

    if (event && event.target != window) {
        return;
    }

    var sidebarWidth = $('#sidebar').is(':visible') ? $('#sidebar').outerWidth() : 0;
    var discoWidth = $(window).innerWidth() - sidebarWidth;
    $('#disco').css('width', discoWidth);

    $('.gifwrap').each(function(index, el) {
        removeGifFromDisco(el.id, false);
        window.lastFetchTime = 0;
    });
}

function fullscreenToggle() {
    if (!$(document).fullScreen()) {
        $(document).fullScreen(true);
    } else {
        $(document).fullScreen(false);
    }
}

function fullscreenOn() {
    console.log('fullscreen on');
    $('#sidebar').hide();
    $('body').addClass('fullscreen');
    resizeDisco(undefined, true);
}

function fullscreenOff() {
    console.log('fullscreen off');
    $('#sidebar').show();
    $('body').removeClass('fullscreen');
    resizeDisco(undefined, true);
}


function updateGifs() {
    var url = isControl() ? '/gifs' : '/gifs_no_state_change';
    $.ajax({
        url: url,
        type: "GET",
        success: function(response) {
            var gifs = JSON.parse(response);

            if (!$('#search').val()) {
                updateSideBar(gifs);
            }

            if (!isUpdateLock()) {
                updateDisco(gifs);
            }

            window.lastFetchTime = unixtime();
        }
    });
}

function updateSideBar(gifs) {
    var sortedGifs =_.sortBy(gifs.all, function(gif) { return gif.created; });
    sortedGifs.reverse();

    var gifList = $('#giflist');
    gifList.html('');
    for (var i = 0; i < sortedGifs.length; ++i) {
        var gif = sortedGifs[i];
        var html = '<li data-id="' + gif.id + '" data-url="' + gif.url + '" class="gifitem">' + gif.name + '</li>';
        gifList.append(html);
    }
}

function updateDisco(gifs) {
    var visibleGifs = gifs.visible;
    var ids = [];

    var time = unixtime();
    for (var i = 0; i < visibleGifs.length; ++i) {
        var gif = visibleGifs[i];

        addGifToDisco(gifs, gif.id);

        // Select the recently created gif
        var sortedGifs =_.sortBy(gifs.all, function(gif) { return gif.created; });
        var newGifCreated = gifs.all[gif.id].created;
        var newestGifCreated = sortedGifs[sortedGifs.length - 1].created;
        if (isControl() &&
            gif.added > window.lastFetchTime &&
            newGifCreated >= newestGifCreated &&
            unixtime() <= (newGifCreated + settings.switchDancers) * (settings.maxVisible - 1)
        ) {
            selectGif($('#' + gif.id));
        }

        ids.push(gif.id);
    }

    $('.gifwrap').each(function(index, el) {
        if ($.inArray(el.id, ids) === -1) {
            removeGifFromDisco(el.id, false);
        }
    });
}

function replaceRandomGif(gifId) {
    var gifIds = [];
    $('.gifwrap').each(function(index, el) {
        gifIds.push(el.id);
    });

    var replaceGif = randomChoice(gifIds);
    removeGifFromDisco(replaceGif, false);
}

function selectListItem($el) {
    $gifEl = $('#' + $el.data('id'));
    if ($gifEl.length) {
        selectGif($gifEl);
        return;
    }
}

function selectGif($el) {
    deselectGifs();
    $el.addClass('selected-gif');
}

function deselectGifs() {
    $('.selected-gif').removeClass('selected-gif');
}

function removeGifFromDisco(gifId, save) {
    var $el = $('#' + gifId);
    $el.find('img').resizable('destroy');
    $el.draggable('destroy');
    $el.fadeOut();
    $el.remove();

    if (save) {
        $.ajax({
            url: "/hide_gif",
            type: "POST",
            data: JSON.stringify({id: gifId}),
            dataType: "json",
            async: false
        });
    }
}

function saveGif(gifId) {
    var $el = $('#' + gifId);
    var data = {
        width: $el.width(),
        height: $el.height(),
        position: getGifPosition(gifId),
        id: $el.attr('id')
    };

    $.ajax({
        url: "/gif",
        type: "POST",
        data: JSON.stringify(data),
        dataType: "json",
        async: false
    });
}

function addGifToDisco(gifs, gifId, save) {
    save = save || false;

    var $gifEl = $('#' + gifId);
    var visibleGif = _.findWhere(gifs.visible, {id: gifId});

    var position = visibleGif.position;
    var height = visibleGif.height;
    var width = height / gifs.all[gifId].height * gifs.all[gifId].width;
    var url = gifs.all[gifId].url;

    if ($gifEl.length) {
        moveGif(gifId, position, width, height);
        return;
    }

    var image = '<div data-url="' + url + '"class="gifwrap hidden" id="' + gifId + '"><p class="close-gif">x</p><img class="dancegif" src="' + url + '" /></div>';
    $('#disco').append(image);
    $gifEl = $('#' + gifId);

    var img = new Image();
    img.onload = function() {
        moveGif(gifId, position, width, height);
        attachUIControls($gifEl);

        $gifEl.hide().removeClass('hidden').fadeIn();
    };
    img.src = url;
}

function moveGif(gifId, position, width, height) {
    $gifEl = $('#' + gifId);

    _.each([$gifEl, $gifEl.find('img'), $gifEl.find('.ui-wrapper')], function($el) {
        $el.css('width', width || this.width);
        $el.css('height', height || this.height);
    });

    $gifEl.css('bottom', position.bottom + '%');
    var left = position.left / 100.0 * $('#disco').width() - $gifEl.width() / 2;
    $gifEl.css('left', left + 'px');

    $gifEl.css('z-index', (100 - Math.floor(position.bottom)));
}

function getGifPosition(gifId) {
    var $el = $('#' + gifId);
    var pos = $el.position();
    var xPercent = (pos.left + $el.width() / 2) / $el.parent().width() * 100.0;

    var bottomLine = pos.top + $el.height();
    var positionFromBottom = $el.parent().height() - bottomLine;
    var yPercent = positionFromBottom / $el.parent().height() * 100.0;

    return {bottom: yPercent, left: xPercent};
}

function attachUIControls($el) {
    makeGifResizable($el);
    makeGifDraggable($el);
}

function makeGifDraggable($el) {
    $el.draggable({
        cursor: "move",
        scroll: false,
        containment: '#disco',
        start: function() {
            $('#disco').addClass('updatelock');
        },
        stop: function() {
            $('#disco').removeClass('updatelock');
            saveGif($el.attr('id'));
        },
    });
}

function makeGifResizable($el) {
    $el.find('img').resizable({
        aspectRatio: true,
        resize: function( event, ui ) {
            event.stopPropagation();
            $el.css('width', $(this).width());
            $el.css('height', $(this).height());
        },
        start: function() {
            $('#disco').addClass('updatelock');
        },
        stop: function() {
            $('#disco').removeClass('updatelock');
            saveGif($el.attr('id'));
        },
        containment: '#disco',
        autoHide: true
    });
}

function updateBackground() {
    $.ajax({
        url: "/background",
        type: "GET",
        dataType: "json",
        success: function(response) {
            var data = response;
            if (data.background == $('.disco-background').attr('src')) {
                return;
            }

            $('.disco-background').fadeOut(600, function() {
                $('.disco-background').attr('src', data.background);
                $('.disco-background').fadeIn();
            });
        }
    });
}

function isUpdateLock() {
    return $('#disco').hasClass('updatelock');
}

$(window).load(function() {
    var timer,
        settings = getSettings();
    window.settings = settings;
    window.gifs = null;
    window.lastFetchTime = 0;


    $(window).bind('resize', resizeDisco);
    resizeDisco(undefined, false);

    Mousetrap.bind('alt+f', fullscreenToggle);
    Mousetrap.bind('f', fullscreenToggle);

    $(document).bind('fullscreenerror', function() {
        alert('Browser rejected fullscreen change');
    });

    $(document).bind('fullscreenchange', function() {
        if (!$(document).fullScreen()) {
            fullscreenOff();
        } else {
            fullscreenOn();
        }
    });

    $(document).on('click', '.gifitem', function(e) {
        selectListItem($(this));
    });

    $(document).on('mousedown click', '.gifwrap', function(e) {
        selectGif($(this));
        e.stopPropagation();
    });

    $('#disco').click(function() {
        deselectGifs();
    });

    $('#search').on('input', function() {
        var pattern = $(this).val().toLocaleLowerCase();

        if (!pattern) {
            $('.gifitem').removeClass('hidden');
            return;
        }

        $('.gifitem').each(function(index, el) {
            var indexOf = $(el).html().toLocaleLowerCase().indexOf(pattern);
            if (indexOf == -1) {
                $(el).addClass('hidden');
            } else {
                $(el).removeClass('hidden');
            }
        });
    });

    $(document).on('click', '.close-gif', function() {
        removeGifFromDisco($(this).parent().attr('id'), true);
    });

    $(document).on('mousedown', function() {
        $('#disco').addClass('updatelock');
    });

    $(document).on('mouseup', function() {
        $('#disco').removeClass('updatelock');
    });

    updateGifs();
    setInterval(updateGifs, 3 * 1000);

    updateBackground();
    setInterval(updateBackground, 5 * 1000);

    // Don't show tweets.
    //fetchTweets(0);
});
