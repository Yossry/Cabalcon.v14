# -*- coding: utf-8 -*-
from odoo import api, fields, models, tools, SUPERUSER_ID, _


class IrConfigParameter(models.Model):
    _inherit = "ir.config_parameter"

    @api.model
    def get_rainbow_params(self):
        params = self.sudo().search_read(
            [("key", "=like", "rainbow.%")], fields=["key", "value"], limit=None
        )
        return params if params else None
