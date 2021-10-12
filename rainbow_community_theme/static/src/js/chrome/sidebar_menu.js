odoo.define('rainbow_community_theme.SidebarMenu', function (require) {
    "use strict";
    var core = require('web.core');
    var session = require('web.session');
    var Widget = require('web.Widget');
    var config = require('web.config');
    var QWeb = core.qweb;

    var SidebarMenu = Widget.extend({
        template: 'SiderbarMenu',
        templateSubmenu: 'SiderbarMenu.FirstLevelMenu',
        slideSpeed: 200,
        auto_scroll: true,
        events: {
            "click button.clear_search": "_onClearSearch",
            "click button.search": "_onClickSidevarMenuSearch",
            'click li > a.nav-link, li > a.nav-toggle, li > a > span.nav-toggle': '_onMenuLinkClicked',
            'mouseenter .o_sidebar_menu': '_onSidebarHoverEffect',
            'mouseleave .o_sidebar_menu': '_onSidebarHoverEffect',
        },
        jsLibs: [
            '/rainbow_community_theme/static/lib/jquery-slimscroll/jquery.slimscroll.min.js',
        ],
        init: function (parent, menu_data, state, mode) {
            var self = this;
            this._super.apply(this, arguments);
            this.menu_data = menu_data;
            this.state = state;
            this.current_primary_menu = state["menu_id"];
            this.mode = mode;

            if (this.mode === 'expand') {
                this.sidebar_is_expanded = true;
            } else {
                this.sidebar_is_expanded = false;
            }
            if (config.device.isMobile) {
                this.is_mobile = true;
            } else {
                this.is_mobile = false;
            }

            var sidebar_style = "default";
            var theme = session.theme;
            if (theme.hasOwnProperty("sidebar")) {
                if (theme["sidebar"].hasOwnProperty("color")) {
                    sidebar_style = theme["sidebar"]["color"];
                }
            }

            if (sidebar_style === 'light') {
                this.is_light_menu = true;
            } else {
                this.is_light_menu = false;
            }

        },
        start: function () {
            var self = this;
            var theme = session.theme;

            var global_submenu_position = 3;
            this.show_submenu = true;
            if (theme.hasOwnProperty("global")) {
                if (theme["global"].hasOwnProperty("submenu_position")) {
                    global_submenu_position = theme["global"]["submenu_position"];
                }
            }


            if (config.device.isMobile) {
                this.show_submenu = true;
            } else {
                if (global_submenu_position == 1) {
                    this.show_submenu = false;
                } else {
                    this.show_submenu = true;
                }
            }

            this.footer_enable = true;
            if (theme.hasOwnProperty("footer")) {
                if (theme["footer"].hasOwnProperty("enable")) {
                    this.footer_enable = theme["footer"]["enable"]
                }
            }

            this.$sidebar_menu = this.$('.o_sidebar_menu');
            this.$sidebar_search = this.$('.sidebar_nav_search');
            if (config.device.isMobile) {
                this.$el.addClass("o_hidden");
            }

            self.handResizeHeight();

            core.bus.on('toggle_sidebar_mode', this, this.toggle_sidebar_mode); // 展开/折叠sidebar
            core.bus.on('display_sidebar_moblie_menu', this, this.display_sidebar_moblie_menu); // 显示/隐藏sidebar_moblie_menu
            return this._super.apply(this, arguments)
                .then(this._renderSidebarMenu.bind(this))
        },
        _renderSidebarMenu: function () {
            this.$sidebarMenu_section = $(QWeb.render(this.templateSubmenu, {
                menu_data: this.menu_data,
                state: this.state,
                mode: this.mode,
                show_submenu: this.show_submenu,
            }));
            this.$sidebar_search.after(this.$sidebarMenu_section);

            this.getSidebarHeight();
        },

        //#region sidebar 动作

        toggle_sidebar_mode: function (sidebar_mode) {
            /*
            接收 header menu 折叠 / 展开 按钮事件的传递值，且处理sidebar的状态
            */

            this.sidebar_is_expanded = !!sidebar_mode;
            this.$sidebar_menu.toggleClass('o_sidebar_menu_expand', this.sidebar_is_expanded)
                .toggleClass('o_sidebar_menu_collapse', !this.sidebar_is_expanded);
        },
        display_sidebar_moblie_menu: function (display) {
            /*
            接收 header menu 显示 / 隐藏 按钮事件的传递值，且处理sidebar_moblie_menu的显示和隐藏
            */
            if (display) {
                this.$el.removeClass("o_hidden");
                this.$el.parent().find(".o_action_manager").addClass("o_hidden");
                this.$el.find(".o_sidebar_nav_menu").addClass("in");
            } else {
                this.$el.addClass("o_hidden");
                this.$el.parent().find(".o_action_manager").removeClass("o_hidden");
                this.$el.find(".o_sidebar_nav_menu").removeClass("in");
            }
        },
        _onMenuLinkClicked: function (ev) {
            ev.preventDefault();
            var self = this;
            var hasSubMenu = false;
            var that = $(ev.currentTarget).closest('.nav-item').children('.nav-link');
            var top_menu = $(ev.currentTarget).parents("top-menu");
            hasSubMenu = that.next().hasClass('sub-menu');
            var parent = that.parent().parent();
            var the = that;
            var menu = self.$sidebar_menu;
            var sub = that.next();
            var autoScroll = self.auto_scroll;
            var slideSpeed = parseInt(self.slideSpeed);
            // var slideOffeset = -200;

            parent.children('li.open').children('a').children('.arrow').removeClass('open');
            parent.children('li.open').children('.sub-menu:not(.always-open)').slideUp(slideSpeed);
            parent.children('li.open').removeClass('open');

            if (sub.is(":visible")) {
                //使用滑动效果，隐藏sub
                $('.arrow', the).removeClass("open");
                the.parent().removeClass("open");

                sub.slideUp(slideSpeed, function () {
                    var pos = (the.position()).top;
                    if (that.parent().hasClass("sub-menu")) {
                        //如果有上级菜单
                        pos = (that.parent().hasClass("sub-menu").position()).top + sub.height();
                    }
                    if (config.device.isMobile) {
                        if (autoScroll === true) {
                            menu.slimScroll({
                                // 'scrollTo': (the.position()).top
                                'scrollTo': pos
                            });
                        }
                    } else {
                        if (autoScroll === true && self.sidebar_is_expanded === true) {
                            menu.slimScroll({
                                // 'scrollTo': (the.position()).top
                                'scrollTo': pos
                            });
                        }
                    }
                });
            } else {
                // 使用滑动效果，显示sub
                if (hasSubMenu) {
                    the.parent().addClass("open");
                    $('.arrow', the).addClass("open");

                    sub.slideDown(slideSpeed, function () {
                        var pos = 0; //需要滚动的高度 

                        if (sub.is(":visible")) {
                            pos = (the.position()).top + sub.height();
                            if (config.device.isMobile) {
                                if (autoScroll === true) {
                                    menu.slimScroll({
                                        'scrollTo': pos
                                    });
                                }
                            } else {
                                if (autoScroll === true && self.sidebar_is_expanded === true) {
                                    menu.slimScroll({
                                        // 'scrollTo': pos
                                        'scrollTo': (the.position()).top
                                    });
                                }
                            }
                        }
                        the.parent().height("auto");
                        sub.height("auto");
                    });

                } else {
                    var menu_id = $(ev.currentTarget).data('menu');
                    var action_id = $(ev.currentTarget).data('action-id');
                    var top_menu_id = $(ev.currentTarget).parents('.top-menu').data('menu');
                    self.current_secondary_menu = menu_id;
                    self.current_primary_menu = top_menu_id;
                    self.toggle_menu_link_active(ev);
                    self._trigger_menu_clicked(self.current_secondary_menu, action_id);
                    core.bus.trigger('change_menu_section', self.current_primary_menu); //传递值给顶部菜单Menu
                }
            }
        },

        toggle_menu_link_active: function (ev) {
            var self = this;

            self.$sidebar_menu.find("li.active").removeClass('active');
            self.$sidebar_menu.find("li.open").removeClass('open');
            self.$sidebar_menu.find("span.arrow.open").removeClass('open');
            self.$sidebar_menu.find("span.selected").remove();

            if (!this.current_primary_menu) {
                //安装website时，会出现menu_id为空的情况
                return
            } else if (!this.current_secondary_menu) {
                //安装website时，会出现menu_id为空的情况
                return
            } else {
                var current_top_menu = self.$sidebar_menu.find('li[data-menu=' + this.current_primary_menu + ']');
                current_top_menu.addClass('active');

                var current_menu = self.$sidebar_menu.find('li[data-menu=' + this.current_secondary_menu + ']');
                if (!$(ev.currentTarget).data('menu')) {
                    return;
                } else {

                    $(ev.currentTarget).parents('li').each(function () {
                        $(this).addClass('active');
                        $(this).find('> a > span.arrow').addClass('open');

                        if ($(this).parent('ul.o_sidebar_menu').length === 1) {
                            $(this).find('> a').append('<span class="selected"></span>');
                        }
                        if ($(this).children('ul.sub-menu').length === 1) {
                            $(this).addClass('open');
                        }
                    })
                }
            }
        },
        _trigger_menu_clicked: function (menu_id, action_id) {
            if (config.device.isMobile) {
                this.display_sidebar_moblie_menu(false);
            }
            this.trigger_up('menu_clicked', {
                id: menu_id,
                action_id: action_id,
                previous_menu_id: this.current_secondary_menu || this.current_primary_menu,
            });
        },
        _onSidebarHoverEffect: function (ev) {
            ev.preventDefault();
            if (!config.device.isMobile) {
                // 2021-07-25 添加判断设备类型
                if (this.sidebar_is_expanded) {
                    return;
                } else {
                    if (this.$sidebar_menu.hasClass("o_sidebar_menu_collapse")) {
                        this.$sidebar_menu.removeClass("o_sidebar_menu_collapse")
                        this.$sidebar_menu.addClass("o_sidebar_menu_expand")
                    } else {
                        this.$sidebar_menu.addClass("o_sidebar_menu_collapse")
                        this.$sidebar_menu.removeClass("o_sidebar_menu_expand")
                    }
                }
            }
        },
        _onShowClose: function (ev) {
            console.log($(ev.currentTarget));
            console.log($(ev.currentTarget).val());
            if ($(ev.currentTarget).val()) {
                $(ev.currentTarget).closest().find("button.close").show()
            } else {
                $(ev.currentTarget).closest().find("button.close").hide()
            }
        },
        _onClearSearch: function (ev) {
            var self = this;
            $(ev.currentTarget).addClass("o_hidden");
            $(".sidebar_nav_search").find("input").val("");

            //显示被隐藏的 li.top-menu 
            $("li.top-menu").removeClass("o_hidden");

            //滚动到当前菜单
            var $link;
            if (self.current_secondary_menu) {
                $link = $("a.nav-link[data-menu=" + self.current_secondary_menu + "]")
            } else {
                $link = $("a.nav-link[data-menu=" + self.current_primary_menu + "]")
            }
            $(".o_sidebar_menu").animate({
                scrollTop: ($link.position()).top
            }, 1000);
            return false;
        },
        _onClickSidevarMenuSearch: function (ev) {
            var search_value = $(".sidebar_nav_search").find("input").val().trim();

            if (!search_value) {
                return;
            } else {
                $("button.clear_search").removeClass("o_hidden");

                var links = new Array();
                var tops = new Array();
                var all_top = new Array();

                $("span.title:contains(" + search_value + ")").each(function () {
                    var link = $(this).parent("a.nav-link").data("menu");
                    links.push(link);
                    var top = $(this).parents("li.top-menu").data("menu");
                    tops.push(top);
                });
                $.each(this.menu_data["children"], function () {
                    all_top.push(this["id"]);
                })
                //去重方法
                function uniqueArr(arr) {
                    var unique = [],
                        temp = {};
                    for (var i = 0; i < arr.length; i++) {
                        if (temp[arr[i]] === undefined) {
                            temp[arr[i]] = 1;
                            unique.push(arr[i]);
                        }
                    }
                    return unique;
                }
                tops = uniqueArr(tops)

                if (links.length > 0) {
                    $(links).each(function () {
                        var $link = $("a[data-menu=" + this + "]");
                        $link.parents('li').addClass("open");
                        $link.parents('li').find("> a > span.arrow ").addClass("open");
                        $link.parents('li').find("> ul.sub-menu").show();
                    })

                    //求差集(非匹配搜索结果的li.top-menu )

                    var difference_top = all_top.filter(function (v) {
                        return tops.indexOf(v) == -1
                    })

                    //隐藏不匹配搜索结果的li.top-menu
                    $.each(difference_top, function () {
                        var $top_menu = $("li[data-menu=" + this + "]");
                        $top_menu.addClass("o_hidden");
                    })

                    var $first_link = $("a[data-menu=" + links[0] + "]");
                    if (($first_link.position()).top > 200) {
                        //滚动到第一个结果
                        $(".o_sidebar_menu").animate({
                            scrollTop: ($first_link.position()).top
                        }, 1000);
                        return false;
                    }
                }
            }

        },
        //#endregion

        getViewPort: function () {
            var e = window,
                a = 'inner';
            if (!('innerWidth' in window)) {
                a = 'client';
                e = document.documentElement || document.body;
            }

            return {
                width: e[a + 'Width'],
                height: e[a + 'Height']
            };
        },

        //#region 滚动条

        //-----------------------------------------------------------------
        // 滚动条
        //-----------------------------------------------------------------
        getSidebarHeight: function () {
            var self = this;
            var height;
            if (!config.device.isMobile) {
                height = this.$el.outerHeight();
            } else {
                height = $(window).height() - $("header").height();
                // height = $(window).height();
            }
            if (height != 0) {
                self.initSidebarScroll(height);
                self.handResizeHeight();
            } else {
                setTimeout(function () {
                    self.getSidebarHeight();
                }, 1000);
            }
        },
        handleSidebarHeight: function () {
            var self = this;
            var sidebar = this.$sidebar_menu;
            var available_height;
            if (!config.device.isMobile) {
                available_height = self.getViewPort().height - $('header').outerHeight();
                // available_height = self.getViewPort().height;
                // if ($('.o_footer').length > 0) {
                //     available_height = self.getViewPort().height - $('.o_footer').outerHeight() - $('header').outerHeight();
                // }
                sidebar.css('height', available_height);
                sidebar.attr('data-height', available_height);

                return available_height;
            } else {
                available_height = self.getViewPort().height - $('header').outerHeight();
                sidebar.css('height', available_height);
                sidebar.attr('data-height', available_height);

                return available_height;
            }
        },
        handResizeHeight: function () {
            var self = this;

            $(window).resize(function () {
                //窗体变化时触发 重新初始化sidebar高度
                self.initSidebarScroll(self.handleSidebarHeight());
            });
        },
        initSidebarScroll: async function (height) {
            /*
            初始化sidebar导航菜单滚动条
            */
            var self = this;
            // var height = this.$el.outerHeight();
            var sidebar_height = height;
            var footer_height = this.$el.parents("body").find(".o_footer").outerHeight();
            // console.log(footer_height);
            if (footer_height && !config.device.isMobile) {
                // 响应式布局 不显示footer
                // sidebar_height = height - footer_height;
            }

            var initNavSlimScroll = function () {
                var navList = self.$sidebar_menu;
                var navHeight = sidebar_height;

                self.destroySlimScroll(navList);
                navList.attr("data-height", navHeight);
                self.initSlimScroll(navList);
            }
            initNavSlimScroll();
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
                    wrapperClass: ($(this).attr("data-wrapper-class") ? $(this).attr("data-wrapper-class") : 'slimScrollDiv'),
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

        // #region web_client使用的帮助程序， 用于从url还原状态（ 通过还原， 读取重新同步菜单和操作管理器）

        action_id_to_primary_menu_id: function (action_id) {
            var primary_menu_id, found;
            for (var i = 0; i < this.menu_data.children.length && !primary_menu_id; i++) {
                found = this._action_id_in_subtree(this.menu_data.children[i], action_id);
                if (found) {
                    primary_menu_id = this.menu_data.children[i].id;
                }
            }
            return primary_menu_id;
        },
        _action_id_in_subtree: function (root, action_id) {
            // action_id can be a string or an integer
            if (root.action && root.action.split(',')[1] === String(action_id)) {
                return true;
            }
            var found;
            for (var i = 0; i < root.children.length && !found; i++) {
                found = this._action_id_in_subtree(root.children[i], action_id);
            }
            return found;
        },
        menu_id_to_action_id: function (menu_id, root) {
            if (!root) {
                root = $.extend(true, {}, this.menu_data);
            }

            if (root.id === menu_id) {
                return root.action.split(',')[1];
            }
            for (var i = 0; i < root.children.length; i++) {
                var action_id = this.menu_id_to_action_id(menu_id, root.children[i]);
                if (action_id !== undefined) {
                    return action_id;
                }
            }
            return undefined;
        },
        //#endregion

        // #region
        //--------------------------------------------------------------------------
        // Public
        //--------------------------------------------------------------------------


        //#endregion
    })
    return SidebarMenu;
});