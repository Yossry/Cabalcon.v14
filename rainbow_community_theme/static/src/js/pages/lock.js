odoo.define('rainbow_community_theme.LockScreen1', function (require) {
    "use strict";

    var localStorage = require('web.local_storage');
    var core = require('web.core');
    var publicWidget = require('web.public.widget');
    var Dialog = require('web.Dialog');
    var QWeb = core.qweb;
    var _t = core._t;
    var lockRecoveryLinkKey = 'rainbow_community_theme.lock.recoveryLink';
    var lockStatusKey = 'rainbow_community_theme.lock.status';

    publicWidget.registry.LockScreen1 = publicWidget.Widget.extend({
        selector: '.page-lock1',
        xmlDependencies: ['/rainbow_community_theme/static/src/xml/lock.xml'],
        template: "Lock.Relogin",
        events: {
            'click button.submit': 'onSubmit',
            'click div.lock-bottom > a ': 'onRelogin',
            'click button.close': 'onCloseAlert',
        },

        start: function () {
            var self = this;

            return this._super.apply(this, arguments).then(function () {
                self.initLockScreen();
            })
        },
        initLockScreen: function () {
            var self = this;

            var session = this.getSession();
            var uid = session.user_id;
            var avatar_src = session.url('/web/image', {
                model: 'res.users',
                field: 'image_128',
                id: uid,
            });
            var $avatar = self.$('.lock-avatar');
            $avatar.attr('src', avatar_src);
            return self._rpc({
                model: 'res.users',
                method: 'read_user_contact_details',
                args: [uid],
                kwargs: {
                    fields: ['login', 'work_email', 'display_name', 'mobile_phone', ],
                },
            }).then(function (result) {
                if (result) {
                    if (result.hasOwnProperty("display_name")) {
                        self.name = result["display_name"];
                        self.$('h4').text(result["display_name"]);
                        self.$('.lock-name').text(result["display_name"]);
                    }
                    if (result.hasOwnProperty("login")) {
                        self.logon = result["login"];
                    }

                    if (result.hasOwnProperty("work_email")) {
                        if (result["work_email"]) {
                            self.$('.email').text(result["work_email"]);
                        } else {
                            self.$('.email').text("");
                        }
                    }

                    if (result.hasOwnProperty("mobile_phone")) {
                        if (result["mobile_phone"]) {
                            self.$('.mobile').text(result["mobile_phone"]);
                        } else {
                            self.$('.mobile').text("");
                        }
                    }
                }
            })
        },

        onSubmit: function (ev) {
            ev.stopPropagation();
            ev.preventDefault();
            var self = this;
            var session = this.getSession();
            var params = {
                'uid': session.user_id,
                'login': self.logon,
                'password': self.$('#password').val(),
            };

            $.ajax({
                type: "POST",
                dataType: 'json',
                url: '/web/unlock',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({
                    'jsonrpc': "2.0",
                    'method': "call",
                    "params": params
                }),
                success: function (data) {
                    var state = data["result"]["unlocked_state"];
                    self.$('span.locked').toggleClass('fa-unlock', state).toggleClass('fa-lock', !state);
                    self.$('span.locked').toggleClass('text-success', state).toggleClass('text-warning', !state);
                    self.$('.alert').removeClass("display-hide");
                    if (state) {
                        self.$('span.locked').text(_t("Unlocked"));
                        self.$('.alert').find("span").text(_t("Successfully unlocked! "));
                        self.$('.alert').addClass("alert-success").removeClass("alert-danger");
                        self.$('.input-group').removeClass("has-error");
                        localStorage.setItem(lockStatusKey, 0); //设置解锁状态
                        setTimeout(function () {
                            var link = localStorage.getItem(lockRecoveryLinkKey);
                            window.location.href = link;
                        }, 1000);
                    } else {
                        self.$('.alert').addClass("alert-danger").removeClass("alert-success");
                        self.$('.alert').find("span").text(data["result"]["error"]);
                        self.$('.input-group').addClass("has-error");
                    }
                },
                error: function (data) {
                    console.error("ERROR ", data);
                },
            });
        },
        onCloseAlert: function (ev) {
            ev.stopPropagation();
            ev.preventDefault();
            var self = this;

            self.$("div.alert.alert-danger").addClass("display-hide");
        },
        onRelogin: function (ev) {
            ev.preventDefault();
            var self = this;
            var buttons = [{
                    text: _t("Submit"),
                    classes: 'btn-danger',
                    close: true,
                    click: this._confirmLogout.bind(this),
                },
                {
                    text: _t("Cancel"),
                    close: true,
                },
            ];

            var dialog = new Dialog(this, {
                size: 'small',
                title: _t("Log out"),
                buttons: buttons,
                $content: QWeb.render(self.template, {
                    name: self.name,
                })
            });
            dialog.open();
        },
        _confirmLogout: function (ev) {
            window.location.href = "/web/session/logout?redirect=/";
        },
    })
    return publicWidget.registry.LockScreen1
});

