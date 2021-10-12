# -*- coding: utf-8 -*-
{
    "name": "Backmate Backend Theme Basics [For Community Edition]",
    "author": "Softhealer Technologies",
    "website": "https://www.softhealer.com",
    "support": "support@softhealer.com",
    "license": "OPL-1",
    "category": "Theme/Backend",
    "summary": "Material Backend, Responsive, Backmate Backend Theme, fully functional Backend Theme, flexible Backend Theme, fast Backend Theme, lightweight Backend Theme, animated Backend Theme, modern multipurpose theme Odoo",
    "description": """Are you bored with your standard odoo backend theme? Are You are looking for modern, creative, clean, clear, materialize Odoo theme for your backend? So you are at right place, We have made sure that this theme is highly customizable and it comes with a premium look and feel. Our theme is not only beautifully designed but also fully functional, flexible, fast, lightweight, animated and modern multipurpose theme. Our backend theme is suitable for almost every purpose.""",
    "version": "14.0.15",
    "depends":
    [
        "web",
        "sh_back_theme_config",
        "mail"
    ],

    "data":
    [
        "security/backmate_security.xml",
        "security/ir.model.access.csv",
        "data/pwa_configuraion_data.xml",
        "views/assets.xml",
        "views/login_layout.xml",
        "views/pwa_configuration_view.xml",
        "views/views.xml",
        "views/notifications_view.xml"
    ],

    "qweb":
    [
        "static/src/xml/sh_thread.xml",
        "static/src/xml/menu.xml",
        "static/src/xml/navbar.xml",
        "static/src/xml/form_view.xml",
        "static/src/xml/widget.xml",
        "static/src/xml/global_search.xml",
        "static/src/xml/base.xml",
        "static/src/xml/web_quick_menu.xml",
    ],
    'images': [
        'static/description/splash-screen.png',
        'static/description/splash-screen_screenshot.gif'
    ],
    "live_test_url": "https://softhealer.com/contact_us",
    "installable": True,
    "application": True,
    "price": 95,
    "currency": "EUR",
    "bootstrap": True
}
