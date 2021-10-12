# -*- coding: utf-8 -*-

import json
import logging
import base64
import io

from odoo.tools.misc import file_open
from odoo import api, fields, models, tools, SUPERUSER_ID, _
from odoo.modules.module import get_resource_path
from random import randrange
from PIL import Image


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    # 基础设置
    system_name = fields.Char(
        "System Name",
        help="Setup System Name",
        config_parameter="rainbow.system_name",
        translate=True,
        default="ERP Solution",
    )
    web_icon = fields.Char(
        "Web Favicon Icon",
        config_parameter="rainbow.web_icon",
        default="static/src/img/favicon.png",
    )

    # 主题设置
    disable_customization = fields.Boolean(
        "Disable theme customization", default=False,
    )

    # ------------------------------
    # 全局主题选项-开始
    # ------------------------------
    global_mode = fields.Selection(
        string="Global mode",
        selection=[("1", "Sidebar"), ("2", "Favorites"), ("3", "Drawer")],
        config_parameter="rainbow.default_theme_mode",
        required=True,
        default="1",
    )

    global_submenu_position = fields.Selection(
        string="Global Submenu location",
        selection=[
            ("1", "Header menu"),
            ("2", "Sidebar menu"),
            ("3", "Header menu and Sidebar menu"),
        ],
        config_parameter="rainbow.global_submenu_position",
        required=True,
        default="3",
    )

    global_color = fields.Selection(
        string="Global theme color",
        selection=[
            ("default", "Default"),
            ("darkblue", "Dark Blue"),
            ("blue", "Blue"),
            ("lightblue", "Light Blue"),
            ("grey", "Grey"),
            ("light", "Light"),
            ("light2", "Light 2"),
            ("purplishred", "Purplish Red"),
        ],
        config_parameter="rainbow.default_theme_color",
        required=True,
        default="default",
    )

    enable_drawer_bg = fields.Boolean("Enable drawer custom background", default=True)
    enable_apps_category = fields.Boolean("Enable apps category", default=False)
    drawer_bg = fields.Selection(
        string="Drawer background",
        selection=[
            ("1", "1.jpg"),
            ("2", "2.jpg"),
            ("3", "3.jpg"),
            ("4", "4.jpg"),
            ("5", "5.jpg"),
            ("6", "6.jpg"),
            ("7", "7.jpg"),
            ("8", "8.jpg"),
            ("9", "9.jpg"),
        ],
        config_parameter="rainbow.drawer_bg",
        required=True,
        default="7",
    )

    herder_dropdown_menu_color = fields.Selection(
        string="Header drop-down menu background color",
        selection=[("light", "Light"), ("dark", "Dark")],
        config_parameter="rainbow.herder_dropdown_menu_color",
        required=True,
        default="light",
    )

    sidebar_mode = fields.Selection(
        string="Sidebar menu mode",
        selection=[("expand", "Expand"), ("collapse", "Collapse")],
        required=True,
        config_parameter="rainbow.sidebar_mode",
        default="expand",
    )

    sidebar_color = fields.Selection(
        string="Sidebar menu color",
        selection=[("default", "Default"), ("light", "Light")],
        required=True,
        config_parameter="rainbow.sidebar_color",
        default="default",
    )

    enable_lock = fields.Boolean("Enable lock screen", default=True)
    lock_style = fields.Selection(
        string="Lock screen style",
        selection=[("1", "Style 1"), ("2", "Style 2")],
        config_parameter="rainbow.lock_style",
        required=True,
        default="2",
    )

    max_favorite_apps = fields.Selection(
        string="Maximum number of favorite apps",
        selection=[("5", "5"), ("6", "6"), ("7", "7"), ("8", "8")],
        required=True,
        default="5",
        config_parameter="rainbow.max_favorite_apps",
    )

    enable_footer = fields.Boolean("Enable footer", default=True)
    # ------------------------------
    # 全局主题选项-结束
    # ------------------------------

    enable_login_theme = fields.Boolean(
        "Enable login theme",
        default=True,
        help="Uncheck to hide the customize login themes",
    )
    login_theme = fields.Selection(
        [
            ("1", "Theme 1"),
            ("2", "Theme 2"),
            ("3", "Theme 3"),
            ("4", "Theme 4"),
            ("5", "Theme 5"),
            ("6", "Theme 6"),
        ],
        "Login Theme",
        required=True,
        config_parameter="rainbow.login_theme",
    )

    # 全局设置
    show_lang = fields.Boolean(
        "Show Quick Language Switcher",
        help="When enable,User can quick switch language in user menu",
    )
    show_poweredby = fields.Boolean(
        "Show Powered by Text", help="Uncheck to hide the Powered by text",
    )
    poweredby_text = fields.Char(
        "Customize Powered by text(eg. Powered by Odoo)",
        config_parameter="rainbow.poweredby_text",
        translate=True,
        default="Powered by Odoo",
    )
    poweredby_url = fields.Char(
        "Customize Powered by Url(eg. https://www.odoo.com)",
        config_parameter="rainbow.poweredby_url",
        default="https://www.odoo.com",
    )

    apple_icon = fields.Char(
        "Apple Touch Icon",
        config_parameter="rainbow.apple_touch_icon",
        default="/rainbow_community_theme/static/src/img/mobile-icons/apple-152x152.png",
    )
    android_icon = fields.Char(
        "Android Touch Icon",
        config_parameter="rainbow.android_touch_icon",
        default="/rainbow_community_theme/static/src/img/mobile-icons/android-192x192.png",
    )
    windows_icon = fields.Char(
        "Windows Touch Icon",
        config_parameter="rainbow.windows_touch_icon",
        default="/rainbow_community_theme/static/src/img/mobile-icons/windows-144x144.png",
    )

    # 用户菜单
    show_debug = fields.Boolean(
        "Show Quick Debug", help="When enable,everyone login can see the debug menu",
    )
    show_documentation = fields.Boolean(
        "Show Documentation", help="When enable,User can visit user manual",
    )
    show_documentation_dev = fields.Boolean(
        "Show Developer Documentation",
        help="When enable,User can visit development documentation",
    )
    show_support = fields.Boolean(
        "Show Support", help="When enable,User can vist your support site",
    )
    show_account = fields.Boolean(
        "Show My Account", help="When enable,User can login to your website",
    )

    documentation_url = fields.Char(
        "Documentation Url",
        config_parameter="rainbow.documentation_url",
        default="https://www.odoo.com/documentation/user",
    )
    documentation_dev_url = fields.Char(
        "Developer Documentation Url",
        config_parameter="rainbow.documentation_dev_url",
        default="https://www.odoo.com/documentation",
    )
    support_url = fields.Char(
        "Support Url",
        config_parameter="rainbow.support_url",
        default="https://www.odoo.com/buy",
    )
    account_title = fields.Char(
        "Account Title",
        config_parameter="rainbow.account_title",
        translate=True,
        default="My Online Account",
    )
    account_url = fields.Char(
        "Account Url",
        config_parameter="rainbow.account_url",
        default="https://accounts.odoo.com/account",
    )

    # 应用
    module_pos_patch_for_rainbow = fields.Boolean(
        "Enable POS to work normally under the theme of Rainbow Community Edition.",
    )

    @api.model
    def get_values(self):
        res = super(ResConfigSettings, self).get_values()
        ir_config = self.env["ir.config_parameter"].sudo()

        # 全局设置
        show_lang = (
            True if ir_config.get_param("rainbow.show_lang") == "True" else False
        )
        show_poweredby = (
            True if ir_config.get_param("rainbow.show_poweredby") == "True" else False
        )

        # 用户菜单
        show_debug = (
            True if ir_config.get_param("rainbow.show_debug") == "True" else False
        )
        show_documentation = (
            True
            if ir_config.get_param("rainbow.show_documentation") == "True"
            else False
        )
        show_documentation_dev = (
            True
            if ir_config.get_param("rainbow.show_documentation_dev") == "True"
            else False
        )
        show_support = (
            True if ir_config.get_param("rainbow.show_support") == "True" else False
        )
        show_account = (
            True if ir_config.get_param("rainbow.show_account") == "True" else False
        )

        # 应用

        # 主题
        disable_customization = (
            True
            if ir_config.get_param("rainbow.disable_customization") == "True"
            else False
        )
        enable_drawer_bg = (
            True if ir_config.get_param("rainbow.enable_drawer_bg") == "True" else False
        )
        enable_apps_category = (
            True if ir_config.get_param("rainbow.enable_apps_category") == "True" else False
        )
        enable_footer = (
            True if ir_config.get_param("rainbow.enable_footer") == "True" else False
        )
        enable_lock = (
            True if ir_config.get_param("rainbow.enable_lock") == "True" else False
        )

        login_theme = ir_config.get_param("rainbow.login_theme", default="4")
        enable_login_theme = (
            True
            if ir_config.get_param("rainbow.enable_login_theme") == "True"
            else False
        )

        res.update(
            show_lang=show_lang,
            show_debug=show_debug,
            show_poweredby=show_poweredby,
            show_documentation=show_documentation,
            show_documentation_dev=show_documentation_dev,
            show_support=show_support,
            show_account=show_account,
            disable_customization=disable_customization,
            enable_drawer_bg=enable_drawer_bg,
            enable_apps_category=enable_apps_category,
            enable_footer=enable_footer,
            enable_lock=enable_lock,
            enable_login_theme=enable_login_theme,
            login_theme=login_theme,
        )
        return res

    def set_values(self):
        super(ResConfigSettings, self).set_values()
        ir_config = self.env["ir.config_parameter"].sudo()

        ir_config.set_param("rainbow.show_lang", self.show_lang or "False")
        ir_config.set_param("rainbow.show_debug", self.show_debug or "False")
        ir_config.set_param("rainbow.show_poweredby", self.show_poweredby or "False")
        ir_config.set_param("rainbow.poweredby_text", self.poweredby_text or "False")
        ir_config.set_param("rainbow.poweredby_url", self.poweredby_url or "False")
        ir_config.set_param(
            "rainbow.show_documentation", self.show_documentation or "False"
        )
        ir_config.set_param(
            "rainbow.show_documentation_dev", self.show_documentation_dev or "False"
        )
        ir_config.set_param("rainbow.show_support", self.show_support or "False")
        ir_config.set_param("rainbow.show_account", self.show_account or "False")

        ir_config.set_param(
            "rainbow.disable_customization", self.disable_customization or "False"
        )
        ir_config.set_param(
            "rainbow.enable_drawer_bg", self.enable_drawer_bg or "False"
        )
        ir_config.set_param(
            "rainbow.enable_apps_category", self.enable_apps_category or "False"
        )
        ir_config.set_param("rainbow.enable_footer", self.enable_footer or "False")
        ir_config.set_param("rainbow.enable_lock", self.enable_lock or "False")
        ir_config.set_param(
            "rainbow.enable_login_theme", self.enable_login_theme or "False"
        )

    def set_values_company_favicon(self):
        company = self.sudo().env["res.company"]
        records = company.search([])

        if len(records) > 0:
            for record in records:
                record.write({"favicon": self._set_web_favicon(original=True)})
        return {
            "type": "ir.actions.client",
            "tag": "reload",
        }

    def _set_web_favicon(self, original=False):
        ir_config = self.env["ir.config_parameter"].sudo()
        favicon = ir_config.get_param("rainbow.web_icon")
        if not favicon:
            img_path = get_resource_path(
                "rainbow_community_theme", "static/src/img/favicon.png"
            )
        else:
            img_path = get_resource_path("rainbow_community_theme", favicon)

        with tools.file_open(img_path, "rb") as f:
            if original:
                return base64.b64encode(f.read())

            color = (
                randrange(32, 224, 24),
                randrange(32, 224, 24),
                randrange(32, 224, 24),
            )
            original = Image.open(f)
            new_image = Image.new("RGBA", original.size)
            height = original.size[1]
            width = original.size[0]
            bar_size = 1
            for y in range(height):
                for x in range(width):
                    pixel = original.getpixel((x, y))
                    if height - bar_size <= y + 1 <= height:
                        new_image.putpixel((x, y), (color[0], color[1], color[2], 255))
                    else:
                        new_image.putpixel(
                            (x, y), (pixel[0], pixel[1], pixel[2], pixel[3])
                        )
            stream = io.BytesIO()
            new_image.save(stream, format="ICO")
            return base64.b64encode(stream.getvalue())

    def hide_enterprise_apps(self):
        sql = "UPDATE ir_module_module SET application=FALSE  WHERE to_buy=TRUE"
        try:
            self._cr.execute(sql)
            self._cr.commit()
        except Exception as e:
            pass
        return {
            "type": "ir.actions.client",
            "tag": "reload",
        }

    def show_enterprise_apps(self):
        sql = "UPDATE ir_module_module SET application=TRUE  WHERE to_buy=TRUE"
        try:
            self._cr.execute(sql)
            self._cr.commit()
        except Exception as e:
            pass
        return {
            "type": "ir.actions.client",
            "tag": "reload",
        }

