odoo.define('rainbow_community_theme.LanguageMenu', function (require) {
    "use strict";

    var core = require('web.core');
    var config = require('web.config');
    var session = require('web.session');
    var Widget = require('web.Widget');
    var QWeb = core.qweb;

    var LanguageMenu = Widget.extend({
        template: 'LanguageMenu',
        menusTemplate: 'LanguageMenu.sections',
        events: {
            'click a[data-code]': '_onChangeLanguage',
        },
        init: function () {
            this._super.apply(this, arguments);
            var theme = session.theme;
            this.is_dark_dropdown = false;
            if (theme.hasOwnProperty("herder")) {
                if (theme["herder"].hasOwnProperty("dropdown-menu-color")) {
                    if (theme["herder"]["dropdown-menu-color"] == "dark") {
                        this.is_dark_dropdown = true;
                    }
                }
            }
        },
        start: function () {
            var self = this;

            this.language = self._rpc({
                model: 'res.lang',
                method: 'search_read',
                domain: [],
                fields: ['name', 'code', 'flag_image_url'],
                lazy: false,
            });
            return this._super.apply(this, arguments).then(this._renderLanguageMenu.bind(this));
        },
        _renderLanguageMenu: async function () {
            var self = this;
            var current_lang;
            var other_lang;

            const data = await Promise.resolve(self.language);

            if (data.length > 1) {
                _.each(data, function (lang) {
                    if (lang['code'] === session.user_context.lang) {
                        current_lang = lang;
                    }
                });

                var index = data.indexOf(current_lang);
                if (index > -1) {
                    data.splice(index, 1);
                    other_lang = data;
                }

                var $menu_sections = $(QWeb.render('LanguageMenu.sections', {
                    current_lang: current_lang,
                    other_lang: other_lang,
                }));
                self.$el.append($menu_sections);
            }

        },
        _onChangeLanguage: function (ev) {
            var self = this;
            var lang = $(ev.currentTarget).data("code");

            return self._rpc({
                model: 'res.users',
                method: 'write',
                args: [session.uid, {
                    'lang': lang
                }],
            }).then(function (result) {
                if (result) {
                    self.do_action({
                        type: 'ir.actions.client',
                        res_model: 'res.users',
                        tag: 'reload_context',
                        target: 'current',
                    });
                }
            });
        },

    });
    return LanguageMenu;
});