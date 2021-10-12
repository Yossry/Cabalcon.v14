odoo.define('rainbow_community_theme.GoTop', function (require) {
    "use strict";

    var core = require('web.core');
    var config = require('web.config');
    var Widget = require('web.Widget');

    var GoTop = Widget.extend({
        template: 'GoTop',
        events: {
            'click': '_onGoTopClick',
        },
        init: function () {
            this._super.apply(this, arguments);
            core.bus.on('show_to_top', this, this.show_to_top);
            core.bus.on('hide_to_top', this, this.hide_to_top);
        },
        // start: function () {
        //     return this._super.apply(this, arguments).then(this.bind_events.bind(this));
        // },
        show_to_top: function () {
            var duration = 500;
            this.$el.fadeIn(duration);
        },
        hide_to_top: function () {
            var duration = 500;
            this.$el.fadeOut(duration);
        },
        _onGoTopClick: function (ev) {
            var self = this;
            var duration = 500;

            if (config.device.isMobile) {
                ev.preventDefault();
                $('html, body').animate({
                    scrollTop: 0
                }, duration);
                self.hide_to_top();
                return false;
            } else {
                if ($(".settings").length > 0) {
                    ev.preventDefault();
                    $(".settings").animate({
                        scrollTop: 0
                    }, duration);
                    return false;
                } else {
                    ev.preventDefault();
                    $(".o_content").animate({
                        scrollTop: 0
                    }, duration);
                    return false;
                }
            }

        },
    });
    return GoTop;
});