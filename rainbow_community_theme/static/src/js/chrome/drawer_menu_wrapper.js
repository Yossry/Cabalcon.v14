odoo.define("rainbow_community_theme.DrawerMenuWrapper", function (require) {
    "use strict";

    const DrawerMenu = require('rainbow_community_theme.DrawerMenu');
    const utils = require('web.utils');

    const {
        Component,
        useState
    } = owl;

    /**
     * Drawer menu manager (pseudo-webclient)
     *
     * This component is meant to become the WebClient component in the future. For
     * now, its only purpose is to correctly instanciate the appropriate DrawerMenu after
     * processing its given data.
     * @extends Component
     */
    class DrawerMenuWrapper extends Component {
        constructor() {
            super(...arguments);
            const {
                mode,
                isMobile,
                enableCategory,
                categoryData,
                apps,
                menuItems
            } = this._processMenuData(this.props.menuData);

            this.state = useState({
                mode,
                isMobile,
                enableCategory,
                categoryData,
                apps,
                menuItems
            });
        }

        //--------------------------------------------------------------------------
        // Public
        //--------------------------------------------------------------------------

        /**
         * Used by the web_client to update the state of the DrawerMenuWrapper
         * @param {Object} menuData
         */
        updateMenuData(menuData) {
            const {
                mode,
                isMobile,
                enableCategory,
                categoryData,
                apps,
                menuItems
            } = this._processMenuData(menuData);

            this.state.mode = mode;
            this.state.isMobile = isMobile;
            this.state.enableCategory = enableCategory;
            this.state.categoryData = categoryData;
            this.state.apps = apps;
            this.state.menuItems = menuItems;
        }

        //--------------------------------------------------------------------------
        // Private
        //--------------------------------------------------------------------------

        /**
         * @private
         * @param {Object} menuData                 The considered menu, (initially "Root")
         * @param {string} [menuData.action]
         * @param {number|false} menuData.id
         * @param {number} menuData.menu_id         (When menu not an app) id of the parent app
         * @param {string} menuData.name
         * @param {number} [menuData.parent_id]
         * @param {number} [menuData.category_id]   apps category
         * @param {string} [menuData.web_icon]      Path of the icon
         * @param {string} [menuData.web_icon_data]   Base64 string representation of the web icon
         * @param {string} menuData.xmlid
         * @returns {Object[]}
         */
        _processMenuData(menuData) {
            const apps = [];
            const menuItems = [];
            const mode = menuData.mode;
            const isMobile = menuData.isMobile;
            const enableCategory = menuData.enableCategory;
            const categoryData = menuData.categoryData;
            utils.traversePath(menuData, (menuItem, parents) => {
                if (!menuItem.id || !menuItem.action) {
                    return;
                }
                const isApp = !menuItem.parent_id;
                const item = {
                    parents: parents.slice(1).map(p => p.name).join(' / '),
                    label: menuItem.name,
                    id: menuItem.id,
                    xmlid: menuItem.xmlid,
                    action: menuItem.action ? menuItem.action.split(',')[1] : '',
                    webIcon: menuItem.web_icon,
                    category_id: this.get_category_id(menuItem.category_id),
                };

                if (!menuItem.parent_id) {
                    const [iconClass, color, backgroundColor] = (item.webIcon || '').split(',');
                    if (menuItem.web_icon_data) {
                        item.webIconData = `data:image/png;base64,${menuItem.web_icon_data}`.replace(/\s/g, "");
                    } else if (backgroundColor !== undefined) { // Could split in three parts?
                        item.webIcon = {
                            iconClass,
                            color,
                            backgroundColor
                        };
                    } else {
                        item.webIconData = '/rainbow_community_theme/static/src/img/default_icon_app.png';
                    }

                } else {
                    item.menu_id = parents[1].id;
                }

                // if (!menuItem.category_id) {
                //     item.category_id = menuItem.category_id[0]; //添加category_id
                // } else {
                //     item.category_id = 0;
                // }

                if (isApp) {
                    apps.push(item); //向 应用 末尾添加 item
                } else {
                    menuItems.push(item); //向 菜单项 末尾添加 item
                }
            });
            return {
                mode,
                isMobile,
                enableCategory,
                categoryData,
                apps,
                menuItems
            };
        }
        get_category_id(category_id) {
            if (category_id) {
                return category_id[0];
            } else {
                return 0;
            }
        }
    }

    DrawerMenuWrapper.components = {
        DrawerMenu
    };
    DrawerMenuWrapper.props = {
        menuData: Object,
    };
    DrawerMenuWrapper.template = "DrawerMenuWrapper";

    return DrawerMenuWrapper;
});