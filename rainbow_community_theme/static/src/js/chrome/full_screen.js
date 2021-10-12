odoo.define('rainbow_community_theme.FullScreen', function (require) {
    "use strict";
    var core = require('web.core');
    var Widget = require('web.Widget');
    var _t = core._t;

    var FullScreen = Widget.extend({
        template: 'FullScreen',
        events: {
            'click a.fullscreen': '_onRequestFullScreen',
            'click a.exitfullscreen': '_onExitFullScreen',

        },
        init: function () {
            this._super.apply(this, arguments);
        },
        start: function () {
            this._super.apply(this, arguments);
        },
        _onRequestFullScreen: function (ev) {
            ev.preventDefault();
            this.$el.find(".fullscreen").addClass("o_hidden");
            this.$el.find(".exitfullscreen").removeClass("o_hidden");
            if (
                (document.fullScreenElement && document.fullScreenElement !== null) ||
                (!document.mozFullScreen && !document.webkitIsFullScreen)
            ) {
                if (document.documentElement.requestFullScreen) {
                    document.documentElement.requestFullScreen();
                } else if (document.documentElement.mozRequestFullScreen) {
                    document.documentElement.mozRequestFullScreen();
                } else if (document.documentElement.webkitRequestFullScreen) {
                    document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
                } else if (document.documentElement.msRequestFullscreen) {
                    if (document.msFullscreenElement) {
                        document.msExitFullscreen();
                    } else {
                        document.documentElement.msRequestFullscreen();
                    }
                }
            }
        },
        _onExitFullScreen: function (ev) {
            ev.preventDefault();
            this.$el.find(".fullscreen").removeClass("o_hidden");
            this.$el.find(".exitfullscreen").addClass("o_hidden");
            if (document.cancelFullScreen) {
                document.cancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
        },
    });
    return FullScreen;
});