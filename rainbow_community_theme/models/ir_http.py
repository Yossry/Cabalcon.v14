# -*- coding: utf-8 -*-

import json
from odoo import api, models
from odoo.http import request
from odoo.tools import ustr


class Http(models.AbstractModel):
    _inherit = "ir.http"

    def session_info(self):
        """
        设置用户的主题信息
        """
        user_theme_info = super(Http, self).session_info()

        ir_config = self.env["ir.config_parameter"].sudo()
        disable_customization = (
            True
            if ir_config.get_param("rainbow.disable_customization") == "True"
            else False
        )

        if disable_customization:
            # 关闭用户定制主题
            global_theme = {
                "disable_customization": True,
                "global": {
                    "mode": int(ir_config.get_param("rainbow.default_theme_mode")),
                    "submenu_position": int(
                        ir_config.get_param("rainbow.global_submenu_position")
                    ),
                    "color": ir_config.get_param("rainbow.default_theme_color"),
                },
                "drawer": {
                    "enable": True
                    if ir_config.get_param("rainbow.enable_drawer_bg") == "True"
                    else False,
                    "bg": ir_config.get_param("rainbow.drawer_bg") + ".jpg",
                },
                "herder": {
                    "dropdown-menu-color": ir_config.get_param(
                        "rainbow.herder_dropdown_menu_color"
                    )
                },
                "sidebar": {
                    "mode": ir_config.get_param("rainbow.sidebar_mode"),
                    "color": ir_config.get_param("rainbow.sidebar_color"),
                },
                "lock": {
                    "enable": True
                    if ir_config.get_param("rainbow.enable_lock") == "True"
                    else False,
                    "style": int(ir_config.get_param("rainbow.lock_style")),
                },
                "favorites": {
                    "max-apps": int(ir_config.get_param("rainbow.max_favorite_apps")),
                },
                "footer": {
                    "enable": True
                    if ir_config.get_param("rainbow.enable_footer") == "True"
                    else False
                },
            }
            user_theme_info["theme"] = json.loads(json.dumps(global_theme))

        else:
            #  启用用户定制主题
            user_theme = request.env.user.theme
            user_theme_data = json.loads(user_theme)
            user_theme_info["theme"] = user_theme_data

        user_apps = request.env.user.apps
        user_apps_data = json.loads(user_apps)
        user_theme_info["apps"] = user_apps_data

        return user_theme_info

    def get_body_class(self):
        """
        获取主题的body class
        """
        body_class = ""

        global_mode = self.get_user_global_mode()
        sidebar_mode = self.get_user_sidebar_mode()
        theme_color = self.get_user_theme_color()
        if global_mode == 1:
            body_class = "o_style_%s o_sidebar_mode o_sidebar_%s" % (
                theme_color,
                sidebar_mode,
            )
        if global_mode == 2:
            body_class = "o_style_%s o_favorites_mode" % (theme_color)
        if global_mode == 3:
            body_class = "o_style_%s o_drawer_mode" % (theme_color)

        return body_class

    def get_user_global_mode(self):
        """
        获取用户的sidebar模式
        """
        user_theme_info = self.session_info()

        if user_theme_info["theme"]["global"]["mode"] is None:
            return 1
        return user_theme_info["theme"]["global"]["mode"]

    def get_user_sidebar_mode(self):
        """
        获取用户的sidebar模式
        """
        user_theme_info = self.session_info()

        if user_theme_info["theme"]["sidebar"]["mode"] is None:
            return "expand"
        return user_theme_info["theme"]["sidebar"]["mode"]

    def get_user_theme_color(self):
        """
        获取用户的主题颜色
        """
        if request.session.uid is None:
            return "default"
        else:
            user_theme_info = self.sudo().session_info()
            if user_theme_info["theme"]["global"]["color"] is None:
                return "default"
            return user_theme_info["theme"]["global"]["color"]

    def get_user_theme_enable_drawer_bg(self):
        """
        获取用户的是否启用应用抽屉背景
        """
        user_theme_info = self.session_info()

        if user_theme_info["theme"]["drawer"]["enable"] is None:
            return True
        return user_theme_info["theme"]["drawer"]["enable"]

    def get_user_theme_lock_style(self):
        """
        获取用户的锁屏样式
        """
        user_theme_info = self.session_info()
        if user_theme_info["theme"]["lock"]["style"] is None:
            return 2
        return user_theme_info["theme"]["lock"]["style"]

    def get_poweredby_url(self):
        url = self.env["ir.config_parameter"].get_param("rainbow.poweredby_url")
        # return "<a href='%s' target='_blank'>%s</a>" % (url, text)
        return url

    def get_poweredby_text(self):
        text = self.env["ir.config_parameter"].get_param("rainbow.poweredby_text")
        return text
