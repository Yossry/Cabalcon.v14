# -*- coding: utf-8 -*-


import odoo
from odoo import http, _
from odoo.http import request
from odoo.addons.web.controllers.main import ensure_db, Home


class LockHome(Home):
    @http.route(
        "/web/lock", type="http", auth="user", website=True, sitemap=False,
    )
    def web_lock(self, **kw):
        values = request.session
        values = {
            "uid": request.session.uid,
            "login": request.session.login,
            "session_token": request.session.session_token,
            "context": request.session.context,
            "tz": request.session.tz,
        }
        lock_style = request.env["ir.http"].get_user_theme_lock_style()
        if int(lock_style) == 1:
            response = request.render("rainbow_community_theme.lock1", values)
        elif int(lock_style) == 2:
            response = request.render("rainbow_community_theme.lock2", values)
        else:
            response = request.render("rainbow_community_theme.lock2", values)

        response.headers["X-Frame-Options"] = "DENY"
        return response

    @http.route(
        "/web/unlock", type="json", auth="user", website=True, methods=["POST", "GET"]
    )
    def web_unlock(self):
        ensure_db()

        if not request.uid:
            request.uid = odoo.SUPERUSER_ID

        # values = request.params.copy()
        values = {}
        values["unlocked_state"] = False

        try:
            values["databases"] = http.db_list()
        except odoo.exceptions.AccessDenied:
            values["databases"] = None

        if request.httprequest.method == "POST":
            old_uid = request.uid
            try:
                uid = request.session.authenticate(
                    request.session.db,
                    request.params["login"],
                    request.params["password"],
                )
                values["uid"] = uid
                values["unlocked_state"] = True
            except odoo.exceptions.AccessDenied as e:
                request.uid = old_uid
                if e.args == odoo.exceptions.AccessDenied().args:
                    values["error"] = _("Wrong password!")
                else:
                    values["error"] = e.args[0]
        else:
            if "error" in request.params and request.params.get("error") == "access":
                values["error"] = _(
                    "Only employees can access this database. Please contact the administrator."
                )
        if "login" not in values and request.session.get("auth_login"):
            values["login"] = request.session.get("auth_login")

        if not odoo.tools.config["list_db"]:
            values["disable_database_manager"] = True
        # print(values)
        return values

