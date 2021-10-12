# -*- coding: utf-8 -*-

from odoo import models, fields, api


class AccountCostCenter(models.Model):
    _name = 'account.cost.center'
    _description = 'Account Cost Center'

    name = fields.Char(string='Cost Center', required=True, index=True)
    code = fields.Char(string='Code', required=True, index=True)
    company_id = fields.Many2one('res.company', string='Company', default=lambda self: self.env.user.company_id)
    active = fields.Boolean(string='Active', default=True)