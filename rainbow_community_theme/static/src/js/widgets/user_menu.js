odoo.define('rainbow_community_theme.UserMenu', function (require) {
    "use strict";

    var localStorage = require('web.local_storage');
    var config = require('web.config');
    var core = require('web.core');
    var UserMenu = require('web.UserMenu');
    var session = require('web.session');
    var _t = core._t;
    var QWeb = core.qweb;

    var documentation_url = 'https://www.odoo.com/documentation/user';
    var documentation_dev_url = 'https://www.odoo.com/documentation';
    var support_url = 'https://www.odoo.com/help';
    var account_title = 'My Online Account';
    var account_url = 'https://accounts.odoo.com/account';

    var lockRecoveryLinkKey = 'rainbow_community_theme.lock.recoveryLink';
    var lockStatusKey = 'rainbow_community_theme.lock.status';

    UserMenu.include({

        /**
         * @override
         */
        init: function () {
            this._super.apply(this, arguments);
            var theme = session.theme;

            this.global_mode = 1;
            if (theme.hasOwnProperty("global")) {
                if (theme["global"].hasOwnProperty("mode")) {
                    this.global_mode = theme["global"]["mode"]
                }
            }
            if (config.device.isMobile && (this.global_mode == 2 || this.global_mode == 3)) {
                this.className = 'o_user_menu_mobile';
                this.tagName = 'ul';
                this.template = undefined;
            }
        },
        /**
         * @override
         */
        start: function () {
            var self = this;
            var theme = session.theme;


            // var session = this.getSession();
            if (config.device.isMobile && (this.global_mode == 2 || this.global_mode == 3)) {
                this.$el.append(QWeb.render('UserMenu.Actions'));
            }

            //设置dropdown-menu背景颜色
            this.dropdown_color = "light";
            if (theme.hasOwnProperty("herder")) {
                if (theme["herder"].hasOwnProperty("dropdown-menu-color")) {
                    this.dropdown_color = theme["herder"]["dropdown-menu-color"];
                }
            }
            if (this.dropdown_color == "dark") {
                this.$el.addClass("dropdown-dark");
            }

            //锁定屏幕
            if (theme.hasOwnProperty("lock")) {
                if (theme["lock"].hasOwnProperty("enable")) {
                    if (theme["lock"]["enable"]) {
                        this.$el.on('click', 'button[data-menu=lock]', function (ev) {
                            ev.preventDefault();
                            var fun = self['_onMenuLock'];
                            fun.call(self, $(this));
                        });
                    } else {
                        this.$el.find("button[data-menu=lock]").remove();
                    }
                }
            }

            //控制debug显示
            if (config.isDebug() === "assets") {
                self.$('a[data-menu=debugassets]').hide();
            } else if (config.isDebug()) {
                self.$('a[data-menu=debug]').hide();
            } else {
                self.$('a[data-menu=quitdebug]').hide();
            }

            return this._super.apply(this, arguments).then(function () {
                var $user_card_avatar = self.$('.o_user_menu_card_avatar');
                if (!session.uid) {
                    $user_card_avatar.attr('src', $user_card_avatar.data('default-src'));
                    return Promise.resolve();
                }
                var user_card_name = session.name;
                self.$('.o_user_menu_card_name').text(user_card_name);
                var card_avatar_src = session.url('/web/image', {
                    model: 'res.users',
                    field: 'image_128',
                    id: session.uid,
                });
                $user_card_avatar.attr('src', card_avatar_src);;




                self._rpc({
                    model: 'res.users',
                    method: 'read_user_contact_details',
                    args: [session.uid],
                    kwargs: {
                        fields: ['job_title', 'mobile_phone', 'work_phone', 'work_email', 'work_location'],
                    },
                }).then(function (result) {
                    if (result) {

                        if (result.hasOwnProperty("job_title")) {
                            if (result["mobile_phone"]) {
                                self.$('.o_user_menu_card_titel').text(result["job_title"]);
                            }
                        }
                        if (result.hasOwnProperty("mobile_phone")) {
                            if (result["mobile_phone"]) {
                                self.$('.o_user_menu_card_mobile').text(result["mobile_phone"]);
                            }
                        }
                        if (result.hasOwnProperty("work_phone")) {
                            if (result["work_phone"]) {
                                self.$('.o_user_menu_card_phone').text(result["work_phone"]);
                            }
                        }
                        if (result.hasOwnProperty("work_email")) {
                            if (result["work_email"]) {
                                self.$('.o_user_menu_card_mail').text(result["work_email"]);
                            }
                        }
                        if (result.hasOwnProperty("work_location")) {
                            if (result["work_location"]) {
                                self.$('.o_user_menu_card_location').text(result["work_location"]);
                            }

                        }
                    }
                }).then(function () {
                    setTimeout(function () {
                        self.setUserMenuUrl();
                    }, 1000);
                })
            });
        },

        //--------------------------------------------------------------------------
        // Public
        //--------------------------------------------------------------------------

        /**
         * @override
         */
        do_action() {
            return this._super(...arguments)
                .then(resp => {
                    core.bus.trigger('close_o_burger_menu');
                    return resp;
                });
        },

        //--------------------------------------------------------------------------
        // Handlers
        //--------------------------------------------------------------------------

        /**
         * @override
         * @private
         */
        _onMenuDocumentation: function () {
            window.open(documentation_url, '_blank');
        },
        _onMenuSupport: function () {
            window.open(support_url, '_blank');
        },
        _onMenuLock: function () {
            var link = window.location.href;
            localStorage.setItem(lockRecoveryLinkKey, link);
            localStorage.setItem(lockStatusKey, 1);
            window.location.href = "/web/lock";
        },
        _onMenuDebug: function () {
            window.location = $.param.querystring(window.location.href, 'debug=1');
        },
        _onMenuDebugassets: function () {
            window.location = $.param.querystring(window.location.href, 'debug=assets');
        },
        _onMenuQuitdebug: function () {
            window.location = $.param.querystring(window.location.href, 'debug=0');
        },
        setUserMenuUrl: function () {
            var self = this;
            // var session = this.getSession();
            self._rpc({
                model: 'ir.config_parameter',
                method: 'get_rainbow_params',
                domain: [],
                fields: ['key', 'value'],
                lazy: false,
            }).then(function (res) {
                $.each(res, function (key, val) {
                    // 设置用户菜单的跳转链接
                    if (val.key === 'rainbow.documentation_url')
                        documentation_url = val.value;
                    if (val.key === 'rainbow.documentation_dev_url')
                        documentation_dev_url = val.value;
                    if (val.key === 'rainbow.support_url')
                        support_url = val.value;
                    if (val.key === 'rainbow.account_title')
                        account_title = val.value;
                    if (val.key === 'rainbow.account_url')
                        account_url = val.value;

                    // 控制用户菜单的链接 显示和隐藏
                    if (val.key === "rainbow.show_lang" && val.value === "False") {
                        self.$('a[data-lang-menu=current_lang]').hide();
                    }

                    if (!session.is_admin) {
                        if (val.key === 'rainbow.show_debug' && val.value === "False") {
                            self.$('a[data-menu=debug]').hide();
                            self.$('a[data-menu=debugassets]').hide();
                            self.$('a[data-menu=quitdebug]').hide();
                        }
                    }
                    if (val.key === 'rainbow.show_documentation' && val.value === "False") {
                        self.$("a[data-menu='documentation']").hide();
                    }
                    if (val.key === 'rainbow.show_documentation_dev' && val.value === "False") {
                        self.$("a[data-menu='documentation_dev']").hide();
                    }
                    if (val.key === 'rainbow.show_support' && val.value === "False") {
                        self.$('a[data-menu=support]').hide();
                    }
                    if (val.key === 'rainbow.show_account' && val.value === "False") {
                        self.$('a[data-menu=account]').hide();
                    }
                    if (val.key === 'rainbow.account_title' && val.value) {
                        self.$('a[data-menu="account"]').html("<i class=\"fa fa-ticket\"/>" + account_title);
                    }
                });
            })
        },
    });

});