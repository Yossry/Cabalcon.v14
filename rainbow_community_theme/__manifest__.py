# -*- coding: utf-8 -*-

{
    "name": "Rainbow Community Theme",
    "category": "Themes/Backend",
    "version": "14.0.0.2",
    "author": "RStudio",
    "description": """
Rainbow Community Theme
===========================

Backend/Launcher/Multi-level menu/Theme Settings/Custom login page/
        """,
    "depends": ["base_setup", "web", "mail", "web_database_multilingual",],
    "data": [
        "security/ir.model.access.csv",
        "data/ir_config_parameter.xml",
        "views/assets_templates.xml",
        "views/layout_templates.xml",
        "views/lock_templates.xml",
        "views/login_templates.xml",
        "views/login_form_templates.xml",
        "views/signup_templates.xml",
        "views/signup_reset_password_templates.xml",
        "views/auth_oauth_templates.xml",
        "views/res_config_settings_views.xml",
        "views/ir_ui_menu_category_views.xml",
        "views/ir_ui_menu_views.xml",
    ],
    "qweb": ["static/src/xml/*.xml",],
    "live_test_url": "https://rainbow.rstudio.xyz/",
    "license": "OPL-1",
    "auto_install": False,
    "application": True,
    "installable": True,
    "images": ["images/rainbow.png", "images/rainbow_screenshot.png"],
    "currency": "EUR",
    "price": 90,
}
