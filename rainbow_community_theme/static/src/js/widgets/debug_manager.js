odoo.define('rainbow_community_theme.DebugManager', function (require) {
    "use strict";

    var config = require('web.config');
    var WebClient = require('web.WebClient');
    var session = require('web.session');

    if (config.isDebug()) {
        WebClient.include({
            start: function () {
                var self = this;
                var theme = session.theme;
                //设置dropdown-menu背景颜色
                var dropdown_color = "light";
                if (theme.hasOwnProperty("herder")) {
                    if (theme["herder"].hasOwnProperty("dropdown-menu-color")) {
                        dropdown_color = theme["herder"]["dropdown-menu-color"];
                    }
                }

                return this._super.apply(this, arguments).then(function () {
                    // Override toggleDrawerMenu to trigger an event to update the debug manager's state
                    var toggleDrawerMenu = self.toggleDrawerMenu;
                    self.toggleDrawerMenu = function (display) {
                        var action, controller;
                        if (!display) {
                            action = self.action_manager.getCurrentAction();
                            controller = self.action_manager.getCurrentController();
                        }
                        self.update_debug_manager(action, controller);
                        toggleDrawerMenu.apply(self, arguments);
                    };
                    if (dropdown_color == "dark") {
                        self.$el.find(".o_debug_manager").addClass("dropdown-dark");
                    }
                });
            },
            instanciate_menu_widgets: function () {
                var self = this;
                return this._super.apply(this, arguments).then(function () {
                    // Compatibility with community debug manager
                    self.systray_menu = self.menu.systray_menu;
                });
            },
        });
    }

});