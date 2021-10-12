odoo.define('rainbow_community_theme.SwitchCompanyMenu', function (require) {
    "use strict";

    var config = require('web.config');
    var SwitchCompanyMenu = require('web.SwitchCompanyMenu');
    var SystrayMenu = require('web.SystrayMenu');
    var session = require('web.session');
    var theme = session.theme;
    var global_mode = 1;

    if (theme.hasOwnProperty("global")) {
        if (theme["global"].hasOwnProperty("mode")) {
            global_mode = theme["global"]["mode"]
        }
    }

    if (config.device.isMobile && global_mode == 3) {
        return;
    } else {
        var index = SystrayMenu.Items.indexOf(SwitchCompanyMenu);
        if (index >= 0) {
            SystrayMenu.Items.splice(index, 1);
        }
        if (session.display_switch_company_menu) {
            SwitchCompanyMenu.prototype.sequence = 4;
            SystrayMenu.Items.push(SwitchCompanyMenu);
        }
    }

    SwitchCompanyMenu.include({
        start: function () {
            var theme = session.theme;

            //设置dropdown-menu背景颜色
            this.dropdown_color = "light";
            if (theme.hasOwnProperty("herder")) {
                if (theme["herder"].hasOwnProperty("dropdown-menu-color")) {
                    this.dropdown_color = theme["herder"]["dropdown-menu-color"];
                }
            }
            if (this.dropdown_color == "dark") {
                // console.log(SwitchCompanyMenu);
                // this.$el.addClass("dropdown-dark");
                this.$el.addClass("dropdown-dark");
            }
            return this._super.apply(this, arguments);
        }
    });


});