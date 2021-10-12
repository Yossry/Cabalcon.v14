# -*- coding: utf-8 -*-

import os
import jinja2
import json

import odoo
from odoo import http, _
from odoo.http import request
from odoo.exceptions import AccessError, UserError, AccessDenied
from odoo.addons.web.controllers.main import db_monodb, DBNAME_PATTERN, Database


path = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "views"))
loader = jinja2.FileSystemLoader(path)

env = jinja2.Environment(loader=loader, autoescape=True)
env.filters["json"] = json.dumps


class DatabaseHome(Database):
    def _render_template(self, **d):
        d.setdefault("manage", True)
        d["insecure"] = odoo.tools.config.verify_admin_password("admin")
        d["list_db"] = odoo.tools.config["list_db"]
        d["langs"] = odoo.service.db.exp_list_lang()
        d["countries"] = odoo.service.db.exp_list_countries()
        d["pattern"] = DBNAME_PATTERN
        # databases list
        d["databases"] = []
        try:
            d["databases"] = http.db_list()
            d["incompatible_databases"] = odoo.service.db.list_db_incompatible(
                d["databases"]
            )
        except odoo.exceptions.AccessDenied:
            monodb = db_monodb()
            if monodb:
                d["databases"] = [monodb]
        return env.get_template("db_manager.html").render(d)
