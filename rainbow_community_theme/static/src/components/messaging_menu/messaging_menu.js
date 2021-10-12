odoo.define('rainbow_community_theme.DarkMessagingMenu', function (require) {
    'use strict';

    var session = require('web.session');
    var Widget = require('web.Widget');

    var DarkMessagingMenu = Widget.extend({
        init: function () {
            this._super.apply(this, arguments);
            console.log(this.$el)
        },
        start: function () {
            var dropdown_color = "light";
            if (session.theme.hasOwnProperty("herder")) {
                if (session.theme["herder"].hasOwnProperty("dropdown-menu-color")) {
                    dropdown_color = session.theme["herder"]["dropdown-menu-color"];
                }
            }
            console.log(this.$el)
            return this._super.apply(this, arguments).then(function () {
                console.log(this.$el)
            })
        }
    });
    return DarkMessagingMenu;

});