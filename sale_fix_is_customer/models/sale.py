# -*- coding: utf-8 -*-

from odoo import models, fields, api


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    partner_id = fields.Many2one('res.partner', string='Customer', readonly=True, states={'draft': [('readonly', False)], 'sent': [('readonly', False)]},
        required=True, change_default=True, index=True, tracking=1, domain="['|',('customer_rank','>', 0),('is_customer','=',True)]",)

