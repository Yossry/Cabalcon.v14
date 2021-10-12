odoo.define('rainbow_community_theme.ControlPanel', function (require) {
    "use strict";

    const ControlPanel = require('web.ControlPanel');
    const {
        device
    } = require('web.config');

    const {
        Portal
    } = owl.misc;
    const {
        useState
    } = owl.hooks;
    const STICKY_CLASS = 'o_mobile_sticky';

    if (!device.isMobile) {
        return;
    }

    /**
     * 控制面板：移动布局
     *
     * 此修补程序处理在移动环境中控制面板的滚动行为：滚动到视图中时，控制面板粘贴在窗口顶部。 向上滚动时显示，向下滚动时隐藏。
     * 在视图顶部时，面板的位置将重置为默认值。 
     */
    ControlPanel.patch('rainbow_community_theme.ControlPanel', T => {
        class ControlPanelPatch extends T {

            constructor() {
                super(...arguments);
                this.state = useState({
                    showSearchBar: false,
                    showMobileSearch: false,
                    showViewSwitcher: false,
                });
            }

            mounted() {
                // Bind additional events
                this.onWindowClick = this._onWindowClick.bind(this);
                this.onWindowScroll = this._onScrollThrottled.bind(this);
                window.addEventListener('click', this.onWindowClick);
                document.addEventListener('scroll', this.onWindowScroll);

                this.oldScrollTop = 0;
                this.initialScrollTop = document.documentElement.scrollTop;
                this.el.style.top = '0px';

                super.mounted();
            }

            willUnmount() {
                window.removeEventListener('click', this.onWindowClick);
                document.removeEventListener('scroll', this.onWindowScroll);
            }

            //---------------------------------------------------------------------
            // Private
            //---------------------------------------------------------------------

            /**
             * Get today's date (number).
             * @private
             * @returns {number}
             */
            _getToday() {
                return new Date().getDate();
            }

            //---------------------------------------------------------------------
            // Handlers
            //---------------------------------------------------------------------

            /**
             * Show or hide the control panel on the top screen.
             * The function is throttled to avoid refreshing the scroll position more
             * often than necessary.
             * @private
             */
            _onScrollThrottled() {
                if (this.isScrolling) {
                    return;
                }
                this.isScrolling = true;
                requestAnimationFrame(() => this.isScrolling = false);

                const scrollTop = document.documentElement.scrollTop;
                const delta = Math.round(scrollTop - this.oldScrollTop);

                if (scrollTop > this.initialScrollTop) {
                    // Beneath initial position => sticky display
                    const elRect = this.el.getBoundingClientRect();
                    this.el.classList.add(STICKY_CLASS);
                    this.el.style.top = delta < 0 ?
                        // Going up
                        `${Math.min(0, elRect.top - delta)}px` :
                        // Going down | not moving
                        `${Math.max(-elRect.height, elRect.top - delta)}px`;
                } else {
                    // Above intial position => standard display
                    this.el.classList.remove(STICKY_CLASS);
                }

                this.oldScrollTop = scrollTop;
            }

            /**
             * Reset mobile search state on switch view.
             * @private
             */
            _onSwitchView() {
                Object.assign(this.state, {
                    showSearchBar: false,
                    showMobileSearch: false,
                    showViewSwitcher: false,
                });
            }

            /**
             * @private
             * @param {MouseEvent} ev
             */
            _onWindowClick(ev) {
                if (
                    this.state.showViewSwitcher &&
                    !ev.target.closest('.o_cp_switch_buttons')
                ) {
                    this.state.showViewSwitcher = false;
                }
            }
        }

        ControlPanelPatch.components.Portal = Portal;
        ControlPanelPatch.template = 'rainbow_community_theme.ControlPanel';

        return ControlPanelPatch;
    });
});