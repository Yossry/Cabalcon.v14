odoo.define("rainbow_community_theme.dom", function (require) {
    "use strict";

    var core = require('web.core');
    var Dom = require("web.dom");

    function _notify(content, callbacks) {
        callbacks.forEach(function (c) {
            if (c.widget && c.widget.on_attach_callback) {
                c.widget.on_attach_callback(c.callback_args);
            }
        });
        core.bus.trigger('DOM_updated', content);
    }

    Dom.after = function ($target, content, options) {
        $target.after(content);
        if (options && options.in_DOM) {
            _notify(content, options.callbacks);
        }
    }

    return Dom;
});