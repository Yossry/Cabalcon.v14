odoo.define('web.WebClient', function (require) {
    "use strict";

    const AbstractWebClient = require('web.AbstractWebClient');
    const config = require('web.config');
    const core = require('web.core');
    const data_manager = require('web.data_manager');
    const dom = require('web.dom');
    const session = require('web.session');

    const DrawerMenuWrapper = require('rainbow_community_theme.DrawerMenuWrapper');
    const SidebarMenu = require('rainbow_community_theme.SidebarMenu');
    const FavoritesMenu = require('rainbow_community_theme.FavoritesMenu');
    const Menu = require('web.Menu');
    const Footer = require('rainbow_community_theme.Footer');
    var lockStatusKey = 'rainbow_community_theme.lock.status';

    return AbstractWebClient.extend({
        // We should review globally the communication with the web client via events
        events: _.extend({}, AbstractWebClient.prototype.events, {
            'app-clicked': 'on_app_clicked',
            'hide-drawer-menu': '_onHideDrawerMenu',
            'menu-clicked': 'on_menu_clicked',
            'sidebar-expand': '_onExpandSidebarMenu',
            'sidebar-collapse': '_onCollapseSidebarMenu',
            // 'scroll div.o_content': '_showGoTopButton',

        }),
        // 导航栏（可能还有其他组件）通过trigger_up与Web客户端进行通信。 我们暂时不更改它。 
        custom_events: _.extend({}, AbstractWebClient.prototype.custom_events, {
            hide_drawer_menu: '_onHideDrawerMenu',
            show_drawer_menu: '_onShowDrawerMenu',
            menu_clicked: 'on_menu_clicked',
            sidebar_expand: '_onExpandSidebarMenu',
            sidebar_collapse: '_onCollapseSidebarMenu',
            mobile_sidebar_show: '_onShowMobileSidebarMenu',
            mobile_sidebar_hide: '_onHideMobileSidebarMenu',
            start_drag: '_startDrag',
            end_drag: '_ebdDrag',
        }),
        init: function () {
            this._super(...arguments);
            this.drawerMenuManagerDisplayed = false;
            this.sidebar_is_expanded = false;
            this.sidebarMobileMenuDisplayed = false;
        },
        start: function () {
            var self = this;

            var theme = session.theme;
            this.global_mode = 1;

            if (theme.hasOwnProperty("global")) {
                if (theme["global"].hasOwnProperty("mode")) {
                    this.global_mode = theme["global"]["mode"]
                }
            }

            this.dropdown_color = "light";
            if (theme.hasOwnProperty("herder")) {
                if (theme["herder"].hasOwnProperty("dropdown-menu-color")) {
                    this.dropdown_color = theme["herder"]["dropdown-menu-color"];
                }
            }

            this.enable_apps_category = false;
            if (theme.hasOwnProperty("drawer")) {
                if (theme["drawer"].hasOwnProperty("category")) {
                    this.enable_apps_category = theme["drawer"]["category"];
                }
            }

            this.footer_enable = true;
            if (theme.hasOwnProperty("footer")) {
                if (theme["footer"].hasOwnProperty("enable")) {
                    this.footer_enable = theme["footer"]["enable"]
                }
            }

            if (localStorage.getItem(lockStatusKey) == 1) {
                window.location.href = "/web/lock";
            }
            core.bus.on('change_menu_section', this, function (menu_id) {
                this.do_push_state(Object.assign($.bbq.getState(), {
                    menu_id
                }));
            });


            return this._super.apply(this, arguments).then(function () {
                self.set_theme();

                //登陆后打开'/web',获取sidebar的默认active菜单，并保存到state中
                if (self.global_mode === 1) {
                    self.set_sidebar_active_menu();
                }
                core.bus.trigger('scroll_to_top'); //刷新页面后，加载scroll_to_top事件
            });
        },
        set_theme: function () {
            var self = this;
            if (self.dropdown_color == "dark") {
                self.set_messaging_menu_dark();
            }
            if (self.global_mode !== 1) {
                self.setDrawerMenuBg();
            }
        },
        set_messaging_menu_dark: function () {
            var self = this;

            self.$el.find(".o_mail_systray_item").addClass("dropdown-dark");
            var getMessagingMenu = setTimeout(function () {
                if (self.$el.find(".o_MessagingMenu").length > 0) {
                    self.$el.find(".o_MessagingMenu").addClass("dropdown-dark");
                    return;
                } else {
                    getMessagingMenu();
                }
            }, 1000)
        },
        setDrawerMenuBg: function () {
            var theme = session.theme;
            var enable_drawer = true;
            var drawer_bg = "8.jpg";
            if (theme.hasOwnProperty("drawer")) {
                var drawer = theme["drawer"];
                if (drawer.hasOwnProperty("enable")) {
                    enable_drawer = drawer["enable"]
                }
                if (drawer.hasOwnProperty("bg")) {
                    drawer_bg = drawer["bg"]
                }
            }

            var src = "";
            if (enable_drawer) {
                src = "/rainbow_community_theme/static/src/img/drawer/bg-" + drawer_bg;
            } else {
                src = "/rainbow_community_theme/static/src/img/drawer/drawer-menu-bg-overlay.svg";
            }
            this.$el.css("background", "linear-gradient(to right bottom, rgba(119, 113, 126, 0.9) 0%, rgba(201, 168, 169, 0) 100%), url(" + src + ")");
            this.$el.css("background-size", "cover");
        },
        bind_events: function () {
            var self = this;
            this._super.apply(this, arguments);

            /*
               小补丁，允许具有指向锚的href链接。 由于odoo使用井号来表示视图的当前状态，因此我们无法轻松地区分指向锚点的链接和指向另一视图/状态的链接。 如果要导航到锚点，则一定不要更改url的哈希值，否则我们将被重定向到应用程序切换器。
               要检查我们是否有锚点，请首先检查我们是否具有以＃开头的href属性。
               尝试使用JQuery选择器在DOM中查找元素。
               如果我们有一个匹配项，则意味着它可能是指向锚点的链接，因此我们跳转到该锚点
            */
            this.$el.on('click', 'a', function (ev) {
                var disable_anchor = ev.target.attributes.disable_anchor;
                if (disable_anchor && disable_anchor.value === "true") {
                    return;
                }

                var href = ev.target.attributes.href;
                if (href) {
                    if (href.value[0] === '#' && href.value.length > 1) {
                        if (self.$("[id='" + href.value.substr(1) + "']").length) {
                            ev.preventDefault();
                            self.trigger_up('scrollTo', {
                                'selector': href.value
                            });
                        }
                    }
                }
            });
        },
        load_menus: async function () {
            const menuData = await (odoo.loadMenusPromise || odoo.reloadMenus());
            // Compute action_id if not defined on a top menu item
            for (let i = 0; i < menuData.children.length; i++) {
                let child = menuData.children[i];
                if (child.action === false) {
                    while (child.children && child.children.length) {
                        child = child.children[0];
                        if (child.action) {
                            menuData.children[i].action = child.action;
                            break;
                        }
                    }
                }
            }
            odoo.loadMenusPromise = null;
            return menuData;
        },
        show_application: function () {
            var self = this;
            this.set_title();

            if (this.global_mode == 1) {
                return this.menu_dp.add(this.instanciate_menu_widgets()).then(function () {
                    $(window).bind('hashchange', self.on_hashchange);

                    // 如果url的状态为空，则执行url操作（如果不存在，则显示第一个应用程序） 
                    var state = $.bbq.getState(true);
                    if (_.keys(state).length === 1 && _.keys(state)[0] === "cids") {
                        return self.menu_dp.add(self._rpc({
                                model: 'res.users',
                                method: 'read',
                                args: [session.uid, ["action_id"]],
                            }))
                            .then(function (result) {
                                var data = result[0];
                                if (data.action_id) {
                                    return self.do_action(data.action_id[0]).then(function () {
                                        self.menu.change_menu_section(self.menu.action_id_to_primary_menu_id(data.action_id[0]));
                                    });
                                } else {
                                    self.openFirstApp();
                                }
                            });
                    } else {
                        return self.on_hashchange();
                    }
                });
            }
            if (this.global_mode === 2 || this.global_mode == 3) {
                return this.menu_dp.add(this.instanciate_menu_widgets()).then(async () => {
                    $(window).bind('hashchange', this.on_hashchange);
                    // 如果url的状态为空，则执行url操作（如果没有则执行用户的 应用抽屉 菜单）
                    // 如果不为空，我们将触发一个虚拟的hashchange事件，以便`this.on_hashchange`可以切换主菜单并加载操作。 

                    const state = $.bbq.getState(true);
                    if (Object.keys(state).length === 1 && Object.keys(state)[0] === "cids") {
                        const result = await this.menu_dp.add(this._rpc({
                            model: 'res.users',
                            method: 'read',
                            args: [session.uid, ["action_id"]],
                        }));
                        const data = result[0];
                        if (data.action_id) {
                            await this.do_action(data.action_id[0]);
                            this.menu.change_menu_section(this.menu.action_id_to_primary_menu_id(data.action_id[0]));
                            return this.toggleDrawerMenu(false);
                        } else {
                            return this.toggleDrawerMenu(true);
                        }

                    } else {
                        return this.on_hashchange();
                    }
                });
            }
        },
        openFirstApp: function () {
            var self = this;

            return self.load_menus().then(function (menu_data) {
                var firstApp = menu_data["children"][0];
                var action_id = parseInt(firstApp["action"] ? firstApp["action"].split(',')[1] : '');

                return self.do_action(action_id).then(function () {
                    self.menu.change_menu_section(self.menu.action_id_to_primary_menu_id(action_id));
                });
            })
        },
        set_sidebar_active_menu() {
            var state = $.bbq.getState(true);

            if (state['action'] == "website.theme_install_kanban_action") {
                //安装website 跳转安装website主题时的处理
                var xmlid = "website.menu_website_configuration";
                $.each($("a.top_menu_link"), function () {
                    if ($(this).data("menu-xmlid") == xmlid) {
                        $(this).parents('.top-menu').addClass("active");
                        $(this).parents('li').addClass("open");
                        $(this).parents('li').find("> a > span.arrow ").addClass("open");
                        $(this).parents('li').find("> ul.sub-menu").show();
                        if (($(this).position()).top > 200) {
                            $(".o_sidebar_menu").animate({
                                scrollTop: ($(this).position()).top
                            }, 1000);
                            return false;
                        }
                    }
                })
            } else {
                var $link = $(".o_sidebar_menu").find("a[data-action-id=" + state['action'] + "]:last")
                if ($link.length > 0) {
                    $link.parents('.top-menu').addClass("active");
                    $link.parents('li').addClass("open");
                    $link.parents('li').find("> a > span.arrow ").addClass("open");
                    $link.parents('li').find("> ul.sub-menu").show();
                    if (($link.position()).top > 200) {
                        $(".o_sidebar_menu").animate({
                            scrollTop: ($link.position()).top
                        }, 1000);
                        return false;
                    }
                } else {
                    return
                }
            }
        },
        load_menu_category: function () {
            return this._rpc({
                model: 'ir.ui.menu.category',
                method: 'get_menu_category',
            }).then(function (categoryData) {
                return categoryData;
            });
        },
        /**
         * @param {Object} params
         * @param {Object} params.menuData
         * @returns {Promise}
         */
        instanciate_menu_widgets: async function () {
            const menuData = await this.load_menus();

            menuData.isMobile = config.device.isMobile;
            menuData.mode = this.global_mode;

            const enableCategory = this.enable_apps_category;
            const categoryData = await this.load_menu_category();
            menuData.categoryData = categoryData;
            menuData.enableCategory = enableCategory;

            this.menu = await this._instanciateMenu(menuData);
            if (this.global_mode === 1) {
                // 侧边栏菜单模式
                this.sidebarMenuManager = this._instanciateSidebarMenu(menuData);
            }
            if (this.global_mode === 2) {
                // 收藏夹菜单模式
                this.FavoritesMenu = this._instanciateFavoritesMenu(menuData);
                this.drawerMenuManager = this._instanciateDrawerMenuWrapper(menuData);
            }
            if (this.global_mode === 3) {
                // 抽屉菜单模式
                this.drawerMenuManager = this._instanciateDrawerMenuWrapper(menuData);
            }
            if (this.footer_enable && !config.device.isMobile) {
                this.footerManager = this._instanciateFooter();
            }
        },

        // --------------------------------------------------------------
        // URL state handling
        // --------------------------------------------------------------

        on_hashchange: async function (ev) {
            if (this._ignore_hashchange) {
                this._ignore_hashchange = false;
                return Promise.resolve();
            }

            var self = this;
            if (this.global_mode == 1) {
                return this.clear_uncommitted_changes().then(function () {
                    var stringstate = $.bbq.getState(false);
                    if (!_.isEqual(self._current_state, stringstate)) {
                        var state = $.bbq.getState(true);
                        if (state.action || (state.model && (state.view_type || state.id))) {
                            return self.menu_dp.add(self.action_manager.loadState(state, !!self._current_state)).then(function () {
                                if (state.menu_id) {
                                    if (state.menu_id !== self.menu.current_primary_menu) {
                                        core.bus.trigger('change_menu_section', state.menu_id);
                                    }
                                } else {
                                    var action = self.action_manager.getCurrentAction();
                                    if (action) {
                                        var menu_id = self.menu.action_id_to_primary_menu_id(action.id);
                                        core.bus.trigger('change_menu_section', menu_id);
                                    }
                                }
                            });
                        } else if (state.menu_id) {
                            var action_id = self.menu.menu_id_to_action_id(state.menu_id);
                            return self.menu_dp.add(self.do_action(action_id, {
                                clear_breadcrumbs: true
                            })).then(function () {
                                core.bus.trigger('change_menu_section', state.menu_id);
                            });
                        } else {
                            self.openFirstApp();
                        }
                    }
                    self._current_state = stringstate;
                }, function () {
                    if (ev) {
                        self._ignore_hashchange = true;
                        window.location = ev.originalEvent.oldURL;
                    }
                });
            }

            if (this.global_mode === 2 || this.global_mode == 3) {
                try {
                    await this.clear_uncommitted_changes();
                } catch (err) {
                    if (ev) {
                        this._ignore_hashchange = true;
                        window.location = ev.originalEvent.oldURL;
                        return;
                    }
                }
                const stringstate = $.bbq.getState(false);
                if (!_.isEqual(this._current_state, stringstate)) {
                    const state = $.bbq.getState(true);
                    if (state.action || (state.model && (state.view_type || state.id))) {
                        let menuDpRejected = false;
                        const loadStateProm = this.action_manager.loadState(state, !!this._current_state)
                            .guardedCatch(() => {
                                if (!menuDpRejected) {
                                    this.toggleDrawerMenu(true);
                                }
                            });
                        return this.menu_dp.add(loadStateProm).then(() => {
                                if (state.menu_id) {
                                    if (state.menu_id !== this.menu.current_primary_menu) {
                                        core.bus.trigger('change_menu_section', state.menu_id);
                                    }
                                } else {
                                    const action = this.action_manager.getCurrentAction();
                                    if (action) {
                                        const menu_id = this.menu.action_id_to_primary_menu_id(action.id);
                                        core.bus.trigger('change_menu_section', menu_id);
                                    }
                                }
                                return this.toggleDrawerMenu(false);
                            })
                            .guardedCatch(() => {
                                menuDpRejected = true;
                            });
                    } else if (state.menu_id) {
                        const action_id = this.menu.menu_id_to_action_id(state.menu_id);
                        await this.menu_dp.add(this.do_action(action_id, {
                            clear_breadcrumbs: true
                        }));
                        core.bus.trigger('change_menu_section', state.menu_id);
                        return this.toggleDrawerMenu(false);
                    } else {
                        return this.toggleDrawerMenu(true);
                    }
                }
                this._current_state = stringstate;
            }

        },

        // --------------------------------------------------------------
        // Menu handling
        // --------------------------------------------------------------

        /**
         * @private
         * @param {OwlEvent} ev
         */
        on_app_clicked: async function (ev) {
            if (this.global_mode === 2 && this.$el.hasClass("apps_favorite_add_mode")) {
                //拖拽模式
                return
            }

            const result = await this.menu_dp.add(data_manager.load_action(ev.detail.action_id));
            return this.action_mutex.exec(() => new Promise((resolve, reject) => {
                const options = Object.assign({}, ev.detail.options, {
                    clear_breadcrumbs: true,
                    action_menu_id: ev.detail.menu_id,
                });
                Promise.resolve(this._openMenu(result, options))
                    .then(() => {
                        this._on_app_clicked_done(ev)
                            .then(resolve)
                            .guardedCatch(reject);
                    })
                    .guardedCatch(async () => {
                        await this.toggleDrawerMenu(true);
                        resolve();
                    });
            }));

        },
        _on_app_clicked_done: function (ev) {
            // console.log("执行_on_app_clicked_done", ev);
            core.bus.trigger('change_menu_section', ev.detail.menu_id);
            if (this.global_mode === 2 || this.global_mode === 3) {
                this.toggleDrawerMenu(false);
            }
            return Promise.resolve();
        },
        on_menu_clicked: async function (ev) {
            // ev.data.action_id is used in case the event is still an odoo event: retrocompatibility
            const action_id = (ev.detail && ev.detail.action_id) || ev.data.action_id;
            const result = await this.menu_dp.add(data_manager.load_action(action_id));
            const options = Object.assign({}, ev.data && ev.data.options, {
                clear_breadcrumbs: true
            });
            await this.action_mutex.exec(() => this._openMenu(result, options));
            this.el.classList.remove('o_mobile_menu_opened');
        },
        /**
         * Open the action linked to a menu.
         * This function is mostly used to allow override in other modules.
         *
         * @private
         * @param {Object} action
         * @param {Object} options
         * @returns {Promise}
         */
        _openMenu: function (action, options) {
            return this.do_action(action, options);
        },
        /**
         * @param {boolean} display
         * @returns {Promise}
         */
        toggleDrawerMenu: async function (display) {
            // We check that the drawerMenuManagerDisplayed variable is different from
            // the display argument to execute a toggle only when needed.
            if (display === this.drawerMenuManagerDisplayed) {
                return;
            }

            if (display) {
                // 显示抽屉菜单
                await this.clear_uncommitted_changes();
                core.bus.trigger('will_show_drawer_menu');

                // Potential changes have been discarded -> the drawer menu will be displayed
                this.drawerMenuManagerDisplayed = true;

                // Save the current scroll position
                this.scrollPosition = this.getScrollPosition();

                // Detach the web_client contents
                let $to_detach = this.$el.contents()
                    .not(this.menu.$el)
                    .not('.o_loading')
                    .not('.o_in_drawer_menu')
                    .not('.o_notification_manager');


                if (this.global_mode === 2 && this.$el.hasClass("apps_favorite_add_mode")) {
                    //收藏夹模式 拖拽应用场景，在抽屉菜单右侧或底部显示“收藏夹菜单”
                    if (!config.device.isMobile) {
                        $to_detach = this.$el.contents()
                            .not(this.menu.$el)
                            .not('.o_loading')
                            .not('.o_in_drawer_menu')
                            .not('.o_notification_manager')
                            .not('.o_main');
                        this.$el.find(".o_action_manager").addClass("o_hidden");
                    } else {
                        $to_detach = this.$el.contents()
                            .not(this.menu.$el)
                            .not('.o_loading')
                            .not('.o_in_drawer_menu')
                            .not('.o_notification_manager')
                            .not('.o_favorites_menu_wrapper')
                            .not('.o_favorites_toolbar')
                            .not('.o_favorites_toolbar_overlay');
                    }
                }

                this.web_client_content = document.createDocumentFragment();

                if (this.global_mode === 2) {
                    //首次打开web时，无法加载 收藏夹菜单，故需要进行处理

                    if ($(this.web_client_content).find(".o_favorites_menu_wrapper").length == 0) {
                        const menuData = await this.load_menus();
                        var state = $.bbq.getState(true); //简略信息
                        const favorites_menu = new FavoritesMenu(this, menuData, state);
                        if (!config.device.isMobile) {
                            await favorites_menu.appendTo($(this.web_client_content).find(".o_main"));
                        } else {
                            // await favorites_menu.appendTo($(this.web_client_content));
                        }
                    }
                    if (!this.$el.hasClass("apps_favorite_add_mode")) {
                        // 如果body class 不包含 "apps_favorite_add_mode"，触发收藏夹菜单的 "end_dfavorite_add" 事件
                        this.trigger_up("end_dfavorite_add");
                    }

                    dom.detach([{
                        widget: this.action_manager
                    }], {
                        $to_detach: $to_detach
                    }).appendTo(this.web_client_content);
                }
                if (this.global_mode === 3) {
                    dom.detach([{
                        widget: this.action_manager
                    }], {
                        $to_detach: $to_detach
                    }).appendTo(this.web_client_content);
                }

                // Save and clear the url
                this.url = $.bbq.getState();
                if (location.hash) {
                    this._ignore_hashchange = true;
                    $.bbq.pushState('#home', 2); // merge_mode 2 to replace the current state
                }
                $.bbq.pushState({
                    cids: this.url.cids
                }, 0);

                // Attach the drawer_menu
                await this.drawerMenuManager.mount(this.el);
                this.trigger_up('webclient_started');
                core.bus.trigger('show_drawer_menu');
            } else {
                // 隐藏抽屉菜单
                this.drawerMenuManagerDisplayed = false;

                // Detach the drawer_menu
                this.drawerMenuManager.unmount();
                core.bus.trigger('will_hide_drawer_menu');

                if (this.global_mode === 2) {

                    dom.append(this.$el, [this.web_client_content], {
                        in_DOM: true,
                        callbacks: [{
                            widget: this.action_manager
                        }],
                    });
                    if ($(".o_favorites_menu_wrapper").length == 0) {
                        if (config.device.isMobile) {
                            const menuData = await this.load_menus();
                            var state = $.bbq.getState(true); //简略信息
                            const favorites_menu = new FavoritesMenu(this, menuData, state);
                            await favorites_menu.appendTo(this.web_client_content);
                            dom.after(this.$('.o_action_manager'), favorites_menu.$el, {
                                callbacks: [{
                                    widget: favorites_menu
                                }],
                                in_DOM: true,
                            });
                        }
                    }
                    // console.log($(".o_favorites_menu_wrapper").length);

                    this.$el.find(".o_action_manager").removeClass("o_hidden");
                    this.$el.find(".o_favorites_menu_wrapper").removeClass("o_hidden");
                }

                if (this.global_mode === 3) {
                    dom.append(this.$el, [this.web_client_content], {
                        in_DOM: true,
                        callbacks: [{
                            widget: this.action_manager
                        }],
                    });
                }

                delete this.web_client_content;
                this.trigger_up('scrollTo', this.scrollPosition);
                core.bus.trigger('hide_drawer_menu');
            }

            this.menu.toggle_drawer_mode(display, this.action_manager.getCurrentAction() !== null);
            this.el.classList.toggle("o_drawer_menu_background", display);
        },

        toggleSidebarMenu: function (status) {
            var self = this;
            if (!config.device.isMobile) {
                if (status) {
                    self.$el.removeClass('o_sidebar_collapse').addClass('o_sidebar_expand');
                } else {
                    self.$el.removeClass('o_sidebar_expand').addClass('o_sidebar_collapse');
                }
                core.bus.trigger('toggle_sidebar_mode', status);
            }
        },
        displaySidebarMobileMenu: function (display) {
            var self = this;
            if (config.device.isMobile) {
                core.bus.trigger('display_sidebar_moblie_menu', display);
            }
        },
        /**
         * Ensure to toggle off the drawer menu when an action is executed (for
         * instance from a systray item or from a dialog).
         *
         * @private
         */
        current_action_updated: function () {
            this._super.apply(this, arguments);

            // console.log("发生变化");
            // 处理显示隐藏 gototop按钮
            core.bus.trigger('scroll_to_top');
            if (this.global_mode == 3) {
                if (this.drawerMenuManagerDisplayed) {
                    this.toggleDrawerMenu(false);
                }
            }
        },
        _onShowDrawerMenu: function () {
            this.toggleDrawerMenu(true);
        },
        _onHideDrawerMenu: function () {
            // Backbutton is displayed only if the current action is not null (checked in toggleDrawerMenu)
            if (this.menu.backbutton_displayed) {
                // Restore the url
                $.bbq.pushState(this.url, 2); // merge_mode 2 to replace the current state
                this.toggleDrawerMenu(false);
            }
        },
        _onExpandSidebarMenu: function () {
            // console.log("展开");
            this.sidebar_is_expanded = true;
            this.toggleSidebarMenu(true);
        },
        _onCollapseSidebarMenu: function () {
            // console.log("折叠");
            this.sidebar_is_expanded = false;
            this.toggleSidebarMenu(false);
        },
        _onShowMobileSidebarMenu: function () {
            this.sidebarMobileMenuDisplayed = true;
            this.displaySidebarMobileMenu(true);
        },
        _onHideMobileSidebarMenu: function () {
            this.sidebarMobileMenuDisplayed = false;
            this.displaySidebarMobileMenu(false);
        },

        //--------------------------------------------------------------------------
        // Public
        //--------------------------------------------------------------------------

        /**
         * Overrides to return the left and top scroll positions of the webclient
         * in mobile (as it is the main scrolling element in that case).
         *
         * @returns {Object} with keys left and top
         */
        getScrollPosition: function () {
            if (config.device.isMobile) {
                return {
                    left: $(window).scrollLeft(),
                    top: $(window).scrollTop(),
                };
            }
            return this._super.apply(this, arguments);
        },
        getContentScrollPosition: function () {
            if (!config.device.isMobile) {
                return {
                    left: $(window).scrollLeft(),
                    top: $(window).scrollTop(),
                };
            }
            return this._super.apply(this, arguments);
        },

        //--------------------------------------------------------------------------
        // Private
        //--------------------------------------------------------------------------

        /**
         * @private
         * @param {Object} menuData
         * @returns {Menu}
         */
        _instanciateMenu: async function (menuData) {
            const menu = new Menu(this, menuData);
            await menu.appendTo(document.createDocumentFragment());
            menu.toggle_drawer_mode(this.drawerMenuManagerDisplayed, false);

            dom.prepend(this.$el, menu.$el, {
                callbacks: [{
                    widget: menu
                }],
                in_DOM: true,
            });
            return menu;
        },
        /**
         * @private
         * @param {Object} menuData
         * @returns {DrawerMenuWrapper}
         */
        _instanciateDrawerMenuWrapper: function (menuData) {
            return new DrawerMenuWrapper(null, {
                menuData
            });
        },
        _instanciateSidebarMenu: async function (menuData) {
            var sidebar_mode = "expand";
            if (session.theme.hasOwnProperty("sidebar")) {
                if (session.theme["sidebar"].hasOwnProperty("mode")) {
                    sidebar_mode = session.theme["sidebar"]["mode"];
                }
            }
            if (sidebar_mode === 'expand') {
                this.sidebar_is_expanded = true;
            } else {
                this.sidebar_is_expanded = false;
            }
            var state = $.bbq.getState(true); //简略信息
            // self.action_manager.getCurrentAction() //详细信息

            const sidebar_menu = new SidebarMenu(this, menuData, state, sidebar_mode);
            await sidebar_menu.appendTo(document.createDocumentFragment());
            if (config.device.isMobile) {
                dom.after(this.$('.o_main'), sidebar_menu.$el, {
                    callbacks: [{
                        widget: sidebar_menu
                    }],
                    in_DOM: true,
                });
            } else {
                dom.prepend(this.$('.o_main'), sidebar_menu.$el, {
                    callbacks: [{
                        widget: sidebar_menu
                    }],
                    in_DOM: true,
                });
            }

            return sidebar_menu;
        },
        _instanciateFavoritesMenu: async function (menuData) {
            var state = $.bbq.getState(true); //简略信息
            // self.action_manager.getCurrentAction() //详细信息

            const favorites_menu = new FavoritesMenu(this, menuData, state);
            await favorites_menu.appendTo(document.createDocumentFragment());
            if (config.device.isMobile) {
                dom.after(this.$('.o_action_manager'), favorites_menu.$el, {
                    callbacks: [{
                        widget: favorites_menu
                    }],
                    in_DOM: true,
                });
            } else {
                dom.prepend(this.$('.o_main'), favorites_menu.$el, {
                    callbacks: [{
                        widget: favorites_menu
                    }],
                    in_DOM: true,
                });
            }
            return favorites_menu;
        },
        _instanciateFooter: async function () {
            const footer = new Footer(this);
            await footer.appendTo(document.createDocumentFragment());
            dom.append(this.$('.o_main').parent(), footer.$el, {
                callbacks: [{
                    widget: footer
                }],
                in_DOM: true,
            });
            return footer;
        },

        //--------------------------------------------------------------------------
        // Handlers
        //--------------------------------------------------------------------------

        /**
         * @override
         * @private
         */
        _onScrollTo: function (ev) {
            if (config.device.isMobile) {
                var offset = {
                    top: ev.data.top,
                    left: ev.data.left || 0
                };
                if (!offset.top) {
                    offset = dom.getPosition(document.querySelector(ev.data.selector));
                }
                $(window).scrollTop(offset.top);
                $(window).scrollLeft(offset.left);
            } else {

            }

            this._super.apply(this, arguments);
        },
        _startDrag: function () {},
        _endDrag: function () {},
    });
});