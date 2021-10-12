# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models


class ResUsers(models.Model):
    _inherit = 'res.users'

    organization_id = fields.Many2one('supertool.organization', required=False, index=True, copy=False)

