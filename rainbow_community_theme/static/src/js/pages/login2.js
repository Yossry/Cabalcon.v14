odoo.define('rainbow_community_theme.login2', function (require) {
    "use strict";

    var publicWidget = require('web.public.widget');
    publicWidget.registry.webLogin2 = publicWidget.Widget.extend({
        selector: 'div.content',
        events: {
            'change #database_list': '_onChange',
        },
        jsLibs: [
            '/web/static/lib/select2/select2.js',
        ],
        start: function () {
            return this._super.apply(this, arguments).then(function () {
                $("#database_list").select2({
                    width: '100%',
                });
            })
        },
        _onChange: function (ev) {
            //数据库切换
            ev.preventDefault();
            window.location.href = '/web?db=' + $(ev.target).children('option:selected').val();
        }
    })
});