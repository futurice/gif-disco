// Depends from jQuery, because of $.extend.

var RemoteControl = (function(options) {

    /*
    options.element:
        ID of the element which should contain the remote control buttons
        in a grid like format.

    options.buttons:
        Specifies the remote control layout.
        The button grid's size is 3x5, width=3, height=5.

        Looks like:
        [
            [{}, null, {}],
                ...
            [{}, {}, {}]
        ]
        Where each non-null element is the options to initialize Button with.

    */

    var defaultOptions = {
        buttonEvent: 'pointerdown',
        commandErrorCallback: function() { location.reload(); }
    };

    options = $.extend(true, {}, defaultOptions, options);

    var my = {},
        buttons,
        element = options.element;


    function init() {
        buttons = initializeButtons(options.buttons);
        my.initializeAndBind();
    }

    //
    // Public methods
    //

    my.initializeAndBind = function() {
        // Clear html from element.
        element.html('');

        for (var row = 0; row < buttons.length; ++row) {
            element.append(rowToHTML(row));

            for (var column = 0; column < buttons[0].length; ++column) {
                var button = buttons[row][column];

                if (button !== null && button.autoSend) {
                    bindButtonToSendCommand(button);
                }
            }
        }
    };

    // Sends command to server in format: [command, [param1, ..., paramN]]
    // args and kwargs are optional.
    my.sendCommand = function(command, args, kwargs) {
        if (typeof args === 'undefined') {
            args = [];
        }

        if (typeof kwargs === 'undefined') {
            kwargs = {};
        }

        $.ajax({
            url: "/command",
            type: "POST",
            data: JSON.stringify([command, args, kwargs]),
            dataType: "json",
            async: false,
            error: function(xhr, textStatus, errorThrown) {
                options.commandErrorCallback();
            }
        });
    };

    //
    // Private methods
    //

    // Takes the button grid of initializing parameters and initializes them
    // to Button instances and returns the new list.
    function initializeButtons(buttons) {
        var newButtons = [];

        for (var row = 0; row < buttons.length; ++row) {
            var newRow = [];
            for (var column = 0; column < buttons[0].length; ++column) {
                if (buttons[row][column] !== null) {
                    newRow.push(new Button(buttons[row][column]));
                } else {
                    newRow.push(null);
                }
            }
            newButtons.push(newRow);
        }
        return newButtons;
    }

    function rowToHTML(rowIndex) {
        var html = '<div class="row-fluid">';
        for (var column = 0; column < buttons[0].length; ++column) {
            html += '<div class="span4">';

            var button = buttons[rowIndex][column];
            if (button !== null) {
                html += button.toHTML();
            }

            html += '</div>';
        }
        html += '</div>';

        return html;
    }

    function bindButtonToSendCommand(button) {
        $('#' + button.id).on(options.buttonEvent, function(evt) {
            my.sendCommand('button_press', [button.id]);
        });
    }

    init();
    return my;
});


var Button = (function(options) {

    /*
    options:
        id: Required. Used as button's id.

    If you give for example cssClasses as an option, the default cssClasses
    option("btn-inverse"), will be overridden.
    */

    var defaultOptions = {
        // If true, button press command is sent automatically on press
        // with out manually binding any events
        autoSend: true,

        // small, large
        size: "large",

        // You must choose either icon or label.

        // Name of the icon file in static/img/ directory.
        icon: "",

        // Button label. The default text size assumes one letter labels.
        label: "",

        // What CSS classes to add along with 'btn' and the size class which
        // is 'btn-small' or 'btn-large' based on size option.
        // Separate with spaces.
        cssClasses: "btn-inverse"
    };

    var my = $.extend(true, {}, defaultOptions, options);

    // Maybe using a template would be more clean.
    my.toHTML = function() {

        var classes = 'btn-' + my.size + ' ' + my.cssClasses;

        // Start button tag
        var html = '<button type="button" class="btn ' + classes + '" ';
        html += 'id="' + my.id + '">';

        // Add label for button
        if (my.icon.length > 0) {
            html += '<img src="/static/img/' + my.icon + '">';
        } else {
            html += my.label;
        }

        html += '</button>';

        return html;
    };

    return my;
});
