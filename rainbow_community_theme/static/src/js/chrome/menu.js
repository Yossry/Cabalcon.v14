odoo.define('web.Menu', function (require) {
    "use strict";

    var config = require('web.config');
    var core = require('web.core');
    var dom = require('web.dom');
    var Widget = require('web.Widget');
    var SystrayMenu = require('web.SystrayMenu');
    var UserMenu = require('web.UserMenu');
    var ThemeMenu = require('rainbow_community_theme.ThemeMenu');
    var LanguageMenu = require('rainbow_community_theme.LanguageMenu');
    var FullScreen = require('rainbow_community_theme.FullScreen');
    var session = require('web.session');

    FullScreen.prototype.sequence = 3;
    SystrayMenu.Items.push(FullScreen);

    LanguageMenu.prototype.sequence = 2;
    SystrayMenu.Items.push(LanguageMenu);

    UserMenu.prototype.sequence = 1;
    SystrayMenu.Items.push(UserMenu);


    if (!session.theme.hasOwnProperty("disable_customization")) {
        ThemeMenu.prototype.sequence = 0; // 强制ThemeMenu成为系统托盘中最右边的项目
        SystrayMenu.Items.push(ThemeMenu);
    } else {
        if (!session.theme["disable_customization"]) {
            ThemeMenu.prototype.sequence = 0; // 强制ThemeMenu成为系统托盘中最右边的项目
            SystrayMenu.Items.push(ThemeMenu);
        }
    }

    var QWeb = core.qweb;

    var Menu = Widget.extend({
        template: 'Menu',
        menusTemplate: 'Menu.sections',
        events: {
            'click .o_menu_toggle': '_onToggleDrawerMenu',
            'mouseover .o_menu_sections > li:not(.show)': '_onMouseOverMenu',
            'click .o_menu_brand': '_onAppNameClicked',
            'click .sidebar-toggle': '_onToggleSideMenu',
        },

        init: function (parent, menu_data) {
            var self = this;
            this._super.apply(this, arguments);
            this.drawerMenuDisplayed = true;
            this.backbutton_displayed = false;
            this.sidebarMode = true;
            this.sidebarMobileMode = false;

            this.$menu_sections = {};
            this.menu_data = menu_data;
            this.is_mobile = config.device.isMobile;
            var theme = session.theme;
            this.dropdown_color = "light";
            if (theme.hasOwnProperty("herder")) {
                if (theme["herder"].hasOwnProperty("dropdown-menu-color")) {
                    this.dropdown_color = theme["herder"]["dropdown-menu-color"];
                }
            }

            // Prepare navbar's menus
            var $menu_sections = $(QWeb.render(this.menusTemplate, {
                menu_data: this.menu_data,
                dropdown_color: this.dropdown_color,
            }));
            $menu_sections.filter('section').each(function () {
                self.$menu_sections[parseInt(this.className, 10)] = $(this).children('li');
            });

            // Bus event
            core.bus.on('change_menu_section', this, this.change_menu_section);
        },
        start: function () {
            var self = this;
            var theme = session.theme;
            this.global_mode = 1;
            this.global_submenu_position = 3;
            if (theme.hasOwnProperty("global")) {
                if (theme["global"].hasOwnProperty("mode")) {
                    this.global_mode = theme["global"]["mode"]
                }
                if (theme["global"].hasOwnProperty("submenu_position")) {
                    this.global_submenu_position = theme["global"]["submenu_position"]
                }
            }

            var sidebar_mode = "expand";
            if (theme.hasOwnProperty("sidebar")) {
                if (theme["sidebar"].hasOwnProperty("mode")) {
                    sidebar_mode = theme["sidebar"]["mode"];
                }
            }
            if (sidebar_mode === 'expand') {
                this.sidebarMode = true;
            } else {
                this.sidebarMode = false;
            }
            this.$menu_sidebar = this.$('.o_menu_logo');



            if (!config.device.isMobile) {
                this.$menu_sidebar.find('i.is_mobile').addClass("o_hidden");
                this.$menu_sidebar.find('i.is_not_mobile').removeClass("o_hidden").toggleClass('fa-angle-double-left', this.sidebarMode)
                    .toggleClass('fa-angle-double-right', !this.sidebarMode);
            } else {
                this.$menu_sidebar.find('i.is_mobile').removeClass("o_hidden");
                this.$menu_sidebar.find('i.is_not_mobile').addClass("o_hidden");
            }

            this.$drawer_menu_toggle = this.$('.o_menu_toggle');
            this.$sidebar_menu_toggle = this.$('.sidebar-toggle');
            this.$menu_brand_placeholder = this.$('.o_menu_brand');
            this.$section_placeholder = this.$('.o_menu_sections');
            this._updateMenuBrand();
            this._hide_show_drawer_menu_toggle_button();

            // Navbar's menus event handlers
            var on_secondary_menu_click = function (ev) {
                ev.preventDefault();
                var menu_id = $(ev.currentTarget).data('menu');
                var action_id = $(ev.currentTarget).data('action-id');
                self._on_secondary_menu_click(menu_id, action_id);
            };
            var menu_ids = _.keys(this.$menu_sections);
            var primary_menu_id, $section;
            for (var i = 0; i < menu_ids.length; i++) {
                primary_menu_id = menu_ids[i];
                $section = this.$menu_sections[primary_menu_id];
                $section.on('click', 'a[data-menu]', self, on_secondary_menu_click.bind(this));
            }

            // Systray Menu
            this.systray_menu = new SystrayMenu(this);
            var autoMoreMenu = this.systray_menu.attachTo(this.$('.o_menu_systray')).then(function () {
                dom.initAutoMoreMenu(self.$section_placeholder, {
                    maxWidth: function () {
                        return self.$el.width() - (self.$menu_sidebar.outerWidth(true) + self.$drawer_menu_toggle.outerWidth(true) + self.$menu_brand_placeholder.outerWidth(true) + self.systray_menu.$el.outerWidth(true));
                    },
                });
            });

            return Promise.all([this._super.apply(this, arguments), autoMoreMenu]);
        },
        toggle_drawer_mode: function (drawer_menu, overapp) {
            this.drawerMenuDisplayed = !!drawer_menu;
            this.backbutton_displayed = this.drawerMenuDisplayed && !!overapp;
            this.$drawer_menu_toggle.toggleClass('fa-chevron-left', this.drawerMenuDisplayed)
                .toggleClass('fa-th', !this.drawerMenuDisplayed);
            this.$drawer_menu_toggle.toggleClass('d-none', this.drawerMenuDisplayed && !this.backbutton_displayed);
            this.$menu_brand_placeholder.toggleClass('d-none', this.drawerMenuDisplayed);
            this.$section_placeholder.toggleClass('d-none', this.drawerMenuDisplayed);

            if (!drawer_menu) {
                // we force here a recomputation of the layout to make sure that the
                // menus are properly rearranged (if there are too many for the size
                // of the screen)
                core.bus.trigger('resize');
            }
        },
        change_menu_section: function (primary_menu_id) {
            var self = this;
            if (!this.$menu_sections[primary_menu_id]) {
                this._updateMenuBrand();
                return; // unknown menu_id
            }

            if (this.current_primary_menu === primary_menu_id) {
                return; // already in that menu
            }

            if (this.current_primary_menu) {
                this.$menu_sections[this.current_primary_menu].detach();
            }


            // Get back the application name
            for (var i = 0; i < this.menu_data.children.length; i++) {
                if (this.menu_data.children[i].id === primary_menu_id) {
                    this._updateMenuBrand(this.menu_data.children[i].name);

                    break;
                }
            }

            if ((this.global_mode == 1 && this.global_submenu_position != 2) && !config.device.isMobile) {
                this.$menu_sections[primary_menu_id].appendTo(this.$section_placeholder);
            }
            if (this.global_mode == 2 || this.global_mode == 3) {
                this.$menu_sections[primary_menu_id].appendTo(this.$section_placeholder);
            }
            this.current_primary_menu = primary_menu_id;

            core.bus.trigger('resize');
        },
        on_attach_callback() {
            this.systray_menu.on_attach_callback();
        },
        _trigger_menu_clicked: function (menu_id, action_id) {
            this.trigger_up('menu_clicked', {
                id: menu_id,
                action_id: action_id,
                previous_menu_id: this.current_secondary_menu || this.current_primary_menu,
            });
        },
        /**
         * Updates the name of the app in the menu to the value of brandName.
         * If brandName is falsy, hides the menu and its sections.
         *
         * @private
         * @param {brandName} string
         */
        _updateMenuBrand: function (brandName) {
            if (brandName) {
                this.$menu_brand_placeholder.text(brandName).show();
                this.$section_placeholder.show();
            } else {
                this.$menu_brand_placeholder.hide()
                this.$section_placeholder.hide();
            }
        },
        _hide_show_drawer_menu_toggle_button: function () {
            if (this.global_mode === 1) {
                this.$drawer_menu_toggle.addClass("o_hidden");
            }

            if (this.global_mode === 2 || this.global_mode === 3) {
                this.$menu_sidebar.remove();
            }
        },
        _on_secondary_menu_click: function (menu_id, action_id) {
            var self = this;

            // It is still possible that we don't have an action_id (for example, menu toggler)
            if (action_id) {
                self._trigger_menu_clicked(menu_id, action_id);
                this.current_secondary_menu = menu_id;
            }
        },
        /**
         * Helpers used by web_client in order to restore the state from
         * an url (by restore, read re-synchronize menu and action manager)
         */
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

        //--------------------------------------------------------------------------
        // Public
        //--------------------------------------------------------------------------

        /**
         * Returns the id of the current primary (first level) menu.
         *
         * @returns {integer}
         */
        getCurrentPrimaryMenu: function () {
            return this.current_primary_menu;
        },
        /**
         * Open the first app
         */
        openFirstApp: function () {
            if (!this.menu_data["children"].length) {
                return
            }
            var firstApp = this.menu_data["children"][0];

            var menu_id = firstApp["id"];
            var action_id = firstApp["action"] ? firstApp["action"].split(',')[1] : '';
            console.log(firstApp, menu_id, action_id);
            this.trigger_up('app-clicked', {
                action_id: parseInt(action_id),
                menu_id: menu_id,
            });
            // var options = _.extend({}, ev.data.options, {
            //     clear_breadcrumbs: true,
            //     action_menu_id: ev.data.menu_id,
            // });
            // return this.do_action(action_id, options);
        },

        //--------------------------------------------------------------------------
        // Handlers
        //--------------------------------------------------------------------------

        /**
         * When clicking on app name, opens the first action of the app
         *
         * @private
         * @param {MouseEvent} ev
         */
        _onAppNameClicked: function (ev) {
            ev.preventDefault();
            var actionID = this.menu_id_to_action_id(this.current_primary_menu);
            this._trigger_menu_clicked(this.current_primary_menu, actionID);
        },
        /**
         * @private
         * @param {MouseEvent} ev
         */
        _onMouseOverMenu: function (ev) {
            //PC模式下，顶部菜单打开子菜单
            if (config.device.isMobile && (this.global_mode == 2 || this.global_mode == 3)) {
                return;
            }
            var $target = $(ev.currentTarget);
            var $opened = $target.siblings('.show');
            if ($opened.length) {
                $opened.find('[data-toggle="dropdown"]:first').dropdown('toggle');
                $opened.removeClass('show');
                $target.find('[data-toggle="dropdown"]:first').dropdown('toggle');
                $target.addClass('show');
            }
        },
        /**
         * @private
         * @param {MouseEvent} ev
         */
        _onToggleDrawerMenu: function (ev) {
            ev.preventDefault();
            // console.log(this.drawerMenuDisplayed);
            if (this.drawerMenuDisplayed && this.global_mode === 2) {
                this.$el.parent("body").removeClass('apps_favorite_add_mode');
            }
            this.trigger_up(this.drawerMenuDisplayed ? 'hide_drawer_menu' : 'show_drawer_menu');

            this.$el.parent().removeClass('o_mobile_menu_opened');
        },
        /**
         * @private
         * @param {MouseEvent} ev
         */
        _onToggleSideMenu: function (ev) {
            ev.preventDefault();
            if (!config.device.isMobile) {
                this.sidebarMode = !this.sidebarMode;
                this.$menu_sidebar.find('i').toggleClass('fa-angle-double-left', this.sidebarMode)
                    .toggleClass('fa-angle-double-right', !this.sidebarMode);
                this.trigger_up(this.sidebarMode ? 'sidebar_expand' : 'sidebar_collapse');

                core.bus.trigger('resize');
            } else {
                this.sidebarMobileMode = !this.sidebarMobileMode;
                this.trigger_up(this.sidebarMobileMode ? 'mobile_sidebar_show' : 'mobile_sidebar_hide');
            }
        },
    });

    return Menu;

});