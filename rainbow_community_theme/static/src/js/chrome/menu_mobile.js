odoo.define('rainbow_community_theme.MenuMobile', function (require) {
    "use strict";

    /**
     * 该文件包含移动设备中的小部件菜单，以呈现BurgerMenu，该BurgerMenu将全屏打开并显示用户菜单和当前应用程序子菜单。
     */

    var config = require('web.config');
    if (!config.device.isMobile) {
        return;
    }

    var core = require('web.core');
    var session = require('web.session');
    var Menu = require('web.Menu');
    const {
        SwitchCompanyMenuMobile
    } = require('rainbow_community_theme.SwitchCompanyMenuMobile');

    var QWeb = core.qweb;

    Menu.include({
        events: _.extend({}, Menu.prototype.events, {
            'click .o_mobile_menu_toggle': '_onOpenBurgerMenu',
        }),
        menusTemplate: 'Menu.sections.mobile',
        animationDuration: 200,
        /**
         * @override
         */
        start: function () {
            var theme = session.theme;
            this.global_mode = 1;
            if (theme.hasOwnProperty("global")) {
                if (theme["global"].hasOwnProperty("mode")) {
                    this.global_mode = theme["global"]["mode"]
                }
            }
            if (this.global_mode == 1) {
                this.$el.find(".o_menu_brand").addClass("o_hidden");
                this.$el.find(".o_mobile_menu_toggle").addClass("d-none").removeClass("d-block");
                return this._super.apply(this, arguments);
            } else {
                this.$el.find(".o_mobile_menu_toggle").removeClass("d-none").addClass("d-block");
                return this._super.apply(this, arguments).then(this._renderBurgerMenu.bind(this));
            }

        },
        /**
         * @override
         */
        destroy: function () {
            this.$burgerMenu.remove();
            this._super.apply(this, arguments);
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
                    this._closeBurgerMenu();
                    return resp;
                });
        },

        //--------------------------------------------------------------------------
        // Private
        //--------------------------------------------------------------------------

        /**
         * @private
         */
        _closeBurgerMenu: function () {
            var self = this;
            this.$burgerMenu.animate({
                left: '100%'
            }, this.animationDuration, function () {
                self.$burgerMenu.addClass("o_hidden");
            });
        },
        /**
         * @private
         */
        _renderBurgerMenu: function () {

            this.$burgerMenu = $(QWeb.render('BurgerMenu', {
                session: session
            }));
            this.$burgerMenu.addClass("o_hidden");

            // move user menu and app sub menus inside the burger menu
            this.$('.o_user_menu_mobile').appendTo(this.$burgerMenu.find('.o_burger_menu_user'));
            this.$section_placeholder.appendTo(this.$burgerMenu.find('.o_burger_menu_app'));

            const companySwitcher = new SwitchCompanyMenuMobile();
            companySwitcher.appendTo('.o_burger_menu_companies');

            this.$burgerMenu.on('click', '.o_burger_menu_close', this._onCloseBurgerMenu.bind(this));
            this.$burgerMenu.on('click', '.o_burger_menu_topbar.o_toggler', this._onTopbarClicked.bind(this));
            this.$burgerMenu.on('click', '.o_burger_menu_section', this._onBurgerMenuSectionClick.bind(this));

            core.bus.on('close_o_burger_menu', null, this._closeBurgerMenu.bind(this));
            $('body').append(this.$burgerMenu);
        },

        //--------------------------------------------------------------------------
        // Handlers
        //--------------------------------------------------------------------------

        /**
         * Toggles the clicked sub menu
         *
         * @private
         * @param {MouseEvent} ev
         */
        _onBurgerMenuSectionClick: function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            $target.toggleClass('show');
            $target.find('> a .toggle_icon').toggleClass('fa-chevron-down fa-chevron-right');
        },
        /**
         * @private
         * @param {MouseEvent} ev
         */
        _onCloseBurgerMenu: function (ev) {
            ev.stopPropagation();
            this._closeBurgerMenu();
        },
        /**
         * Opens burger menu in mobile
         *
         * @private
         * @param {MouseEvent} event
         */
        _onOpenBurgerMenu: function (ev) {
            ev.preventDefault();

            // update the burger menu content: either display the submenus (if we
            // are in an app, and if it contains submenus) or the user menu
            var displaySubMenus = !this.drawerMenuDisplayed;
            if (displaySubMenus) {
                var app = _.findWhere(this.menu_data.children, {
                    id: this.current_primary_menu
                });
                displaySubMenus = !!(app && app.children.length);
            }
            this.$burgerMenu.find('.o_burger_menu_topbar').toggleClass('o_toggler', displaySubMenus);
            this.$burgerMenu.find('.o_burger_menu_content').toggleClass('o_burger_menu_dark', displaySubMenus);
            this.$burgerMenu.find('.o_burger_menu_caret').toggleClass('o_hidden', !displaySubMenus);
            this.$burgerMenu.find('.o_burger_menu_app').toggleClass('o_hidden', !displaySubMenus);
            this.$burgerMenu.find('.o_burger_menu_user').toggleClass('o_hidden', displaySubMenus);

            // display the burger menu
            this.$burgerMenu.css({
                left: '100%'
            });
            this.$burgerMenu.animate({
                left: '0%'
            }, this.animationDuration).removeClass('o_hidden');
        },
        /**
         * @override
         * @private
         */
        _on_secondary_menu_click: function () {
            this._super.apply(this, arguments);
            this._closeBurgerMenu();
        },
        /**
         * Toggles user menu and app submenus
         *
         * @private
         */
        _onTopbarClicked: function () {
            this.$burgerMenu.find('.o_burger_menu_content').toggleClass('o_burger_menu_dark');
            this.$burgerMenu.find('.o_burger_menu_caret').toggleClass('dropup');
            this.$burgerMenu.find('.o_burger_menu_app, .o_burger_menu_user').toggleClass('o_hidden');
            this.$burgerMenu.find('.o_burger_menu_app .fa-chevron-down').toggleClass('fa-chevron-down fa-chevron-right');
        },
    });

});