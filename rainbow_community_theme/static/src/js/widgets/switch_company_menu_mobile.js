odoo.define('rainbow_community_theme.SwitchCompanyMenuMobile', function (require) {
    "use strict";

    var config = require('web.config');
    if (!config.device.isMobile) {
        return;
    }

    var SwitchCompanyMenu = require('web.SwitchCompanyMenu');
    var SystrayMenu = require('web.SystrayMenu');

    if (config.device.isMobile) {
        var index = SystrayMenu.Items.indexOf(SwitchCompanyMenu);
        if (index >= 0) {
            SystrayMenu.Items.splice(index, 1);
        }
    }

    const SwitchCompanyMenuMobile = SwitchCompanyMenu.extend({
        template: 'MobileCompanySwitcher',
        events: Object.assign({}, SwitchCompanyMenu.prototype.events, {
            'click .log_into': '_onSwitchCompanyClick',
            'click .toggle_company': '_onToggleCompanyClick',
        }),

    });

    return {
        SwitchCompanyMenuMobile: SwitchCompanyMenuMobile,
    };

});