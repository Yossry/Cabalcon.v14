# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import base64
from random import choice
from string import digits
from werkzeug.urls import url_encode

from odoo import api, fields, models, _
from odoo.osv.query import Query
from odoo.exceptions import ValidationError, AccessError
from odoo.modules.module import get_module_resource


class HrEmployeePrivate(models.Model):
    _inherit = "hr.employee"


    @api.constrains('pin')
    def _verify_pin(self):
        def _verify_pin(self):
            for employee in self:
                if employee.pin and not employee.pin.isdigit():
                    pass
