odoo.define('rainbow_community_theme.FavoritesMenu', function (require) {
    "use strict";
    var core = require('web.core');
    var session = require('web.session');
    var Widget = require('web.Widget');
    var config = require('web.config');
    var QWeb = core.qweb;
    var _t = core._t;

    var FavoritesMenu = Widget.extend({
        template: 'FavoritesMenu',
        events: {
            'click a.o_favorite_add': '_onAddApps',
            'click a.o_favorite_remove': '_onRemoveApps',
            'click a.o_favorite_submit': '_onSubmit',
            'click a.o_favorite_cancel': '_onCancel',
        },
        jsLibs: [
            '/rainbow_community_theme/static/lib/sortable/Sortable.min.js',
            '/rainbow_community_theme/static/lib/sortable/jquery-sortable.js',
        ],
        dock_container: ".o_favorites_menu", //允许放置的容器
        source_container: ".o_apps", //允许拖动的容器
        init: function (parent, menu_data, state) {
            this._super.apply(this, arguments);
            this.drag = false;
            this.menu_data = menu_data;
            this.state = state;
            this.max_apps = 5;
            this.apps = [];
            this.mode = "";
            this.enable_drawer_bg = true;
            this.drawer_bg = "8.jpg";
            this.is_mobile = config.device.isMobile;

            // Bus event
            core.bus.on('end_dfavorite_add', this, this.setExitAddStyle);
        },
        start: function () {
            var self = this;
            var theme = session.theme;
            if (self.hasKey("favorites", theme)) {
                if (self.hasKey("max-apps", theme["favorites"])) {
                    self.max_apps = theme["favorites"]["max-apps"];
                }
            }
            if (self.hasKey("drawer", theme)) {
                if (self.hasKey("enable", theme["drawer"])) {
                    self.enable_drawer_bg = theme["drawer"]["enable"];
                } else {
                    self.enable_drawer_bg = true;
                }
                if (self.hasKey("bg", theme["drawer"])) {
                    self.drawer_bg = theme["drawer"]["bg"];
                } else {
                    self.drawer_bg = "8.jpg";
                }
            } else {
                self.enable_drawer_bg = true;
                self.drawer_bg = "8.jpg";
            };

            this.apps = session.apps;
            return this._super.apply(this, arguments)
                .then(this.initMenu.bind(this))
        },
        initMenu: function () {
            var self = this;
            if (this.is_mobile && $("body").hasClass("o_drawer_menu_background")) {
                if (self.mode == "") {
                    self.$el.addClass("o_hidden");
                } else {
                    self.$el.removeClass("o_hidden");
                }
            }
            this.apps_data = [];
            $.each(self.apps, function () {
                //遍历用户Apps

                var xmlid = this;
                for (var i = 0; i < self.menu_data.children.length; i++) {
                    if (self.menu_data.children[i].xmlid == xmlid) {
                        self.apps_data.push(self.menu_data.children[i]);
                    }
                }
            })

            this.$sections = $(QWeb.render("FavoritesMenu.sections", {
                apps_data: self.apps_data,
            }));
            this.$el.find(self.dock_container).prepend(this.$sections);

            if (this.is_mobile) {
                if ($('.o_favorites_toolbar').length == 0) {
                    var $toolebar = $(QWeb.render("FavoritesMenu.Toolbar", {}));
                    $('body').append($toolebar);
                }
                var stretchyNavs = $('.o_favorites_toolbar');

                stretchyNavs.each(function () {
                    var stretchyNav = $(this);
                    var stretchyNavTrigger = stretchyNav.find('.o_favorites_toolbar_trigger');
                    stretchyNavTrigger.on('click', function (event) {
                        event.preventDefault();
                        stretchyNav.addClass('nav-is-visible');
                    });

                    var stretchyNavAdd = stretchyNav.find('.o_favorite_add');
                    stretchyNavAdd.on('click', function (event) {
                        event.preventDefault();
                        self._onAddApps(event)
                    });
                    var stretchyNavRemove = stretchyNav.find('.o_favorite_remove');
                    stretchyNavRemove.on('click', function (event) {
                        event.preventDefault();
                        self._onRemoveApps(event)
                    });
                });

                $(document).on('click', function (event) {
                    (!$(event.target).is('.o_favorites_toolbar_trigger') && !$(event.target).is('.o_favorites_toolbar_trigger span')) && stretchyNavs.removeClass('nav-is-visible');
                });
            }
        },
        _onAddApps: function (ev) {
            var self = this;
            ev.preventDefault();
            self.mode = "add";
            self.$el.parents("body").addClass("apps_favorite_add_mode");
            // self.$el.find(".o_tooltip").removeClass("o_hidden");

            // 判断是否显示抽屉菜单
            if (self.$el.parents("body").hasClass("o_drawer_menu_background")) {
                if (self.is_mobile) {

                    //显示抽屉菜单
                    self.trigger_up('show_drawer_menu');
                    setTimeout(function () {
                        if (self.$el.parents("body").hasClass("o_drawer_menu_background")) {
                            self.$el.find(".operate_add_apps").addClass("o_hidden");
                            self.$el.find(".operate_remove_apps").addClass("o_hidden");

                            self.$el.find(".operate_cancel_apps").removeClass("o_hidden");
                            self.compare_apps();
                            self.initMenuDragAdd();
                            return;
                        }
                    }, 500);
                } else {
                    return;
                }
            } else {
                $(self.dock_container).find(".nav-item").addClass("mode_border");

                //显示抽屉菜单
                self.trigger_up('show_drawer_menu');
                setTimeout(function () {
                    if (self.$el.parents("body").hasClass("o_drawer_menu_background")) {
                        self.$el.find(".operate_add_apps").addClass("o_hidden");
                        self.$el.find(".operate_remove_apps").addClass("o_hidden");
                        self.$el.find(".operate_cancel_apps").removeClass("o_hidden");
                        self.compare_apps();
                        self.initMenuDragAdd();
                        return;
                    }
                }, 500);
            }
        },
        _onRemoveApps: function (ev) {
            var self = this;
            ev.preventDefault();
            self.mode = "remove";

            self.$el.parents("body").addClass("apps_favorite_remove_mode");
            self.$el.parents("body").find(".o_main_navbar").addClass("apps_favorite_remove_overlay");
            self.$el.parents("body").find(".o_action_manager").addClass("apps_favorite_remove_overlay");
            self.$el.parents("body").find(".o_footer").addClass("apps_favorite_remove_overlay");
            $(self.dock_container).find(".nav-item").addClass("mode_border");
            self.$el.find(".operate_add_apps").addClass("o_hidden");
            self.$el.find(".o_tooltip").addClass("o_hidden");

            self.$el.find(".operate_cancel_apps").removeClass("o_hidden");
            self.$el.find(".o_favorites_operate_menu").removeClass("o_hidden");
            self.$el.find(".operate_remove_apps").removeClass("o_hidden");

            self.initMenuDragRemove();
        },
        initMenuDragAdd: function () {
            var self = this;
            if (self.mode != "add") {
                return;
            }
            if (this.is_mobile) {
                this.$el.removeClass("o_hidden");
                this.$el.find(".o_favorites_operate_menu").removeClass("o_hidden");
                self.$el.find(".o_tooltip").removeClass("o_hidden");

                self.$el.parents("body").find(".o_favorites_toolbar").addClass("o_hidden");
            }

            self.$el.parents("body").find(".o_apps").sortable({
                group: {
                    name: 'shared_add',
                    pull: 'clone',
                    put: false // Do not allow items to be put into this list
                },
                animation: 150,
                sort: false,
                draggable: ".o_app", // 指定元素中的哪些项应该是可拖动的。
                chosenClass: "chosen_border", // 选中时的DOM节点的class名称，可在此class下定义相应的样式。
                ghostClass: "ghost_border", // 拖放时，提前预设DOM节点的class名称，可在此class下定义相应的样式。
                dragClass: "drag_border", // 拖放时的DOM节点的class名称，可在此class下定义相应的样式
                onStart: function ( /**Event*/ evt) {
                    document.body.ondrop = function (ev) {
                        //避免在火狐浏览器 拖拽图标时，在新窗口打开链接的问题
                        ev.preventDefault();
                        ev.stopPropagation();
                    }
                },
                onEnd: function ( /**Event*/ evt) {
                    // 元素拖动结束了

                    //判断是否拖拽到目标元素内
                    if ($(evt.to).hasClass("o_favorites_menu")) {
                        var same_element_ength = 0;
                        var xmlid = $(evt.item).data("menu-xmlid");
                        $(evt.to).find("a.o_app")
                        $.each($(evt.to).find("a.o_app"), function () {
                            if ($(this).data("menu-xmlid") === xmlid) {
                                same_element_ength += 1;
                            }
                        })

                        //判断是否存在相同元素
                        if (same_element_ength > 1) {
                            $(evt.item).remove();
                            var title = _t("Already exists!");
                            var message = _t("The same application already exists. You cannot drag the same application.")
                            var className = "bg-warning";
                            return self.do_warning_notify(title, message, className);
                        } else {
                            //创建临时元素 且赋值
                            var tmp = $(evt.item);
                            var new_index = evt.newIndex;
                            $(evt.item).remove();
                            //检查应用数量
                            var apps_length = $(evt.to).find("a.o_app").length;

                            if (apps_length == self.max_apps) {
                                var title = _t("Over limit!");
                                var message = _t("Your favorite apps have reached the limit, please modify the configuration.")
                                var className = "bg-warning";
                                $(evt.item).remove();
                                return self.do_warning_notify(title, message, className);
                            } else {
                                var title = $(tmp).find(".o_caption").text();
                                $(tmp).find(".o_caption").remove();
                                var img_data = $(tmp).find('.o_app_icon').css('backgroundImage').split('(')[1].split(')')[0];
                                tmp.find('div.o_app_icon').replaceWith(function () {
                                    return $("<img class='o_app_icon' src=" + img_data + "/>", {
                                        html: $(this).html()
                                    });
                                });
                                tmp.removeAttr("aria-selected").removeAttr("role").removeAttr("id").removeAttr("href").removeClass("o_menuitem");

                                var new_elm = $("<li/>");
                                new_elm.addClass("nav-item mode_border temporary");
                                new_elm.attr("title", title);
                                new_elm.append(tmp);

                                if (new_index === 0) {
                                    $(evt.to).prepend(new_elm); //在被选元素的开头插入内容
                                } else {
                                    $(evt.to).find("li").each(function (index, el) {
                                        if (index == new_index - 1) {
                                            $(el).after(new_elm); //在被选元素之后插入内容
                                        }
                                    })
                                }
                            }

                            self.$el.find(".operate_submit_apps").removeClass("o_hidden"); //显示提交按钮
                            $(evt.clone).addClass("o_hidden"); //隐藏drawer被复制的图标
                        }
                    } else {
                        return
                    }
                },
                onClone: function ( /**Event*/ evt) {
                    //在创建元素的克隆时调用

                },
            });

            self.sortableFavoritesgAddMenu = new Sortable(self.$el.find(".o_favorites_menu").get(0), {
                group: "shared_add",
                sort: true, //在列表内支持排序。
                draggable: ".nav-item", // 指定元素中的哪些项应该是可拖动的。
                animation: 150, // 毫秒，
                chosenClass: "chosen_border",
                ghostClass: "ghost_border",
                dragClass: "drag_border",

                onUpdate: function ( /**Event*/ evt) {
                    self.$el.find(".o_favorites_operate_menu").removeClass("o_hidden");

                    self.$el.find(".operate_submit_apps").removeClass("o_hidden");
                    self.$el.find(".operate_cancel_apps").removeClass("o_hidden");
                },
            });
        },
        initMenuDragRemove: function () {
            var self = this;
            if (self.mode != "remove") {
                return;
            }
            if (this.is_mobile) {
                // console.log(this.$el);
                this.$el.removeClass("o_hidden");
                // this.$toolebar.addClass("o_hidden");
                self.$el.parents("body").find(".o_favorites_toolbar").addClass("o_hidden");
            }
            //移除应用抽屉背景
            if (self.enable_drawer_bg) {
                self.$el.parents("body").css("background", "none")
            }
            self.sortableFavoritesRemoveMenu = new Sortable(self.$el.find(".o_favorites_menu").get(0), {
                group: "shared_remove",
                sort: true, //在列表内支持排序。
                draggable: ".nav-item", // 指定元素中的哪些项应该是可拖动的。
                animation: 150, // 毫秒，
                chosenClass: "chosen_border",
                ghostClass: "ghost_border",
                dragClass: "drag_border",
                onEnd: function (evt) {
                    //判断是否拖拽到垃圾桶
                    if ($(evt.to).hasClass("operate_remove_apps")) {
                        // console.log("目标内")
                        $(evt.item).remove();
                    } else {
                        // console.log("目标外")
                        return;
                    }
                },
                onUpdate: function ( /**Event*/ evt) {
                    self.$el.find(".operate_submit_apps").removeClass("o_hidden");
                    self.$el.find(".operate_cancel_apps").removeClass("o_hidden");
                },
                onRemove: function () {
                    self.$el.find(".operate_submit_apps").removeClass("o_hidden");
                    self.$el.find(".operate_cancel_apps").removeClass("o_hidden");
                }
            })

            if (!self.is_mobile) {
                self.$el.find(".operate_remove_apps").sortable({
                    group: {
                        name: 'shared_remove',
                        pull: true,
                        put: true // Do not allow items to be put into this list
                    },
                    animation: 150,
                    sort: false, // To disable sorting: set sort to false
                });
            } else {
                self.$el.find(".o_favorites_operate_menu").find(".operate_remove_apps").sortable({
                    group: {
                        name: 'shared_remove',
                        pull: true,
                        put: true // Do not allow items to be put into this list
                    },
                    animation: 150,
                    sort: false, // To disable sorting: set sort to false
                });
            }
        },
        compare_apps: function () {
            // 比较数据
            var self = this;
            // console.log(self.apps.length);
            if (self.apps.length === 0) {
                return;
            }

            $.each(self.apps, function () {
                var xmlid = this;
                $.each($(self.source_container).find("a.o_app"), function () {
                    if ($(this).data("menu-xmlid") == xmlid) {
                        $(this).addClass("o_hidden")
                    }
                })
            })
        },
        _onSubmit: function (ev) {
            // 提交
            var self = this;
            ev.preventDefault();
            self.apps = [];
            self.$el.find(".o_favorites_menu").sortable({
                sort: false,
            });

            // 遍历收藏夹菜单中的应用，添加到数组 self.apps
            $(self.dock_container).find(".nav-item").each(function () {
                $(this).removeClass("temporary").removeClass("mode_border");
                self.apps.push($(this).find("a.o_app").data("menu-xmlid"));
            });
            // console.log("提交", self.apps);
            // o_drawer_menu
            return self._rpc({
                model: 'res.users',
                method: 'set_apps',
                args: [session.uid, {
                    apps: JSON.stringify(self.apps)
                }]
            }).then(function (result) {
                if (result) {
                    var title = _t("Successfully!");
                    var message = "";
                    if (self.mode === "add") {
                        message = _t("The application collection is successful.");
                        if (self.is_mobile) {
                            self.$el.find(".o_favorites_operate_menu").addClass("o_hidden");
                            // self.$toolebar.removeClass("o_hidden");
                            self.$el.parents("body").find(".o_favorites_toolbar").removeClass("o_hidden");
                        }
                        self.$el.find(".operate_submit_apps").addClass("o_hidden");
                        self.$el.find(".operate_cancel_apps").addClass("o_hidden");

                        self.$el.find(".operate_add_apps").removeClass("o_hidden");
                        self.$el.find(".operate_remove_apps").removeClass("o_hidden");

                        $(self.source_container).find(".o_app").removeClass("o_hidden");

                        //退出抽屉菜单;
                        self.trigger_up('hide_drawer_menu');
                    } else if (self.mode === "remove") {
                        message = _t("Application removed successfully.");
                        // 退出删除应用模式
                        self.setExitRemoveStyle();
                    }

                    var className = "bg-success";

                    self.mode = "";
                    self.do_success_notify(title, message, className);
                }
            })
        },
        _onCancel: function (ev) {
            var self = this;
            ev.preventDefault();

            if (self.mode === "add") {
                // 退出添加应用模式
                self.setExitAddStyle();

                //退出抽屉菜单
                self.trigger_up('hide_drawer_menu');
            } else if (self.mode === "remove") {
                // 退出删除应用模式
                self.setExitRemoveStyle();

                // 恢复原始菜单
                self.$el.find(self.dock_container).find("li").remove();
                self.$el.find(self.dock_container).prepend(self.$sections);
            }

            self.mode = "";
        },
        setExitAddStyle: function () {
            var self = this;

            if (self.is_mobile) {
                self.$el.find(".operate_submit_apps").addClass("o_hidden");
                self.$el.find(".o_favorites_operate_menu").addClass("o_hidden");
                // self.$toolebar.removeClass("o_hidden");
                self.$el.parents("body").find(".o_favorites_toolbar").removeClass("o_hidden");
            } else {
                self.$el.find(".operate_cancel_apps").addClass("o_hidden");
                self.$el.find(".operate_add_apps").removeClass("o_hidden");
                self.$el.find(".operate_remove_apps").removeClass("o_hidden");
            }
            self.$el.find("li.temporary").remove();
            $(self.source_container).find(".nav-item").removeClass("mode_border");
            $(self.source_container).find(".o_app").removeClass("o_hidden");
        },
        setExitRemoveStyle: function () {
            var self = this;
            self.$el.find(".operate_add_apps").removeClass("o_hidden");
            self.$el.find(".operate_remove_apps").removeClass("o_hidden");
            self.$el.find(".operate_submit_apps").addClass("o_hidden");
            self.$el.find(".operate_cancel_apps").addClass("o_hidden");

            self.$el.parents("body").removeClass("apps_favorite_remove_mode");
            self.$el.parents("body").find(".o_main_navbar").removeClass("apps_favorite_remove_overlay");
            self.$el.parents("body").find(".o_action_manager").removeClass("apps_favorite_remove_overlay");
            self.$el.parents("body").find(".o_footer").removeClass("apps_favorite_remove_overlay");
            if (self.is_mobile) {
                // self.$toolebar.removeClass("o_hidden");
                self.$el.parents("body").find(".o_favorites_toolbar").removeClass("o_hidden");
            }

            if (self.enable_drawer_bg) {
                var src = "/rainbow_community_theme/static/src/img/drawer/bg-" + self.drawer_bg;
                self.$el.parents("body").css("background", "linear-gradient(to right bottom, rgba(119, 113, 126, 0.9) 0%, rgba(201, 168, 169, 0) 100%), url(" + src + ")");
                self.$el.parents("body").css("background-size", "cover");
            }
        },
        hasKey: function (key, object) {
            if (object.hasOwnProperty(key)) {
                return true;
            } else {
                return false;
            }
        },
        do_success_notify: function (title, message, className) {
            var self = this;
            return self.displayNotification({
                type: 'success',
                title: title,
                message: message,
                sticky: false,
                className: className,
            });
        },
        do_warning_notify: function (title, message, className) {
            var self = this;
            return self.displayNotification({
                type: 'warning',
                title: title,
                message: message,
                sticky: false,
                className: className,
            });
        },
    })
    return FavoritesMenu;
});