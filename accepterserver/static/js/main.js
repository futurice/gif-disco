var timers = [];

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

function showErrorAndReload() {
    clearTimers();
    alert('Recording failed unexpectedly. Sorry :(');
    showView('start-view');
    location.reload(true);
}

function getGif(success) {
    $.ajax({
        url: "/get_gif",
        type: "GET",
        success: success,
        error: function(xhr, status, error) {
          console.log(xhr.responseText);
          var err = xhr.responseText;
          showErrorAndReload();
        },
        timeout: 50000
    });
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

function fullscreenToggle() {
    if (!$(document).fullScreen()) {
        $(document).fullScreen(true);
    } else {
        $(document).fullScreen(false);
    }
}

function fullscreenOn() {
    console.log('fullscreen on');
    $('body').addClass('fullscreen');
}

function fullscreenOff() {
    console.log('fullscreen off');
    $('body').removeClass('fullscreen');
}


function showView(view) {
    $('.view').addClass('hidden');
    $('#' + view).removeClass('hidden');
}

function clearTimers() {
    for (var i = 0; i < timers.length; ++i) {
        if (timers[i]) {
            clearTimeout(timers[i]);
        }
    }

    timers = [];
}

function startCountDown() {
    console.log('startCountDown');
    $('#start-view').fadeOut(600, function() {
        $('.view').addClass('hidden');
        $('#start-view').show();

        var timer = setTimeout(function() {
            showView('countdown3-view');
            getGif(function(data) {
                if (!data) {
                    showErrorAndReload();
                    return;
                }

                console.log('getGif returned');
                $('.loader').addClass('hidden');
                $('#preview-view .input-wrap').removeClass('hidden');
                $('#preview-view button').removeClass('hidden');

                $('#preview').remove();
                $('#preview-container > img').addClass('hidden');
                $('#preview-loader').removeClass('hidden');

                var img = new Image();
                img.id = 'preview'
                img.onload = function () {
                    $('#preview-container > img').addClass('hidden');
                    $('#preview-container')[0].appendChild(img);
                };
                img.src = '/static/img/preview.gif';
            });
        }, 1000);
        timers.push(timer);

        timer = setTimeout(function() {
            showView('countdown2-view');
        }, 2000);
        timers.push(timer);

        timer = setTimeout(function() {
            showView('countdown1-view');

        }, 3000);
        timers.push(timer);

        timer = setTimeout(function() {
            setLoader();
            showView('dance-view');
            $('#progress-bar').animate({left: '100%'}, settings.danceProgressTime, "linear");
        }, 4000);
        timers.push(timer);

        timer = setTimeout(function() {
            $('#preview-view .input-wrap').addClass('hidden');
            $('#preview-view button').addClass('hidden');
            $('#preview-container > img').addClass('hidden');
            $('#loader').removeClass('hidden');
          
            $('#guest-code').val('');

            showView('preview-view');
            $('#progress-bar').animate({left: 0}, 0);

        }, 4000 + settings.danceProgressTime);
        timers.push(timer);
    });

}

function setLoader() {
    $('.loader').removeClass('hidden');
    $('#preview').addClass('hidden');
}

function sendGif(success) {
    $.ajax({
        url: "/save_gif",
        type: "POST",
        contentType: "text/plain",
        data: $('#guest-code').val().toUpperCase(),
        dataType: "text",
        success: success,
        // Silently fail
        error: success,
        async: true,
    });
}

$(function() {
    FastClick.attach(document.body);

    var timer,
        settings = getSettings();

    window.settings = settings;

    // Prevent scrolling on touch device
    document.ontouchmove = function(event){
        event.preventDefault();
    }

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

    $('#start').on('click', function() {
        startCountDown();
    });

    $('#accept').on('click', function() {
        $('#upload-view').html('<img src="/static/img/bottle.gif" height="300" alt="">');
      
        showView('upload-view');
        sendGif(function() {
            showView('information-view');
            setTimeout(function() {
                showView('start-view');
            }, 8000);
        });
    });

    $('#decline, #ok').on('click', function() {
        showView('start-view');
    });

    $('.fullscreen-on').on('click', function() {
        fullscreenToggle();
    });
});