odoo.define('rainbow_community_theme.LockScreen2', function (require) {
    "use strict";

    var localStorage = require('web.local_storage');
    var core = require('web.core');
    var publicWidget = require('web.public.widget');
    var Dialog = require('web.Dialog');
    var QWeb = core.qweb;
    var _t = core._t;
    var lockRecoveryLinkKey = 'rainbow_community_theme.lock.recoveryLink';
    var lockStatusKey = 'rainbow_community_theme.lock.status';

    publicWidget.registry.LockScreen2 = publicWidget.Widget.extend({
        selector: '.page-lock2',
        xmlDependencies: ['/rainbow_community_theme/static/src/xml/lock.xml'],
        template: "Lock.Relogin",
        events: {
            'click button.submit': 'onSubmit',
            'click div.relogin > a ': 'onRelogin',
            'click button.close': 'onCloseAlert',
        },
        jsLibs: [
            '/rainbow_community_theme/static/lib/backstretch/jquery.backstretch.min.js',
        ],
        start: function () {
            var self = this;

            return this._super.apply(this, arguments).then(function () {
                self.change_background();
                self.initLockScreen();
            })
        },
        initLockScreen: function () {
            var self = this;

            // var link = localStorage.getItem(lockRecoveryLinkKey);
            // self.$("input[name='link']").val(link);

            var session = this.getSession();
            var uid = session.user_id;
            var avatar_src = session.url('/web/image', {
                model: 'res.users',
                field: 'image_128',
                id: uid,
            });
            var $avatar = self.$('.page-lock-img');
            $avatar.attr('src', avatar_src);
            return self._rpc({
                model: 'res.users',
                method: 'read_user_contact_details',
                args: [uid],
                kwargs: {
                    fields: ['login', 'work_email', 'display_name', 'mobile_phone', ],
                },
            }).then(function (result) {
                if (result) {
                    if (result.hasOwnProperty("display_name")) {
                        self.name = result["display_name"];
                        self.$('h1').text(result["display_name"]);
                        self.$('.lock-name').text(result["display_name"]);
                    }

                    if (result.hasOwnProperty("login")) {
                        self.logon = result["login"];
                    }

                    if (result.hasOwnProperty("work_email")) {
                        if (result["work_email"]) {
                            self.$('.email').text(result["work_email"]);
                        } else {
                            self.$('.email').text("");
                        }
                    }

                    if (result.hasOwnProperty("mobile_phone")) {
                        if (result["mobile_phone"]) {
                            self.$('.mobile').text(result["mobile_phone"]);
                        } else {
                            self.$('.mobile').text("");
                        }
                    }
                }
            })
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
        onSubmit: function (ev) {
            ev.stopPropagation();
            ev.preventDefault();
            var self = this;
            var session = this.getSession();
            var params = {
                'uid': session.user_id,
                'login': self.logon,
                'password': self.$('#password').val(),
            };

            $.ajax({
                type: "POST",
                dataType: 'json',
                url: '/web/unlock',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({
                    'jsonrpc': "2.0",
                    'method': "call",
                    "params": params
                }),
                success: function (data) {
                    var state = data["result"]["unlocked_state"];
                    self.$('span.locked').toggleClass('fa-unlock', state).toggleClass('fa-lock', !state);
                    self.$('span.locked').toggleClass('text-success', state).toggleClass('text-warning', !state);
                    self.$('.alert').removeClass("display-hide");
                    if (state) {
                        self.$('span.locked').text(_t("Unlocked"));
                        self.$('.alert').find("span").text(_t("Successfully unlocked! "));
                        self.$('.alert').addClass("alert-success").removeClass("alert-danger");
                        self.$('.input-group').removeClass("has-error");
                        localStorage.setItem(lockStatusKey, 0); //设置解锁状态
                        setTimeout(function () {
                            var link = localStorage.getItem(lockRecoveryLinkKey);
                            window.location.href = link;
                        }, 1000);
                    } else {
                        self.$('.alert').addClass("alert-danger").removeClass("alert-success");
                        self.$('.alert').find("span").text(data["result"]["error"]);
                        self.$('.input-group').addClass("has-error");
                    }
                },
                error: function (data) {
                    console.error("ERROR ", data);
                },
            });
        },
        onCloseAlert: function (ev) {
            ev.stopPropagation();
            ev.preventDefault();
            var self = this;

            self.$("div.alert.alert-danger").addClass("display-hide");
        },
        onRelogin: function (ev) {
            ev.preventDefault();
            var self = this;
            var buttons = [{
                    text: _t("Submit"),
                    classes: 'btn-danger',
                    close: true,
                    click: this._confirmLogout.bind(this),
                },
                {
                    text: _t("Cancel"),
                    close: true,
                },
            ];

            var dialog = new Dialog(this, {
                size: 'small',
                title: _t("Log out"),
                buttons: buttons,
                $content: QWeb.render(self.template, {
                    name: self.name,
                })
            });
            dialog.open();
        },
        _confirmLogout: function (ev) {
            window.location.href = "/web/session/logout?redirect=/";
        },
    })
    return publicWidget.registry.LockScreen2
});