odoo.define('rainbow_community_theme.Footer', function (require) {
    "use strict";

    var core = require('web.core');
    var Widget = require('web.Widget');
    var QWeb = core.qweb;
    var session = require('web.session');

    var documentation_url = 'https://www.odoo.com/documentation/user';
    var documentation_dev_url = 'https://www.odoo.com/documentation';
    var poweredby_text = 'Powered by Odoo';
    var poweredby_url = 'https://www.odoo.com/';
    var system_name = "ERP Solution";
    var system_version = "14.0.0";

    var Footer = Widget.extend({
        template: 'Footer',
        linkTemplate: 'Footer.Link',
        events: {
            "click a[data-link=poweredby]": "_onMenuSupport",
            "click a[data-link=documentation]": "_onMenuDocumentation",
            "click a[data-link=documentation_dev]": "_onMenuDevDocumentation",
        },
        init: function () {
            this._super.apply(this, arguments);
        },
        start: function () {
            // this._super.apply(this, arguments);
            var self = this;
            this.$poweredby = self.$("a[data-link='poweredby']");

            return this._super.apply(this, arguments)
                .then(function () {
                    self._rpc({
                        model: 'ir.config_parameter',
                        method: 'get_rainbow_params',
                        domain: [],
                        fields: ['key', 'value'],
                        lazy: false,
                    }).then(function (data) {
                        if (data) {
                            $.each(data, function (key, param) {
                                // 设置文本
                                if (param.key === 'rainbow.poweredby_text' && param.value !== "") {
                                    poweredby_text = param.value;
                                }
                                //设置连接
                                if (param.key === 'rainbow.poweredby_url' && param.value !== "") {
                                    poweredby_url = param.value;
                                }
                                if (param.key === 'rainbow.documentation_url' && param.value !== "") {
                                    documentation_url = param.value;
                                }
                                if (param.key === 'rainbow.documentation_dev_url' && param.value !== "") {
                                    documentation_dev_url = param.value;
                                }
                                //设置系统名称
                                if (param.key === 'rainbow.system_name' && param.value !== "") {
                                    system_name = param.value;
                                }
                            });
                            self._renderLinks();
                        }
                    });
                });
        },
        _renderLinks: function () {
            var self = this;
            var system_version = session.server_version.split("+");
            var $lisks = $(QWeb.render('Footer.Link', {
                poweredby_text: poweredby_text,
                system_name: system_name,
                system_version: system_version[0]
            }));
            self.$el.find(".o_footer_inner").append($lisks);
        },

        _onMenuSupport: function (ev) {
            ev.preventDefault();
            window.open(poweredby_url, '_blank');
        },
        _onMenuDocumentation: function (ev) {
            ev.preventDefault();
            window.open(documentation_url, '_blank');
        },
        _onMenuDevDocumentation: function (ev) {
            ev.preventDefault();
            window.open(documentation_dev_url, '_blank');
        },
    });
    return Footer;
});