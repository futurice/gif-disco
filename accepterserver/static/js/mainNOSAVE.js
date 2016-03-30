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

function resizeDisco(event) {
    if (event && event.target != window) {
        return;
    }

    var sidebarWidth = $('#sidebar').is(':visible') ? $('#sidebar').outerWidth() : 0;
    var discoWidth = $(window).innerWidth() - sidebarWidth;
    $('#disco').css('width', discoWidth);
    $('.gifwrap').css('bottom', '100%');
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
    $('.selected-gif .close-gif').css('visibility', 'hidden');
    resizeDisco();
}

function fullscreenOff() {
    console.log('fullscreen off');
    $('#sidebar').show();
    $('.selected-gif .close-gif').css('visibility', 'visible');
    resizeDisco();
}


function updateGifs() {
    if ($('#disco').hasClass('updatelock')) {
        return;
    }

    if ($('#search').val()) {
        return;
    }

    var gifList = $('#giflist');
    $.ajax({
        url: "/gifs",
        type: "GET",
        success: function(response) {
            var data = JSON.parse(response);

            gifList.html('');
            for (var i = 0; i < data.length; ++i) {
                var html = '<li data-id="' + data[i].id + '" data-url="' + data[i].url + '" class="gifitem">' + data[i].name + '</li>';
                gifList.append(html);
            }
        }
    });

    loadDisco();
}

function replaceRandomGif(gifId) {
    var gifIds = [];
    $('.gifwrap').each(function(index, el) {
        gifIds.push(el.id);
    });

    var replaceGif = randomChoice(gifIds);
    removeGifFromDisco($('#' + replaceGif), false);


}

function selectGif($el) {
    deselectGifs();
    $el.addClass('selected-gif');
}

function selectListItem($el) {
    $gifEl = $('#' + $el.data('id'));
    if ($gifEl.length) {
        selectGif($gifEl);
        return;
    }

    addGifToDisco({id: $el.data('id'), url: $el.data('url')}, true);
    selectGif($gifEl);
}

function deselectGifs() {
    $('.selected-gif').removeClass('selected-gif');
}

function addGifToDisco(gifInfo, save) {
    var url = gifInfo.url;
    var gifId = gifInfo.id;
    var $gifEl = $('#' + gifId);

    if ($gifEl.length) {
        var realPosition = 100 * parseFloat($gifEl.css('bottom')) / parseFloat($gifEl.parent().height());

        if ($gifEl.css('width') === gifInfo.width + 'px' &&
            $gifEl.css('height') === gifInfo.height + 'px' &&
            parseFloat(realPosition).toFixed(1) === parseFloat(gifInfo.position.bottom).toFixed(1)) {
            return;
        }

        removeGifFromDisco($gifEl, false);
    }

    var image = '<div data-url="' + url + '"class="gifwrap hidden" id="' + gifId + '"><p class="close-gif">x</p><img class="dancegif" src="' + url + '" /></div>';
    $('#disco').append(image);
    $gifEl = $('#' + gifId);

    var img = new Image();
    img.onload = function() {
        $gifEl.css('width', gifInfo.width || this.width);
        $gifEl.css('height', gifInfo.height || this.height);

        if (gifInfo.position) {
            $gifEl.css('bottom', gifInfo.position.bottom + '%');

            $('.debug').css('width', gifInfo.position.left + '%');
            var left = gifInfo.position.left / 100.0 * $('#disco').width() - $gifEl.width() / 2;
            $gifEl.css('left', left + 'px');
        }

        attachUIControls($gifEl);

        if (save) {
            saveDisco();
        }

        $gifEl.hide().removeClass('hidden').fadeIn();
    };
    img.src = url;
}

function getGifPosition($el) {
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
            saveDisco();
            $('#disco').removeClass('updatelock');
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
            saveDisco();
        },
        containment: '#disco',
        autoHide: true
    });
}

function removeGifFromDisco($el, save) {
    $el.find('img').resizable('destroy');
    $el.draggable('destroy');
    $el.fadeOut();
    $el.remove();

    if (save) {
        saveDisco();
    }
}

function saveDisco() {
    return;
    var data = {'visibleGifs': []};
    $('.gifwrap').each(function(index, el) {
        var $el = $(el);
        var gif = {
            width: $el.width(),
            height: $el.height(),
            position: getGifPosition($el),
            id: $el.attr('id'),
            url: $el.data('url')
        };

        data.visibleGifs.push(gif);
    });

    $.ajax({
        url: "/save_gifs",
        type: "POST",
        data: JSON.stringify(data),
        dataType: "json",
        async: false
    });
}

function loadDisco() {
    $.ajax({
        url: "/load_gifs_nosave",
        type: "GET",
        async: false,
        success: function(response) {
            var data = JSON.parse(response);
            var visibleGifs = data.visibleGifs;
            var ids = [];

            for (var i = 0; i < visibleGifs.length; ++i) {
                var save = i === visibleGifs.length - 1;
                var gif = visibleGifs[i];
                addGifToDisco(gif, save);
                ids.push(gif.id);
            }

            $('.gifwrap').each(function(index, el) {
                if ($.inArray(el.id, ids) === -1) {
                    removeGifFromDisco($(el), false);
                }
            });
        }
    });
}

$(window).load(function() {
    var timer,
        settings = getSettings();

    $(window).bind('resize', resizeDisco);
    resizeDisco();

    Mousetrap.bind('alt+f', fullscreenToggle);

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
        removeGifFromDisco($(this).parent(), true);
    });

    updateGifs();
    setInterval(updateGifs, 3 * 1000);
});
