# -*- coding: utf-8 -*-

from odoo import models, fields, api

class AccountMove(models.Model):
    _inherit = 'account.move'

    cost_center_id = fields.Many2one('account.cost.center', index=True, string='Cost Center')