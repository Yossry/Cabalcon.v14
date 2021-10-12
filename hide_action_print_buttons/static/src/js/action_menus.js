odoo.define('hide_action_print_buttons.ActionMenus', function (require) {
"use strict";

    const session = require('web.session');
    const { patch } = require('web.utils');
    const components = {
        ActionMenus: require('web.ActionMenus')
    };
    patch(components.ActionMenus, 'hide_action_print_buttons.ActionMenus', {
        async willStart() {
            this.ShowAction = await session.user_has_group('hide_action_print_buttons.show_actions_button')
            this.ShowPrint = await session.user_has_group('hide_action_print_buttons.show_print_button')
            this.actionItems = await this._setActionItems(this.props);
            this.printItems = await this._setPrintItems(this.props);
        },
        async willUpdateProps(nextProps) {
            this.ShowAction = await session.user_has_group('hide_action_print_buttons.show_actions_button')
            this.ShowPrint = await session.user_has_group('hide_action_print_buttons.show_print_button')
            this.actionItems = await this._setActionItems(nextProps);
            this.printItems = await this._setPrintItems(nextProps);
        }
    });
});