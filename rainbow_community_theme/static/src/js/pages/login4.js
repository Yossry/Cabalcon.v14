odoo.define('rainbow_community_theme.login4', function (require) {
    "use strict";
    var publicWidget = require('web.public.widget');
    publicWidget.registry.webLogin4 = publicWidget.Widget.extend({
        selector: 'div.content',
        events: {
            'change #database_list': '_onChange',
        },
        jsLibs: [
            '/web/static/lib/select2/select2.js',
            '/rainbow_community_theme/static/lib/backstretch/jquery.backstretch.min.js',
        ],
        start: function () {
            var self = this;
            return this._super.apply(this, arguments).then(function () {
                $("#database_list").select2({
                    width: '100%',
                });
                self.change_background();
            })
        },
        _onChange: function (ev) {
            //数据库切换
            ev.preventDefault();
            window.location.href = '/web?db=' + $(ev.target).children('option:selected').val();
        },
        change_background: function () {
            $.backstretch([
                "/rainbow_community_theme/static/src/img/pages/login/1.jpg",
                "/rainbow_community_theme/static/src/img/pages/login/2.jpg",
                "/rainbow_community_theme/static/src/img/pages/login/3.jpg",
                "/rainbow_community_theme/static/src/img/pages/login/4.jpg"
            ], {
                fade: 1000,
                duration: 8000
            });
        },
    })
});