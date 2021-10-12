# -*- coding: utf-8 -*-

import json
from odoo import api, fields, models, tools, _
from odoo.addons.base.models.res_users import check_identity


class Users(models.Model):
    _inherit = "res.users"

    def _default_theme(self):
        default_theme = {
            "disable_customization": False,
            "global": {
                # global:全局菜单模式，1.侧边栏模式；2.收藏夹拖放模式；3.应用抽屉模式。
                # submenu_position：子菜单位置，1.顶部菜单；2.侧边栏菜单；3.顶部菜单和侧边栏都显示。
                # color：主题颜色
                "mode": 1,
                "submenu_position": 3,
                "color": "default",
            },
            "drawer": {
                # 仅在 global.mode = 2 , global.mode = 3时候有效
                # enable:启用应用抽屉背景，True为启用；False为不启用。
                # bg:应用抽屉背景图片。
                "enable": True,
                "category": False,
                "bg": "7.jpg",
            },
            "herder": {
                # dropmenu: light， dark
                "dropdown-menu-color": "light"
            },
            "sidebar": {
                # 仅在 global.mode = 1 时候有效
                # mode: expand为展开模式， collapse为折叠模式
                # color:  default，light
                "mode": "expand",
                "color": "default",
            },
            "lock": {
                # enable: 启用锁定屏幕功能，True为启用；False为不启用。
                # style: 锁屏样式
                "enable": True,
                "style": 2,
            },
            "favorites": {
                # 仅在 global.mode = 2 时候有效
                # max-apps: 最大可拖拽收藏的app数量
                "max-apps": 5,
            },
            "footer": {
                # enable: 启用页脚功能，True为启用；False为不启用。
                "enable": True,
            },
        }
        return json.dumps(default_theme, indent=2)

    theme = fields.Char(string="Theme", default=_default_theme, readonly=True)
    apps = fields.Char(string="Applications", default="[]", readonly=True)

    def set_theme(self, args=None):
        result = self.sudo().write(args)
        self.env["res.users"].clear_caches()
        self.env["ir.http"].clear_caches()
        return result

    def set_apps(self, args=None):
        # self.sudo().write({"apps": []})
        result = self.sudo().write(args)
        return result

    def refresh_theme(self, args=None):
        # self.env["res.users"].sudo().clear_caches()
        # self.env["ir.http"].sudo().clear_caches()
        return {"type": "ir.actions.client", "tag": "reload"}

    def get_theme(self):
        theme = json.dumps(self.theme)
        theme_info = {
            "color": theme["color"],
            "launcher_bg_status": theme["launcher_bg_status"],
            "launcher_bg": theme["launcher_bg"],
            "submenu_position": theme["submenu_position"],
            "sidebar_mode": theme["sidebar_mode"],
            "sidebar_position": theme["sidebar_position"],
            "footer": theme["footer"],
        }
        return theme_info

    def read_user_contact_details(self, fields=None, load="_classic_read"):
        values = {}
        if fields and self == self.env.user:
            for key in fields:
                if key == "login":
                    values.update({"login": self.sudo()["login"]})
                if key == "display_name":
                    values.update({"display_name": self.sudo()["display_name"]})
                if key == "work_email" and key in self.SELF_READABLE_FIELDS:
                    values.update({"work_email": self.sudo()["work_email"]})
                if key == "mobile_phone" and key in self.SELF_READABLE_FIELDS:
                    values.update({"mobile_phone": self.sudo()["mobile_phone"]})
                if key == "job_title" and key in self.SELF_READABLE_FIELDS:
                    values.update({"job_title": self.sudo()["job_title"]})
                if key == "work_phone" and key in self.SELF_READABLE_FIELDS:
                    values.update({"work_phone": self.sudo()["work_phone"]})
                if key == "work_location" and key in self.SELF_READABLE_FIELDS:
                    values.update({"work_location": self.sudo()["work_location"]})

        return values

