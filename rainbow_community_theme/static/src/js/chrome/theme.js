odoo.define('rainbow_community_theme.ThemeMenu', function (require) {
    "use strict";
    var config = require('web.config');
    var core = require('web.core');
    var Dialog = require('web.Dialog');
    var Widget = require('web.Widget');
    var session = require('web.session');
    var QWeb = core.qweb;
    var _t = core._t;

    var ThemeMenu = Widget.extend({
        template: 'ThemeMenu',
        events: {
            'click a.o_theme_quick_sidebar_toggler_icon': '_onOpenThemeSidebar',
        },
        jsLibs: [
            '/rainbow_community_theme/static/lib/bootstrap-switch/js/bootstrap-switch.min.js',
            '/rainbow_community_theme/static/lib/jquery-slimscroll/jquery.slimscroll.min.js',
        ],
        cssLibs: [
            '/rainbow_community_theme/static/lib/bootstrap-switch/css/bootstrap-switch.min.css',
        ],
        init: function () {
            this._super.apply(this, arguments);
        },
        start: function () {

        },
        _onOpenThemeSidebar: function (ev) {
            ev.preventDefault();
            var self = this;
            var theme = session.theme;
            self.default_theme = self.getDefaultTheme(theme);

            // $('body').toggleClass('o_theme_quick_sidebar_open');
            // - 'extra-large', 'large', 'medium' 'small' 
            var dialog = new Dialog(this, {
                size: 'medium',
                title: _t("Theme setting"),
                buttons: [{
                        text: _t("Cancel"),
                        classes: 'btn-light btn-lg',
                        close: true,
                    }, {
                        text: _t("Save"),
                        classes: 'btn-success btn-lg',
                        close: true,
                        click: this.saveTheme.bind(this)
                    },

                ],
                $content: QWeb.render('Theme.Settings.Sidebar', {
                    global_mode: self.default_theme["global_mode"],
                    submenu_position: self.default_theme["global_submenu_position"],
                    global_color: self.default_theme["global_color"],
                    enable_drawer: self.default_theme["enable_drawer"],
                    enable_category: self.default_theme["enable_category"],
                    drawer_bg: self.default_theme["drawer_bg"],
                    favorites_max_apps: self.default_theme["favorites_max_apps"],
                    herder_dropdown_menu_color: self.default_theme["herder_dropdown_menu_color"],
                    sidebar_mode: self.default_theme["sidebar_mode"],
                    sidebar_color: self.default_theme["sidebar_color"],
                    enable_footer: self.default_theme["enable_footer"],
                    enable_lock: self.default_theme["enable_lock"],
                    lock_style: self.default_theme["lock_style"],
                })
            });
            dialog.opened().then(function () {
                self.initThemePanel(dialog);
            });
            dialog.open();
        },
        initThemePanel: function (dialog) {
            var self = this;
            var theme = session.theme;

            dialog.$modal.addClass("o_theme_quick_sidebar");
            dialog.$modal.find(".modal-header").addClass("o_theme_quick_sidebar_header");
            dialog.$modal.find(".modal-footer").addClass("o_theme_quick_sidebar_footer");
            dialog.$modal.find(".modal-footer").find("button").hide();
            this.$close_btn = dialog.$modal.find(".modal-header").find("button");
            var $panel = dialog.$modal.find('.modal-body');


            self.initBootstrapSwitch();
            self.initSidebarScroll();
            self.handResizeHeight();

            var new_default_theme = self.getDefaultTheme(theme);

            // 切换全局模式
            $('ul.list-items-global > li', $panel).click(function () {
                $(this).parent().find("i").removeClass("current");
                $(this).find("i").addClass("current");
                new_default_theme["global_mode"] = $(this).find("i").data('global');
                if (new_default_theme["global_mode"] == 1) {
                    $(".sidebar_h3").removeClass("o_hidden");
                    $(".sidebar_ul").removeClass("o_hidden");
                    $(".submenu_position_ul").removeClass("o_hidden");

                    $(".favorites_h3").addClass("o_hidden");
                    $(".favorites_ul").addClass("o_hidden");

                    $(".drawer_h3").addClass("o_hidden");
                    $(".drawer_ul").addClass("o_hidden");
                } else if (new_default_theme["global_mode"] == 2) {
                    $(".sidebar_h3").addClass("o_hidden");
                    $(".sidebar_ul").addClass("o_hidden");
                    $(".submenu_position_ul").addClass("o_hidden");

                    $(".favorites_h3").removeClass("o_hidden");
                    $(".favorites_ul").removeClass("o_hidden");

                    $(".drawer_h3").removeClass("o_hidden");
                    $(".drawer_ul").removeClass("o_hidden");
                } else if (new_default_theme["global_mode"] == 3) {
                    $(".sidebar_h3").addClass("o_hidden");
                    $(".sidebar_ul").addClass("o_hidden");
                    $(".submenu_position_ul").addClass("o_hidden");

                    $(".favorites_h3").addClass("o_hidden");
                    $(".favorites_ul").addClass("o_hidden");

                    $(".drawer_h3").removeClass("o_hidden");
                    $(".drawer_ul").removeClass("o_hidden");
                }
                self.setDefaultTheme(new_default_theme, dialog);
            });

            //切换子菜单的显示位置
            $('select.submenu_position', $panel).change(function () {
                new_default_theme["global_submenu_position"] = $(this).children('option:selected').val();

                self.setDefaultTheme(new_default_theme, dialog);
            });

            //启用和停用应用抽屉
            $('input.drawer_enable', $panel).on("switchChange.bootstrapSwitch", function (ev, state) {
                new_default_theme["enable_drawer"] = state;
                if (state) {
                    $(".drawer_bg_li").removeClass("o_hidden");
                } else {
                    $(".drawer_bg_li").addClass("o_hidden");
                }
                self.setDefaultTheme(new_default_theme, dialog);
            });

            //启用和停用应用类别
            $('input.apps_category', $panel).on("switchChange.bootstrapSwitch", function (ev, state) {
                new_default_theme["enable_category"] = state;
                self.setDefaultTheme(new_default_theme, dialog);
            });

            // 设置应用抽屉背景
            $('ul.list-items-drawer-bg > li', $panel).click(function () {
                $(this).parent().find("li").removeClass("current");
                $(this).addClass("current");
                new_default_theme["drawer_bg"] = $(this).data('img');

                self.setDefaultTheme(new_default_theme, dialog);
            });

            // 给应用抽屉背景图片添加 双击事件
            $('ul.list-items-drawer-bg > li', $panel).dblclick(function (ev) {
                self.showDrawerBgImg($(ev.currentTarget).data('img'));
            });

            //设置收藏夹最大应用数量
            $('select.favorites_max_apps', $panel).change(function () {
                new_default_theme["favorites_max_apps"] = $(this).children('option:selected').val();

                self.setDefaultTheme(new_default_theme, dialog);
            });

            //设置主题颜色
            $('ul.list-items-color  > li', $panel).click(function () {
                $(this).parent().find("li").removeClass("current");
                $(this).addClass("current");
                new_default_theme["global_color"] = $(this).data('style');

                self.setDefaultTheme(new_default_theme, dialog);
            });

            //设置顶部菜单dropdown_menu颜色
            $('select.herder_dropdown_menu_color', $panel).change(function () {
                new_default_theme["herder_dropdown_menu_color"] = $(this).children('option:selected').val();

                self.setDefaultTheme(new_default_theme, dialog);
            });

            // 设置侧边栏模式
            $('select.sidebar_mode', $panel).change(function () {
                new_default_theme["sidebar_mode"] = $(this).children('option:selected').val();

                self.setDefaultTheme(new_default_theme, dialog);
            });

            //设置侧边栏颜色
            $('select.sidebar_color', $panel).change(function () {
                new_default_theme["sidebar_color"] = $(this).children('option:selected').val();

                self.setDefaultTheme(new_default_theme, dialog);
            });

            //启用和停用Footer
            $('input.enable_footer', $panel).on("switchChange.bootstrapSwitch", function (ev, state) {
                new_default_theme["enable_footer"] = state;

                self.setDefaultTheme(new_default_theme, dialog);
            });

            //启用和停用锁屏功能
            $('input.enable_lock', $panel).on("switchChange.bootstrapSwitch", function (ev, state) {
                new_default_theme["enable_lock"] = state;
                if (state) {
                    $(".enable_lock_li").removeClass("o_hidden");
                } else {
                    $(".enable_lock_li").addClass("o_hidden");
                }
                self.setDefaultTheme(new_default_theme, dialog);
            });

            //设置锁屏样式
            $('select.lock_style', $panel).change(function () {
                new_default_theme["lock_style"] = $(this).children('option:selected').val();

                self.setDefaultTheme(new_default_theme, dialog);
            });
        },
        setDefaultTheme: function (theme, dialog) {
            var self = this;

            //比较主题的值是否发生变化
            if (JSON.stringify(theme) == JSON.stringify(self.default_theme)) {
                dialog.$modal.find(".modal-footer").find("button").hide();
            } else {
                dialog.$modal.find(".modal-footer").find("button").show();
            }
            self.handResizeHeight();
            self.new_theme = {
                "global": {
                    "mode": theme["global_mode"],
                    "submenu_position": theme["global_submenu_position"],
                    "color": theme["global_color"],
                },
                "drawer": {
                    "enable": theme["enable_drawer"],
                    "category": theme["enable_category"],
                    "bg": theme["drawer_bg"],
                },
                "herder": {
                    "dropdown-menu-color": theme["herder_dropdown_menu_color"],
                },
                "sidebar": {
                    "mode": theme["sidebar_mode"],
                    "color": theme["sidebar_color"],
                },
                "lock": {
                    "enable": theme["enable_lock"],
                    "style": theme["lock_style"],
                },
                "favorites": {
                    "max-apps": theme["favorites_max_apps"]
                },
                "footer": {
                    "enable": theme["enable_footer"]
                },
            };
        },
        saveTheme: function () {
            var self = this;
            return self._rpc({
                model: 'res.users',
                method: 'set_theme',
                args: [session.uid, {
                    theme: JSON.stringify(self.new_theme)
                }]
            }).then(function (result) {
                if (result) {
                    var title = _t("Theme set successfully!");
                    var message = _t("The theme is set successfully, Click the 'Refresh' button to load the new theme. ");
                    var className = "bg-success";
                    self.$close_btn.trigger("click");
                    self.do_success_notify(title, message, className);
                }
            })
        },
        do_success_notify: function (title, message, className) {
            var self = this;
            return self.displayNotification({
                type: 'success',
                title: title,
                message: message,
                sticky: true,
                className: className,
                buttons: [{
                    text: _t("Refresh"),
                    click: () => self.refreshTheme(),
                    primary: true
                }],
            });
        },

        refreshTheme: function () {
            core.bus.trigger('clear_cache');
            this.do_action('reload_context');
            // var self = this;
            // self._rpc({
            //     model: 'res.users',
            //     method: 'refresh_theme',
            //     args: [session.uid, {}]
            // })
            // self.do_action({
            //     type: 'ir.actions.client',
            //     res_model: 'res.users',
            //     tag: 'reload_context',
            //     target: 'current',
            // });
        },
        initBootstrapSwitch: function () {
            // 初始状态
            if (!$().bootstrapSwitch) {
                return;
            }
            $('input.make-switch').each(function () {

                $(this).bootstrapSwitch('state', $(this).prop('checked'));
            });
        },

        //#region 滚动条

        //-----------------------------------------------------------------
        // 处理高度变化
        //-----------------------------------------------------------------
        handResizeHeight: function () {
            var self = this;

            $(window).resize(function () {
                //窗体变化时触发 重新初始化sidebar高度
                self.initSidebarScroll();
            });
        },

        //-----------------------------------------------------------------
        // 滚动条
        //-----------------------------------------------------------------
        initSidebarScroll: function () {
            /*
            初始化主题设置sidebar滚动条
            */
            var self = this;

            var height = 0;
            var $header = $(".o_theme_quick_sidebar_header");
            var $footer = $(".o_theme_quick_sidebar_footer");
            var initSettingsSlimScroll = function () {
                var settingsList = $(".o_theme_quick_sidebar_settings_list");
                var settingsHeight;
                height = $(window).height() - $header.outerHeight() - $footer.outerHeight();

                settingsHeight = height;

                self.destroySlimScroll(settingsList);
                settingsList.attr("data-height", settingsHeight);
                self.initSlimScroll(settingsList);
            }
            initSettingsSlimScroll();

            // self.handResizeHeight(initSettingsSlimScroll); // reinitialize on window resize
        },
        initSlimScroll: function (el) {
            if (!$().slimScroll) {
                return;
            }

            $(el).each(function () {
                if ($(this).attr("data-initialized")) {
                    return; // exit
                }

                var height;

                if ($(this).attr("data-height")) {
                    height = $(this).attr("data-height");
                } else {
                    height = $(this).css('height');
                }

                $(this).slimScroll({
                    allowPageScroll: true, // allow page scroll when the element scroll is ended
                    size: '7px',
                    color: ($(this).attr("data-handle-color") ? $(this).attr("data-handle-color") : '#bbb'),
                    wrapperClass: ($(this).attr("data-wrapper-class") ? $(this).attr("data-wrapper-class") : 'slimScrollTheme'),
                    railColor: ($(this).attr("data-rail-color") ? $(this).attr("data-rail-color") : '#eaeaea'),
                    // position: isRTL ? 'left' : 'right',
                    height: height,
                    alwaysVisible: ($(this).attr("data-always-visible") == "1" ? true : false),
                    railVisible: ($(this).attr("data-rail-visible") == "1" ? true : false),
                    disableFadeOut: true
                });

                $(this).attr("data-initialized", "1");
            });
        },
        destroySlimScroll: function (el) {
            if (!$().slimScroll) {
                return;
            }

            $(el).each(function () {
                if ($(this).attr("data-initialized") === "1") { // destroy existing instance before updating the height
                    $(this).removeAttr("data-initialized");
                    $(this).removeAttr("style");

                    var attrList = {};
                    // store the custom attribures so later we will reassign.
                    if ($(this).attr("data-handle-color")) {
                        attrList["data-handle-color"] = $(this).attr("data-handle-color");
                    }
                    if ($(this).attr("data-wrapper-class")) {
                        attrList["data-wrapper-class"] = $(this).attr("data-wrapper-class");
                    }
                    if ($(this).attr("data-rail-color")) {
                        attrList["data-rail-color"] = $(this).attr("data-rail-color");
                    }
                    if ($(this).attr("data-always-visible")) {
                        attrList["data-always-visible"] = $(this).attr("data-always-visible");
                    }
                    if ($(this).attr("data-rail-visible")) {
                        attrList["data-rail-visible"] = $(this).attr("data-rail-visible");
                    }

                    $(this).slimScroll({
                        wrapperClass: ($(this).attr("data-wrapper-class") ? $(this).attr("data-wrapper-class") : 'slimScrollDiv'),
                        destroy: true
                    });

                    var the = $(this);

                    // reassign custom attributes
                    $.each(attrList, function (key, value) {
                        the.attr(key, value);
                    });
                }
            });
        },
        //#endregion

        showDrawerBgImg: function (img) {
            var dialog = new Dialog(this, {
                size: 'large',
                buttons: [],
                $content: QWeb.render('Theme.drawer.background.preview', {
                    img: img,
                })
            });
            dialog.opened().then(function () {
                dialog.$modal.find("div.modal-dialog").css("background", "none");
                dialog.$modal.find("div.modal-content").css("background", "none");
                dialog.$modal.find("div.modal-content").css("border", "none");
                dialog.$modal.find("header").css("display", "none");
                dialog.$modal.find("footer").css("display", "none");

                $('.lb-close', dialog.$modal).click(function () {
                    dialog.$modal.modal('hide');
                });
            });
            dialog.open();
        },

        getDefaultTheme: function (theme) {
            var self = this;
            var default_theme = {};
            if (self.hasKey("global", theme)) {
                if (self.hasKey("mode", theme["global"])) {
                    default_theme["global_mode"] = theme["global"]["mode"];
                } else {
                    default_theme["global_mode"] = 1
                }
                if (self.hasKey("submenu_position", theme["global"])) {
                    default_theme["global_submenu_position"] = theme["global"]["submenu_position"];
                } else {
                    default_theme["global_submenu_position"] = 3
                }
                if (self.hasKey("color", theme["global"])) {
                    default_theme["global_color"] = theme["global"]["color"];
                } else {
                    default_theme["global_color"] = "default"
                }
            } else {
                default_theme["global_mode"] = theme["global"]["mode"];
                default_theme["global_submenu_position"] = theme["global"]["submenu_position"];
                default_theme["global_color"] = theme["global"]["color"];
            };
            if (self.hasKey("drawer", theme)) {
                if (self.hasKey("enable", theme["drawer"])) {
                    default_theme["enable_drawer"] = theme["drawer"]["enable"];
                } else {
                    default_theme["enable_drawer"] = true;
                }
                if (self.hasKey("category", theme["drawer"])) {
                    default_theme["enable_category"] = theme["drawer"]["category"];
                } else {
                    default_theme["enable_category"] = true;
                }
                if (self.hasKey("bg", theme["drawer"])) {
                    default_theme["drawer_bg"] = theme["drawer"]["bg"];
                } else {
                    default_theme["drawer_bg"] = "8.jpg";
                }
            } else {
                default_theme["enable_drawer"] = true;
                default_theme["enable_category"] = false;
                default_theme["drawer_bg"] = "8.jpg";
            };
            if (self.hasKey("favorites", theme)) {
                if (self.hasKey("max-apps", theme["favorites"])) {
                    default_theme["favorites_max_apps"] = theme["favorites"]["max-apps"];
                } else {
                    default_theme["favorites_max_apps"] = 5;
                }
            } else {
                default_theme["favorites_max_apps"] = 5;
            };
            if (self.hasKey("herder", theme)) {
                if (self.hasKey("dropdown-menu-color", theme["herder"])) {
                    default_theme["herder_dropdown_menu_color"] = theme["herder"]["dropdown-menu-color"];
                } else {
                    default_theme["herder_dropdown_menu_color"] = "light";
                }
            } else {
                default_theme["herder_dropdown_menu_color"] = "light";
            };
            if (self.hasKey("sidebar", theme)) {
                if (self.hasKey("mode", theme["sidebar"])) {
                    default_theme["sidebar_mode"] = theme["sidebar"]["mode"];
                } else {
                    default_theme["sidebar_mode"] = "expand";
                }
                if (self.hasKey("color", theme["sidebar"])) {
                    default_theme["sidebar_color"] = theme["sidebar"]["color"];
                } else {
                    default_theme["sidebar_color"] = "light";
                }
            } else {
                default_theme["sidebar_mode"] = "expand";
                default_theme["sidebar_color"] = "light";
            };
            if (self.hasKey("footer", theme)) {
                if (self.hasKey("enable", theme["footer"])) {
                    default_theme["enable_footer"] = theme["footer"]["enable"];
                } else {
                    default_theme["enable_footer"] = true;
                }
            } else {
                default_theme["enable_footer"] = true;
            };
            if (self.hasKey("lock", theme)) {
                if (self.hasKey("enable", theme["lock"])) {
                    default_theme["enable_lock"] = theme["lock"]["enable"];
                } else {
                    default_theme["enable_lock"] = true;
                }
                if (self.hasKey("style", theme["lock"])) {
                    default_theme["lock_style"] = theme["lock"]["style"];
                } else {
                    default_theme["lock_style"] = 2;
                }
            } else {
                default_theme["enable_lock"] = true;
                default_theme["lock_style"] = 2;
            };

            return default_theme;
        },
        hasKey: function (key, object) {
            if (object.hasOwnProperty(key)) {
                return true;
            } else {
                return false;
            }
        },
    });
    return ThemeMenu;
});